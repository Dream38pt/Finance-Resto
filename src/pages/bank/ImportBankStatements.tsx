import React, { useState, useRef, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Button } from '../../components/ui/button';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { theme } from '../../theme';
import { useToast } from '../../contexts/ToastContext';
import { parseBCP } from '../../utils/bankImport';
import { supabase } from '../../lib/supabase';
import { Upload, FileText, AlertTriangle, Check, X, ChevronDown, Calendar, Database } from 'lucide-react';

interface ImportFormat {
  id: string;
  code: string;
  nom_affichage: string;
  type_fichier: string;
}

interface BankImport {
  id: number;
  import_id: string;
  companhia: string | null;
  produto: string | null;
  conta: string | null;
  moeda: string | null;
  data_lancamento: string | null;
  data_valor: string | null;
  descricao: string | null;
  valor: number | null;
  saldo: number | null;
  referencia_doc: string | null;
  created_at: string;
  nom_fichier: string | null;
}

function ImportBankStatements() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [logs, setLogs] = useState<{ type: 'success' | 'warning' | 'error' | 'info'; message: string; details?: string }[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<string>('bcp');
  const [importFormats, setImportFormats] = useState<ImportFormat[]>([]);
  const [imports, setImports] = useState<BankImport[]>([]);
  const [importCount, setImportCount] = useState<number>(0);
  const [loadingImports, setLoadingImports] = useState(false);

  useEffect(() => {
    // Récupérer les formats d'importation depuis la base de données
    const fetchImportFormats = async () => {
      try {
        const { data, error } = await supabase
          .from('fin_bq_format_import')
          .select('id, code, nom_affichage, type_fichier')
          .eq('actif', true)
          .order('nom_affichage');

        if (error) throw error;
        setImportFormats(data || []);
        
        // Sélectionner le premier format par défaut s'il y en a
        if (data && data.length > 0 && !selectedFormat) {
          setSelectedFormat(data[0].code);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des formats d\'importation:', err);
        showToast({
          label: 'Erreur lors du chargement des formats d\'importation',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };

    fetchImportFormats();
    fetchImports();
  }, []);
  
  const fetchImports = async () => {
    setLoadingImports(true);
    try {
      const { data, error } = await supabase
        .from('fin_bq_import')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setImports(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des imports:', err);
      showToast({
        label: 'Erreur lors du chargement des imports',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoadingImports(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Vérifier l'extension du fichier
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      showToast({
        label: 'Veuillez sélectionner un fichier CSV ou Excel',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setFile(selectedFile);
    setLogs([]);
  };

  const addLog = (type: 'success' | 'warning' | 'error' | 'info', message: string, details?: string) => {
    setLogs(prev => [...prev, { type, message, details }]);
  };

  const getFormatByCode = (code: string): ImportFormat | undefined => {
    return importFormats.find(format => format.code === code);
  };

  const handleImport = async () => {
    if (!file) {
      showToast({
        label: 'Veuillez sélectionner un fichier à importer',
        icon: 'AlertTriangle',
        color: theme.colors.warning
      });
      return;
    }

    setLoading(true);
    setProgress(10);
    setLogs([]);

    try {
      // 1. Générer un ID d'import unique
      const importId = crypto.randomUUID();
      addLog('info', `Début de l'importation du fichier: ${file.name} (format: ${selectedFormat})`);
      setProgress(20);

      // 2. Lire le contenu du fichier comme texte brut
      const rawText = await file.text();
      setProgress(30);
      
      // 3. Parser le fichier selon le format sélectionné
      let lignes = [];
      if (selectedFormat === 'bcp') {
        lignes = parseBCP(rawText, importId, file.name);
        addLog('info', `Fichier analysé: ${lignes.length} lignes trouvées`);
      } else {
        throw new Error(`Format d'importation non supporté: ${selectedFormat}`);
      }

      if (lignes.length === 0) {
        throw new Error('Aucune ligne valide trouvée dans le fichier');
      }

      setProgress(50);

      // 4. Insérer les lignes dans la table fin_bq_import
      const { error: importError } = await supabase
        .from('fin_bq_import')
        .insert(lignes);

      if (importError) {
        if (importError.code === '23505') { // Code pour violation de contrainte d'unicité
          addLog('warning', 'Certaines opérations ont été ignorées (déjà existantes).');
        } else {
          throw importError;
        }
      } else {
        addLog('success', `${lignes.length} opérations importées avec succès.`);
        setImportCount(lignes.length);
      }

      setProgress(80);

      // 5. Rafraîchir la liste des imports
      await fetchImports();
      setProgress(100);

      addLog('success', `Importation terminée avec succès! ${importCount} opérations importées.`);
      showToast({
        label: `Importation terminée: ${importCount} opérations importées`,
        icon: 'Check',
        color: '#10b981'
      });

    } catch (err) {
      console.error('Erreur lors de l\'importation:', err);
      addLog('error', `Erreur lors de l'importation: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors de l\'importation',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (type: 'success' | 'warning' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />;
      case 'error':
        return <X size={16} style={{ color: '#ef4444', flexShrink: 0 }} />;
      case 'info':
        return <FileText size={16} style={{ color: theme.colors.primary, flexShrink: 0 }} />;
    }
  };

  const getLogColor = (type: 'success' | 'warning' | 'error' | 'info') => {
    switch (type) {
      case 'success': return '#dcfce7';
      case 'warning': return '#fef3c7';
      case 'error': return '#fee2e2';
      case 'info': return '#e0f2fe';
    }
  };

  return (
    <PageSection
      title="Import des relevés bancaires"
      description="Importez vos relevés bancaires au format CSV ou Excel"
    >
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? theme.colors.primary : '#e5e7eb'}`,
          borderRadius: '0.5rem',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
          transition: 'all 0.2s',
          marginBottom: '1.5rem'
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <FileText size={24} style={{ color: theme.colors.primary }} />
            <span>{file.name}</span>
          </div>
        ) : (
          <>
            <Upload size={32} style={{ color: theme.colors.primary, margin: '0 auto 1rem' }} />
            <p style={{ margin: '0 0 0.5rem 0' }}>
              Glissez et déposez un fichier CSV ou Excel ici, ou
            </p>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Button
                label="Parcourir"
                color={theme.colors.primary}
                type="button"
                onClick={() => fileInputRef.current?.click()}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
          </>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <Form size={70}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Format du fichier" required>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: `2px solid ${file ? theme.colors.primary : 'var(--color-secondary)'}`,
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem'
                }}
              >
                {importFormats.length === 0 ? (
                  <option value="">Aucun format disponible</option>
                ) : (
                  importFormats.map(format => (
                    <option key={format.id} value={format.code}>
                      {format.nom_affichage}
                    </option>
                  ))
                )}
              </select>
            </FormField>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button
              label={loading ? "Importation en cours..." : "Importer"}
              icon={loading ? "Loader" : "Upload"}
              color={theme.colors.primary}
              onClick={handleImport}
              disabled={!file || loading}
            />
          </div>
        </Form>
      </div>

      {loading && (
        <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${progress}%`, 
              height: '100%', 
              backgroundColor: theme.colors.primary,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ 
            textAlign: 'center', 
            marginTop: '0.5rem', 
            fontSize: '0.875rem', 
            color: 'var(--color-text-light)' 
          }}>
            Importation en cours... {progress}%
          </p>
        </div>
      )}

      {logs.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.375rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              Journal d'importation
            </h3>
            <button
              onClick={() => setShowLogs(!showLogs)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-light)',
                fontSize: '0.875rem'
              }}
            >
              {showLogs ? 'Masquer' : 'Afficher'}
              <ChevronDown 
                size={16} 
                style={{ 
                  transform: showLogs ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }} 
              />
            </button>
          </div>
          
          {showLogs && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  style={{ 
                    padding: '0.75rem', 
                    backgroundColor: getLogColor(log.type),
                    borderRadius: '0.375rem',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-start'
                  }}
                >
                  {getLogIcon(log.type)}
                  <div>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>{log.message}</p>
                    {log.details && (
                      <p style={{ 
                        margin: '0.25rem 0 0 0', 
                        fontSize: '0.75rem', 
                        color: 'var(--color-text-light)',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PageSection
        subtitle="Historique des imports"
        description="Liste des derniers fichiers importés"
      >
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date d'import</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Fichier</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Compte</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Monnaie</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date valeur</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Montant</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Solde</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {loadingImports ? (
                <tr>
                  <td colSpan={8} style={{ padding: '16px', textAlign: 'center' }}>
                    Chargement des données...
                  </td>
                </tr>
              ) : imports.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '16px', textAlign: 'center' }}>
                    Aucun import trouvé.
                  </td>
                </tr>
              ) : (
                imports.map((importItem) => (
                  <tr key={importItem.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} style={{ color: theme.colors.primary }} />
                        {new Date(importItem.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} style={{ color: theme.colors.primary }} />
                        {importItem.nom_fichier || 'Import manuel'}
                      </div>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{importItem.conta || '-'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                          {importItem.companhia || '-'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {importItem.moeda || '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {importItem.data_valor ? new Date(importItem.data_valor).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {importItem.valor !== null ? importItem.valor.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {importItem.saldo !== null ? importItem.saldo.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {importItem.descricao || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PageSection>

      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '1rem' }}>Instructions d'importation</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Informations importantes</h4>
            <ul style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', paddingLeft: '1.5rem', margin: 0 }}>
              <li>Pour le format BCP, le fichier doit être au format texte tabulé (extension .xls mais contenu texte)</li>
              <li>Les doublons sont automatiquement évités lors de l'importation</li>
              <li>L'association avec un compte bancaire se fera dans une étape ultérieure</li>
            </ul>
          </div>
          
          {importFormats.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Formats disponibles</h4>
              <ul style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', paddingLeft: '1.5rem', margin: 0 }}>
                {importFormats.map(format => (
                  <li key={format.id}>
                    <strong>{format.nom_affichage}</strong> - {format.type_fichier.toUpperCase()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
    </PageSection>
  );
}

export default ImportBankStatements;