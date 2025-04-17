import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Dropdown } from '../../components/ui/dropdown';
import { FileText, Image } from 'lucide-react';
import { theme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import type { InvoiceFormData } from '../../types/invoice';

function NewInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [entites, setEntites] = useState<{ id: string; code: string; libelle: string; }[]>([]);
  const [tiers, setTiers] = useState<{ id: string; code: string; nom: string; }[]>([]);
  const [modesPaiement, setModesPaiement] = useState<{ id: string; code: string; libelle: string; }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<InvoiceFormData>({
    entite_id: location.state?.selectedEntiteId || '',
    tiers_id: '',
    numero_document: '',
    date_facture: new Date().toISOString().split('T')[0],
    montant_ht: '',
    montant_tva: '',
    montant_ttc: '',
    mode_paiement_id: '',
    commentaire: '',
    file: null
  });

  // Chargement des données de référence
  React.useEffect(() => {
    async function fetchData() {
      try {
        // Entités
        const { data: entitesData } = await supabase
          .from('entite')
          .select('id, code, libelle')
          .order('code');
        if (entitesData) setEntites(entitesData);

        // Tiers
        const { data: tiersData } = await supabase
          .from('fin_tiers')
          .select('id, code, nom')
          .eq('actif', true)
          .order('nom');
        if (tiersData) setTiers(tiersData);

        // Modes de paiement
        const { data: modesData } = await supabase
          .from('fin_mode_paiement')
          .select('id, code, libelle')
          .eq('actif', true)
          .order('ordre_affichage')
          .order('code');
        if (modesData) setModesPaiement(modesData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    }
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0] || null;
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, file }));
      return;
    }

    if (type === 'number') {
      setFormData(prev => {
        const numValue = value === '' ? '' : parseFloat(value);
        const newState = { ...prev, [name]: numValue };

        // Calculs automatiques selon le champ modifié
        if (name === 'montant_ht' || name === 'montant_tva' || name === 'montant_ttc') {
          const ht = name === 'montant_ht' ? parseFloat(value) || 0 : parseFloat(prev.montant_ht) || 0;
          const tva = name === 'montant_tva' ? parseFloat(value) || 0 : parseFloat(prev.montant_tva) || 0;
          const ttc = name === 'montant_ttc' ? parseFloat(value) || 0 : ht + tva;

          if (name === 'montant_ttc') {
            // Si on modifie le TTC, on ajuste la TVA
            newState.montant_ttc = ttc;
            newState.montant_tva = Math.max(0, ttc - ht);
          } else {
            // Si on modifie HT ou TVA, on ajuste le TTC
            newState.montant_ttc = ht + tva;
          }
        }

        return newState;
      });
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'xls', 'xlsx'];
    const maxSize = 10 * 1024 * 1024; // 10 Mo

    if (!fileExt || !allowedExts.includes(fileExt)) {
      throw new Error('Type de fichier non autorisé');
    }

    if (file.size > maxSize) {
      throw new Error('Le fichier est trop volumineux (max 10 Mo)');
    }

    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('factures-achat')
      .upload(fileName, file);

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let lien_piece_jointe = null;
      if (selectedFile) {
        lien_piece_jointe = await handleFileUpload(selectedFile);
      }

      const { error } = await supabase
        .from('fin_facture_achat')
        .insert([{
          entite_id: formData.entite_id,
          tiers_id: formData.tiers_id,
          numero_document: formData.numero_document || null,
          date_facture: formData.date_facture,
          montant_ht: parseFloat(formData.montant_ht) || 0,
          montant_tva: parseFloat(formData.montant_tva) || 0,
          montant_ttc: parseFloat(formData.montant_ttc) || 0,
          mode_paiement_id: formData.mode_paiement_id,
          commentaire: formData.commentaire || null,
          lien_piece_jointe
        }]);

      if (error) throw error;

      showToast({
        label: 'Facture enregistrée avec succès',
        icon: 'Check',
        color: '#10b981'
      });

      navigate('/finance/invoice');
    } catch (error) {
      console.error('Erreur:', error);
      showToast({
        label: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const isImage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext === 'jpg' || ext === 'jpeg' || ext === 'png';
  };

  return (
    <PageSection
      title="Nouvelle facture"
      description="Saisie d'une nouvelle facture fournisseur"
    >
      <Form size={90} columns={3} onSubmit={handleSubmit}>
        <FormField label="Restaurant" required>
          <select
            name="entite_id"
            value={formData.entite_id}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              border: '2px solid var(--color-secondary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-text)',
              fontSize: '0.875rem'
            }}
            required
          >
            <option value="">Sélectionner un restaurant</option>
            {entites.map(entite => (
              <option key={entite.id} value={entite.id}>
                {entite.code} - {entite.libelle}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Date de facture" required>
          <FormInput
            type="date"
            name="date_facture"
            value={formData.date_facture}
            onChange={handleInputChange}
            required
          />
        </FormField>

        <FormField label="Mode de paiement" required>
          <select
            name="mode_paiement_id"
            value={formData.mode_paiement_id}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              border: '2px solid var(--color-secondary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-text)',
              fontSize: '0.875rem'
            }}
            required
          >
            <option value="">Sélectionner un mode de paiement</option>
            {modesPaiement.map(mode => (
              <option key={mode.id} value={mode.id}>
                {mode.code} - {mode.libelle}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Fournisseur" required>
          <select
            name="tiers_id"
            value={formData.tiers_id}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              border: '2px solid var(--color-secondary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-text)',
              fontSize: '0.875rem'
            }}
            required
          >
            <option value="">Sélectionner un fournisseur</option>
            {tiers.map(t => (
              <option key={t.id} value={t.id}>
                {t.code} - {t.nom}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Montant HT" required>
          <FormInput
            type="number"
            name="montant_ht"
            value={formData.montant_ht}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            required
          />
        </FormField>

        <FormField label="Numéro de document">
          <FormInput
            type="text"
            name="numero_document"
            value={formData.numero_document}
            onChange={handleInputChange}
            maxLength={40}
          />
        </FormField>

        <FormField label="Montant TVA" required>
          <FormInput
            type="number"
            name="montant_tva"
            value={formData.montant_tva}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            required
          />
        </FormField>

        <FormField label="Montant TTC" required>
          <FormInput
            type="number"
            name="montant_ttc"
            value={formData.montant_ttc}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            required
          />
        </FormField>

        <FormField label="Commentaire" style={{ gridColumn: 'span 3' }}>
          <textarea
            name="commentaire"
            value={formData.commentaire}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              border: '2px solid var(--color-secondary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-text)',
              fontSize: '0.875rem',
              minHeight: '100px',
              resize: 'vertical'
            }}
          />
        </FormField>

        <FormField label="Pièce jointe" style={{ gridColumn: 'span 3' }}>
          <input
            type="file"
            name="file"
            onChange={handleInputChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.xls,.xlsx"
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              border: '2px solid var(--color-secondary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-text)',
              fontSize: '0.875rem'
            }}
          />
          {selectedFile && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isImage(selectedFile.name) ? (
                <Image size={16} style={{ color: theme.colors.primary }} />
              ) : (
                <FileText size={16} style={{ color: theme.colors.primary }} />
              )}
              <span style={{ fontSize: '0.875rem' }}>{selectedFile.name}</span>
            </div>
          )}
        </FormField>

        <FormActions style={{ gridColumn: 'span 3' }}>
          <Button
            label="Annuler"
            type="button"
            icon="X"
            color={theme.colors.secondary}
            onClick={() => navigate('/finance/invoice')}
          />
          <Button
            label="Enregistrer"
            type="submit"
            icon="Save"
            color={theme.colors.primary}
            disabled={loading}
          />
        </FormActions>
      </Form>
    </PageSection>
  );
}

export default NewInvoice;