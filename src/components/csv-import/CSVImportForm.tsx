import React, { useState, useRef } from 'react';
import { Form, FormField, FormActions } from '../ui/form';
import { Button } from '../ui/button';
import { Upload, AlertCircle, Check } from 'lucide-react';
import { theme } from '../../theme';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { parseCSV } from './csvParser';
import { detectFileEncoding } from './encodingDetector';

interface CSVImportFormProps {
  onImportComplete?: () => void;
}

export function CSVImportForm({ onImportComplete }: CSVImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast({
        label: 'Veuillez sélectionner un fichier CSV',
        icon: 'AlertCircle',
        color: theme.colors.warning
      });
      return;
    }

    setLoading(true);
    setProgress(10);

    try {
      // Détecter l'encodage du fichier
      const encoding = await detectFileEncoding(file);
      setProgress(20);

      // Lire et parser le fichier CSV
      const { data, error, separator } = await parseCSV(file, encoding);
      setProgress(50);

      if (error) {
        throw new Error(error);
      }

      if (!data || data.length === 0) {
        throw new Error('Le fichier CSV est vide ou mal formaté');
      }

      // Ignorer la première ligne (en-têtes)
      const records = data.slice(1);
      setProgress(60);

      if (records.length === 0) {
        throw new Error('Aucune donnée à importer');
      }

      // Préparer les données pour l'insertion
      const importData = records.map(record => {
        // Vérifier que nous avons suffisamment de colonnes
        if (record.length < 7) {
          throw new Error(`Format de ligne invalide: ${record.join(separator)}`);
        }

        // Convertir les valeurs numériques
        const docs = record[2] ? parseInt(record[2]) : null;
        const montantMoyenHT = record[3] ? parseFloat(record[3].replace(',', '.')) : null;
        const montantMoyenTTC = record[4] ? parseFloat(record[4].replace(',', '.')) : null;
        const montantTotalHT = record[5] ? parseFloat(record[5].replace(',', '.')) : null;
        const montantTotalTTC = record[6] ? parseFloat(record[6].replace(',', '.')) : null;

        return {
          id_entite: record[0],
          date: record[1],
          horaire: record[2] || '00:00:00',
          docs_emitidos: docs,
          montant_moyen_ht: montantMoyenHT,
          montant_moyen_ttc: montantMoyenTTC,
          montant_total_ht: montantTotalHT,
          montant_total_ttc: montantTotalTTC,
          source: 'import_csv',
          date_import: new Date().toISOString()
        };
      });

      setProgress(80);

      // Insérer les données dans Supabase
      const { error: insertError } = await supabase
        .from('ca_reel_jour')
        .insert(importData);

      if (insertError) {
        throw insertError;
      }

      setProgress(100);
      showToast({
        label: `${importData.length} enregistrements importés avec succès`,
        icon: 'Check',
        color: '#10b981'
      });

      // Réinitialiser le formulaire
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Callback après import réussi
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      console.error('Erreur lors de l\'import:', err);
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors de l\'import du fichier',
        icon: 'AlertCircle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <Form size={50} onSubmit={handleSubmit}>
      <FormField 
        label="Fichier CSV" 
        required
        description="Sélectionnez un fichier CSV contenant les données de CA réel"
      >
        <div style={{ 
          border: '2px dashed var(--color-secondary)', 
          borderRadius: '0.375rem',
          padding: '1.5rem',
          textAlign: 'center',
          backgroundColor: file ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
          transition: 'all 0.2s'
        }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div style={{ marginBottom: '1rem' }}>
            <Upload size={32} style={{ margin: '0 auto', color: theme.colors.primary }} />
          </div>
          <p style={{ margin: '0 0 1rem 0' }}>
            {file ? file.name : 'Glissez-déposez votre fichier CSV ici ou cliquez pour parcourir'}
          </p>
          <Button
            type="button"
            label={file ? "Changer de fichier" : "Parcourir"}
            color={theme.colors.primary}
            onClick={() => fileInputRef.current?.click()}
          />
          {file && (
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              fontSize: '0.875rem', 
              color: 'var(--color-text-light)' 
            }}>
              {(file.size / 1024).toFixed(2)} KB
            </p>
          )}
        </div>
      </FormField>

      <div style={{ marginTop: '1rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
          <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
          Le fichier doit être au format CSV avec les colonnes suivantes:
        </p>
        <ul style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginTop: '0.5rem' }}>
          <li>ID Entité</li>
          <li>Date (YYYY-MM-DD)</li>
          <li>Horaire (HH:MM:SS)</li>
          <li>Nombre de documents</li>
          <li>Montant moyen HT</li>
          <li>Montant moyen TTC</li>
          <li>Montant total HT</li>
          <li>Montant total TTC</li>
        </ul>
      </div>

      {loading && (
        <div style={{ marginTop: '1rem' }}>
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

      <FormActions>
        <Button
          label="Importer"
          type="submit"
          icon="Upload"
          color={theme.colors.primary}
          disabled={!file || loading}
        />
      </FormActions>
    </Form>
  );
}