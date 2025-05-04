import React, { useState, useRef, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Button } from '../../components/ui/button';
import { theme } from '../../theme';
import { useToast } from '../../contexts/ToastContext';
import { parseBCP, parseABANCA } from '../../utils/parsers';
import { supabase } from '../../lib/supabase';
import { Form, FormField } from '../../components/ui/form';
import { Upload, FileText, AlertTriangle, Check, X, ChevronDown, Calendar } from 'lucide-react';

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
  const [selectedFormat, setSelectedFormat] = useState<string>("");
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
      // Utiliser la fonction RPC pour récupérer uniquement les imports non traités
      const { data, error } = await supabase.rpc('get_imports_non_traitees');

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

  const handleImport = async () => {
    if (!file) {
      showToast({
        label: 'Veuillez sélectionner un fichier à importer',
        icon: 'AlertTriangle',
        color: theme.colors.warning
      });
      return;
    }
    
    if (!selectedFormat) {
      showToast({
        label: 'Veuillez sélectionner un format d\'importation',
        icon: 'AlertTriangle',
        color: theme.colors.warning
      });
      return;
    }

    if (selectedFormat === '') {
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
      const formatCode = selectedFormat.toLowerCase();
      
      let errorDetails = [];
      if (formatCode === 'bcp') {
        try {
          lignes = parseBCP(rawText, importId, file.name);
          addLog('info', `Fichier BCP analysé: ${lignes.length} lignes trouvées`);
        } catch (error) {
          // Capturer les détails d'erreur pour un meilleur affichage
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          
          // Extraire les détails des erreurs s'ils existent
          const errorLines = errorMessage.split('\n');
          if (errorLines.length > 1) {
            // Premier élément est le message principal
            addLog('error', errorLines[0]);
            
            // Les lignes suivantes sont les détails
            for (let i = 1; i < Math.min(errorLines.length, 6); i++) {
              addLog('warning', errorLines[i]);
            }
            
            if (errorLines.length > 6) {
              addLog('warning', `... et ${errorLines.length - 6} autres erreurs.`);
            }
          } else {
            addLog('error', errorMessage);
          }
          
          throw new Error(errorMessage);
        }
      } else if (formatCode === 'abanca') {
        const fileBuffer = await file.arrayBuffer();
        lignes = parseABANCA(fileBuffer, importId, file.name);
        addLog('info', `Fichier ABANCA analysé: ${lignes.length} lignes trouvées`);
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
        .upsert(lignes, {
          onConflict: 'conta,data_valor,valor,saldo,descricao',
          ignoreDuplicates: true
        });

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

  const handlePostImportProcessing = async () => {
    try {
      setLoading(true);
      setLogs([]);
      setProgress(0);
      addLog('info', 'Début du traitement post-import');
      setProgress(10);

      // Étape 1 : récupérer les lignes de fin_bq_import non encore transférées
      const { data: lignes, error: importError } = await supabase.rpc('get_imports_non_traitees');

      if (importError) throw importError;
      setProgress(15);

      if (!lignes || lignes.length === 0) {
        addLog('info', 'Aucune ligne à traiter.');
        showToast({
          label: 'Aucune ligne à traiter',
          icon: 'Info',
          color: theme.colors.secondary
        });
        setLoading(false);
        return;
      }

      addLog('info', `${lignes.length} lignes à traiter`);
      setProgress(20);
      const mouvements = [];
      let processed = 0;
      const totalLines = lignes.length;

      // Étape 2 : Récupérer les comptes bancaires correspondants
      for (const ligne of lignes) {
        const { data: comptes, error: compteError } = await supabase
          .from('fin_compte_bancaire')
          .select('id, iban')
          .ilike('iban', `%${(ligne.conta || '').replace(/^0+/, '').trim()}%`);

        if (compteError) {
          addLog('error', `Erreur lors de la recherche du compte pour ${ligne.conta}`, compteError.message);
          continue;
        }

        if (!comptes || comptes.length === 0) {
          addLog('warning', `Aucun compte trouvé pour le champ 'conta': ${ligne.conta}`);
          continue;
        }

        const compte = comptes[0];
        const mouvement = {
          id_compte: compte.id,
          data_lancamento: ligne.data_lancamento,
          data_valor: ligne.data_valor,
          descricao: ligne.descricao,
          valor: ligne.valor,
          saldo: ligne.saldo,
          referencia_doc: ligne.referencia_doc,
          import_bq_id: ligne.id
        };
        mouvements.push(mouvement);
        
        // Mise à jour de la progression
        processed++;
        const currentProgress = 20 + Math.floor((processed / totalLines) * 40); // De 20% à 60%
        setProgress(currentProgress);
      }

      if (mouvements.length === 0) {
        const message = 'Aucun mouvement à insérer après filtrage';
        
        addLog('warning', message);
        showToast({
          label: message,
          icon: 'AlertTriangle',
          color: theme.colors.warning
        });
        setLoading(false);
        return;
      }

      setProgress(60);
      
      // Étape 3 : Insertion des mouvements avec gestion des doublons
      const BATCH_SIZE = 50;
      let successCount = 0;
      let duplicateCount = 0;
      
      for (let i = 0; i < mouvements.length; i += BATCH_SIZE) {
        const batch = mouvements.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i/BATCH_SIZE) + 1;
        
        try {
          // Pour chaque mouvement du lot, vérifier s'il existe déjà
          for (const mouvement of batch) {
            const { data: existing } = await supabase
              .from('fin_bq_Mouvement')
              .select('id')
              .eq('id_compte', mouvement.id_compte)
              .eq('data_valor', mouvement.data_valor)
              .eq('valor', mouvement.valor)
              .eq('saldo', mouvement.saldo)
              .eq('descricao', mouvement.descricao);

            if (!existing || existing.length === 0) {
              // Le mouvement n'existe pas, on peut l'insérer
              const { error: insertError } = await supabase
                .from('fin_bq_Mouvement')
                .insert([mouvement]);

              if (insertError) {
                throw insertError;
              }
              successCount++;
            } else {
              duplicateCount++;
            }
          }

          addLog('success', `Lot ${batchNumber}: traitement terminé`);
          
          // Mise à jour de la progression
          const currentProgress = 60 + Math.floor((i + batch.length) / mouvements.length * 40);
          setProgress(currentProgress);
          
        } catch (err) {
          addLog('error', `Erreur lors du traitement du lot ${batchNumber}`, 
            err instanceof Error ? err.message : 'Erreur inconnue');
        }
      }

      setProgress(100);

      const summaryMessage = `Traitement terminé: ${successCount} écritures importées, ${duplicateCount} doublons ignorés.`;
      addLog('success', summaryMessage);
      showToast({
        label: summaryMessage,
        icon: 'Check',
        color: '#10b981'
      });

    } catch (err) {
      setProgress(0);
      addLog('error', 'Erreur pendant le traitement post-import', err instanceof Error ? err.message : '');
      showToast({
        label: 'Erreur pendant le traitement',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
      // Rafraîchir la liste des imports après traitement
      fetchImports();
    }
  };

  return (
    <PageSection
      title="Import des relevés bancaires"
      description="Importez vos relevés bancaires au format CSV ou Excel"
    >
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
          border: `2px dashed ${dragActive ? theme.colors.primary : '#e5e7eb'}`,
          borderRadius: '0.5rem',
          padding: '0.75rem',
          textAlign: 'center',
          backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
          transition: 'all 0.2s',
          flex: '1',
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          height: '42px'
          }}
        >
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <FileText size={18} style={{ color: theme.colors.primary }} />
              <span>{file.name}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={18} style={{ color: theme.colors.primary }} />
              <span style={{ fontSize: '0.875rem' }}>
                Glissez un fichier CSV/Excel ou <span 
                style={{ 
                  color: theme.colors.primary, 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                parcourez
              </span>
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        <FormField label="Format du fichier" required style={{ margin: 0 }}>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            style={{
              width: '180px',
              padding: '0.625rem 0.75rem',
              border: `2px solid ${file ? theme.colors.primary : 'var(--color-secondary)'}`,
              borderRadius: '0.375rem',
              backgroundColor: 'var(--color-white)',
              color: selectedFormat ? 'var(--color-text)' : 'var(--color-text-light)',
              fontSize: '0.875rem'
            }}
            required
          >
            <option value="" disabled>Choisir un format</option>
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
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Button
          label={loading ? "Importation en cours..." : "Importer"}
          icon={loading ? "Loader" : "Upload"}
          color={theme.colors.primary}
          onClick={handleImport}
          disabled={!file || loading || !selectedFormat}
        />
        <Button
          label="Traiter les écritures"
          icon="Database"
          color={theme.colors.primary}
          onClick={handlePostImportProcessing}
          disabled={loading}
        />
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

      {file && selectedFormat === "" && (
        <div style={{ 
          marginTop: '1rem', 
          marginBottom: '1.5rem', 
          padding: '0.75rem', 
          backgroundColor: '#e0f2fe', 
          borderRadius: '0.375rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <AlertTriangle size={18} style={{ color: theme.colors.primary, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            Veuillez sélectionner un format d'importation pour continuer.
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

      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem', fontWeight: 600 }}>Liste des opérations bancaires à traiter</h3>
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--color-text-light)', 
            marginBottom: '0.5rem',
            fontStyle: 'italic'
          }}>
            {imports.length} opération(s) à traiter
          </div>
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
                    Aucune opération à traiter. Toutes les écritures ont déjà été traitées.
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
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '1rem' }}>Informations</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Informations importantes</h4>
            <ul style={{ fontSize: '0.875rem', color: 'var(--color-text)', margin: 0, paddingLeft: '1.25rem' }}>
              <li>Les fichiers doivent être au format CSV ou Excel</li>
              <li>Le format d'importation doit correspondre à la banque émettrice</li>
              <li>Les doublons sont automatiquement détectés et ignorés</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Formats supportés</h4>
            <ul style={{ fontSize: '0.875rem', color: 'var(--color-text)', margin: 0, paddingLeft: '1.25rem' }}>
              {importFormats.map(format => (
                <li key={format.id}>{format.nom_affichage}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageSection>
  );
}

export default ImportBankStatements;