import React, { useState, useRef } from 'react';
import { X, FileText, Upload, AlertCircle, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { theme } from '../../theme';
import { useToast } from '../../contexts/ToastContext';
import { processCSVData } from './csvProcessor';
import { detectFileEncoding } from './encodingDetector';
import { supabase } from '../../lib/supabase';

interface CSVImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function CSVImportDialog({
  isOpen,
  onClose,
  onImportComplete
}: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [encodingError, setEncodingError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'importing' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

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
    setEncodingError(null);
    setValidationErrors([]);
    setImportStatus('idle');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const validateAndImportFile = async () => {
    if (!file) return;
    
    setImportStatus('validating');
    setValidationErrors([]);
    
    try {
      // Lire le fichier
      setEncodingError(null);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const csvContent = e.target?.result as string;
        
        try {
          // Valider et traiter les données CSV
          // Vérifier l'encodage du fichier
          const encodingIssue = detectFileEncoding(csvContent);
          if (encodingIssue) {
            setEncodingError(encodingIssue);
            setImportStatus('error');
            return;
          }
          const { data, errors } = await processCSVData(csvContent);
          
          if (errors.length > 0) {
            setValidationErrors(errors);
            setImportStatus('error');
            return;
          }
          
          // Si la validation est réussie, importer les données
          setImportStatus('importing');
          setImporting(true);
          
          // Insérer les données dans la base de données
          const { error: insertError } = await supabase
            .from('ca_reel_jour')
            .insert(data);
          
          if (insertError) {
            throw new Error(`Erreur lors de l'importation: ${insertError.message}`);
          }
          
          setImportStatus('success');
          showToast({
            label: `${data.length} enregistrements importés avec succès`,
            icon: 'Check',
            color: '#10b981'
          });
          
          // Attendre un peu avant de fermer la boîte de dialogue
          setTimeout(() => {
            onImportComplete();
            onClose();
          }, 1500);
          
        } catch (error) {
          console.error('Erreur lors du traitement du fichier:', error);
          setImportStatus('error');
          setValidationErrors([error instanceof Error ? error.message : 'Erreur lors du traitement du fichier']);
        } finally {
          setImporting(false);
        }
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      setImportStatus('error');
      setValidationErrors([error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier']);
      setImporting(false);
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
        maxWidth: '600px',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
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
          Importer des données de vente
        </h2>

        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-light)' }}>
          Importez un fichier CSV contenant les données de vente. Le fichier doit contenir les colonnes suivantes:
          Entite, Date, Heure, Docs Emitidos, Media p/Doc S/IVA, Media P/Doc, Valor S/IVA, Valor Total.
        </p>

        {importStatus !== 'success' && (
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

        {encodingError && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '0.375rem',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#b91c1c' }}>{encodingError}</p>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '0.375rem',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <AlertCircle size={16} style={{ color: '#ef4444' }} />
              <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#b91c1c' }}>
                Erreurs de validation
              </h3>
            </div>
            <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0, fontSize: '0.875rem', color: '#b91c1c' }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {importStatus === 'success' && (
          <div style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #10b981',
            borderRadius: '0.375rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <Check size={48} style={{ color: '#10b981' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#047857' }}>
              Importation réussie
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#047857', textAlign: 'center' }}>
              Les données ont été importées avec succès dans la base de données.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
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
            onClick={validateAndImportFile}
            disabled={!file || importing || importStatus === 'success'}
          />
        </div>
      </div>
    </div>
  );
}