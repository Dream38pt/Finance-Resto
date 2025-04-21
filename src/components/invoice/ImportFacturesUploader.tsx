import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Check, FileText, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { theme } from '../../theme';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import Papa from 'papaparse';

// Définition des types
interface ImportFacturesUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface CSVRow {
  restaurant: string;
  code_frs: string;
  nom_frs: string;
  numero_doc: string;
  date_facture: string;
  mode_paiement: string;
  ttc: string;
  ht: string;
  tva: string;
  vivres: string;
  boissons: string;
  mnr: string;
  divers: string;
  energie: string;
  nettoyage: string;
}

interface LogEntry {
  type: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

interface CategoryMapping {
  [key: string]: string | null;
}

export function ImportFacturesUploader({
  isOpen,
  onClose,
  onImportComplete
}: ImportFacturesUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Mapping des noms de colonnes CSV vers les catégories dans la base de données
  const categoryMappings: CategoryMapping = {
    'vivres': 'Vivres',
    'boissons': 'Boissons',
    'mnr': 'MNR',
    'divers': 'Divers',
    'energie': 'Énergie',
    'nettoyage': 'Nettoyage'
  };

  if (!isOpen) return null;

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
    if (!fileName.endsWith('.csv')) {
      showToast({
        label: 'Veuillez sélectionner un fichier CSV',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setFile(selectedFile);
    setLogs([]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const addLog = (type: 'success' | 'warning' | 'error', message: string, details?: string) => {
    setLogs(prev => [...prev, { type, message, details }]);
  };

  const parseDate = (dateStr: string): string => {
    // Format attendu: DD/MM/YYYY
    try {
      const parts = dateStr.split('/');
      if (parts.length !== 3) throw new Error('Format de date invalide');
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (isNaN(day) || isNaN(month) || isNaN(year) || 
          day < 1 || day > 31 || month < 1 || month > 12) {
        throw new Error('Valeurs de date invalides');
      }
      
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    } catch (error) {
      throw new Error(`Date "${dateStr}" invalide. Format attendu: JJ/MM/AAAA`);
    }
  };

  const parseAmount = (amountStr: string): number => {
    if (!amountStr || amountStr.trim() === '') return 0;
    
    // Nettoyer la valeur (supprimer les espaces, remplacer les virgules par des points)
    const cleanedValue = amountStr.trim().replace(/\s/g, '').replace(/,/g, '.');
    const numericValue = parseFloat(cleanedValue);
    
    if (isNaN(numericValue)) {
      throw new Error(`Valeur numérique invalide: ${amountStr}`);
    }
    
    return numericValue;
  };

  const importCSV = async () => {
    if (!file) return;
    
    setImporting(true);
    setProgress(0);
    setLogs([]);
    
    try {
      // Récupérer les entités
      const { data: entitesData, error: entitesError } = await supabase
        .from('entite')
        .select('id, code');
      
      if (entitesError) throw entitesError;
      
      const entitesMap = new Map<string, string>();
      entitesData?.forEach(entite => {
        entitesMap.set(entite.code, entite.id);
      });
      
      // Récupérer les fournisseurs
      const { data: tiersData, error: tiersError } = await supabase
        .from('fin_tiers')
        .select('id, code');
      
      if (tiersError) throw tiersError;
      
      const tiersMap = new Map<string, string>();
      tiersData?.forEach(tiers => {
        tiersMap.set(tiers.code, tiers.id);
      });
      
      // Récupérer les modes de paiement
      const { data: modesData, error: modesError } = await supabase
        .from('fin_mode_paiement')
        .select('id, code');
      
      if (modesError) throw modesError;
      
      const modesMap = new Map<string, string>();
      modesData?.forEach(mode => {
        modesMap.set(mode.code, mode.id);
      });
      
      // Récupérer les catégories d'achat
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('fin_categorie_achat')
        .select('id, libelle');
      
      if (categoriesError) throw categoriesError;
      
      const categoriesMap = new Map<string, string>();
      categoriesData?.forEach(cat => {
        categoriesMap.set(cat.libelle, cat.id);
      });
      
      // Parser le fichier CSV
      Papa.parse(file, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data as CSVRow[];
          let successCount = 0;
          let warningCount = 0;
          let errorCount = 0;
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            setProgress(Math.round((i / rows.length) * 100));
            
            try {
              // Vérifier que le restaurant existe
              const entiteId = entitesMap.get(row.restaurant);
              if (!entiteId) {
                addLog('error', `Ligne ${i+1}: Restaurant "${row.restaurant}" non trouvé`, JSON.stringify(row));
                errorCount++;
                continue;
              }
              
              // Vérifier que le fournisseur existe
              const tiersId = tiersMap.get(row.code_frs);
              if (!tiersId) {
                addLog('error', `Ligne ${i+1}: Fournisseur "${row.code_frs}" non trouvé`, JSON.stringify(row));
                errorCount++;
                continue;
              }
              
              // Vérifier le mode de paiement
              let modePaiementId: string;
              let modePaiementLabel: string;
              
              switch (row.mode_paiement) {
                case 'CB':
                  modePaiementLabel = 'Carte bancaire';
                  modePaiementId = modesMap.get('CB') || '';
                  break;
                case 'C':
                  modePaiementLabel = 'Caisse';
                  modePaiementId = modesMap.get('CAISSE') || '';
                  break;
                default:
                  modePaiementLabel = 'Autre';
                  modePaiementId = modesMap.get(row.mode_paiement) || '';
                  addLog('warning', `Ligne ${i+1}: Mode de paiement "${row.mode_paiement}" non reconnu, valeur "Autre" utilisée.`, JSON.stringify(row));
                  warningCount++;
              }
              
              if (!modePaiementId) {
                addLog('warning', `Ligne ${i+1}: Mode de paiement "${modePaiementLabel}" non trouvé dans la base de données, utilisation du mode par défaut`, JSON.stringify(row));
                // Utiliser le premier mode de paiement disponible
                modePaiementId = modesMap.values().next().value;
                warningCount++;
              }
              
              // Parser les montants
              const montantHT = parseAmount(row.ht);
              const montantTVA = parseAmount(row.tva);
              const montantTTC = parseAmount(row.ttc);
              
              // Parser la date
              const dateFacture = parseDate(row.date_facture);
              
              // Créer la facture
              const { data: factureData, error: factureError } = await supabase
                .from('fin_facture_achat')
                .insert([{
                  entite_id: entiteId,
                  tiers_id: tiersId,
                  numero_document: row.numero_doc || null,
                  date_facture: dateFacture,
                  montant_ht: montantHT,
                  montant_tva: montantTVA,
                  montant_ttc: montantTTC,
                  mode_paiement_id: modePaiementId,
                  commentaire: `Importé automatiquement le ${new Date().toLocaleDateString('fr-FR')}`,
                  statut: 'validé'
                }])
                .select()
                .single();
              
              if (factureError) throw factureError;
              
              // Créer les lignes de facture
              const lignesFacture = [];
              let categoriesManquantes = false;
              let totalLignesHT = 0;
              
              for (const [key, value] of Object.entries(categoryMappings)) {
                if (row[key as keyof CSVRow] && parseAmount(row[key as keyof CSVRow]) > 0) {
                  const montant = parseAmount(row[key as keyof CSVRow]);
                  totalLignesHT += montant;
                  const categorieId = categoriesMap.get(value || '');
                  
                  if (!categorieId) {
                    addLog('warning', `Ligne ${i+1}: Catégorie "${value}" non trouvée pour la ligne ${key}`, JSON.stringify(row));
                    categoriesManquantes = true;
                    warningCount++;
                    continue;
                  }
                  
                  lignesFacture.push({
                    facture_id: factureData.id,
                    categorie_id: categorieId,
                    designation: `${value} - ${row.nom_frs}`,
                    quantite: 1, // Valeur par défaut
                    prix_unitaire_ht: montant, // Le montant HT devient le prix unitaire
                    montant_ht: montant,
                    montant_tva: 0, // Par défaut, la TVA est mise à 0 et sera répartie proportionnellement
                    commentaire: `Importé depuis CSV - ${key}`
                  });
                }
              }
              
              // Si aucune ligne n'a été créée, créer une ligne par défaut
              if (lignesFacture.length === 0) {
                const defaultCategorieId = categoriesMap.get('Divers');
                if (defaultCategorieId) {
                  lignesFacture.push({
                    facture_id: factureData.id,
                    categorie_id: defaultCategorieId,
                    designation: `Facture ${row.numero_doc || 'sans numéro'} - ${row.nom_frs}`,
                    quantite: 1, // Valeur par défaut
                    prix_unitaire_ht: montantHT, // Le montant HT devient le prix unitaire
                    montant_ht: montantHT,
                    montant_tva: montantTVA,
                    commentaire: `Importé depuis CSV - Ligne par défaut`
                  });
                } else {
                  addLog('warning', `Ligne ${i+1}: Aucune catégorie trouvée pour créer une ligne par défaut`, JSON.stringify(row));
                  warningCount++;
                }
              } else {
                // Répartir la TVA proportionnellement entre les lignes
                const totalHT = lignesFacture.reduce((sum, ligne) => sum + ligne.montant_ht, 0);
                
                // Vérifier si le total des lignes correspond au montant HT de la facture
                if (Math.abs(totalHT - montantHT) > 0.01) {
                  addLog('warning', `Ligne ${i+1}: Différence entre le total des lignes (${totalHT.toFixed(2)}) et le montant HT de la facture (${montantHT.toFixed(2)})`, JSON.stringify(row));
                  warningCount++;
                }
                
                lignesFacture.forEach(ligne => {
                  ligne.montant_tva = totalHT > 0 ? (ligne.montant_ht / totalHT) * montantTVA : 0;
                });
              }
              
              // Insérer les lignes de facture
              if (lignesFacture.length > 0) {
                const { error: lignesError } = await supabase
                  .from('fin_ligne_facture_achat')
                  .insert(lignesFacture);
                
                if (lignesError) throw lignesError;
              }
              
              if (categoriesManquantes) {
                addLog('warning', `Ligne ${i+1}: Facture créée avec des avertissements`, `Facture ${row.numero_doc || 'sans numéro'} - ${row.nom_frs}`);
              } else {
                addLog('success', `Ligne ${i+1}: Facture créée avec succès`, `Facture ${row.numero_doc || 'sans numéro'} - ${row.nom_frs}`);
                successCount++;
              }
            } catch (error) {
              addLog('error', `Ligne ${i+1}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, JSON.stringify(row));
              errorCount++;
            }
          }
          
          setProgress(100);
          showToast({
            label: `Import terminé: ${successCount} réussites, ${warningCount} avertissements, ${errorCount} erreurs`,
            icon: successCount > 0 ? 'Check' : 'AlertTriangle',
            color: successCount > 0 ? '#10b981' : '#f59e0b',
            duration: 5000
          });
          
          // Attendre un peu avant de permettre la fermeture
          setTimeout(() => {
            setImporting(false);
            if (successCount > 0) {
              onImportComplete();
            }
          }, 1000);
        },
        error: (error) => {
          addLog('error', `Erreur lors du parsing du fichier: ${error.message}`);
          setImporting(false);
          showToast({
            label: `Erreur lors du parsing du fichier: ${error.message}`,
            icon: 'AlertTriangle',
            color: '#ef4444'
          });
        }
      });
    } catch (error) {
      setImporting(false);
      showToast({
        label: error instanceof Error ? error.message : 'Erreur lors de l\'import',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const getLogIcon = (type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />;
      case 'warning':
        return <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />;
      case 'error':
        return <X size={16} style={{ color: '#ef4444', flexShrink: 0 }} />;
    }
  };

  const getLogColor = (type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success': return '#dcfce7';
      case 'warning': return '#fef3c7';
      case 'error': return '#fee2e2';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        width: '100%',
        maxWidth: '800px',
        position: 'relative',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            color: 'var(--color-text-light)',
            transition: 'all 0.2s'
          }}
          disabled={importing}
        >
          <X size={20} />
        </button>

        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
          Importer des factures
        </h2>

        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-light)' }}>
          Importez un fichier CSV contenant des factures. Le fichier doit utiliser le séparateur <strong>;</strong> et contenir les colonnes suivantes:
          restaurant, code_frs, nom_frs, numero_doc, date_facture, mode_paiement, ttc, ht, tva, vivres, boissons, mnr, divers, energie, nettoyage.
        </p>
        
        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-light)' }}>
          <strong>Note:</strong> Pour chaque catégorie analytique (vivres, boissons, etc.), une ligne de facture sera créée avec une quantité de 1 et le montant comme prix unitaire.
        </p>

        {!importing && (
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
                  Glissez et déposez un fichier CSV ici, ou
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
                    accept=".csv"
                    onChange={handleFileInputChange}
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
        )}

        {importing && (
          <div style={{ marginBottom: '1.5rem' }}>
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
          <div style={{ marginBottom: '1.5rem', overflowY: 'auto', maxHeight: '300px' }}>
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

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: 'auto' }}>
          <Button
            label="Annuler"
            color={theme.colors.secondary}
            onClick={onClose}
            disabled={importing}
          />
          <Button
            label={importing ? "Importation en cours..." : "Importer"}
            color={theme.colors.primary}
            icon="Upload"
            onClick={importCSV}
            disabled={!file || importing}
          />
        </div>
      </div>
    </div>
  );
}