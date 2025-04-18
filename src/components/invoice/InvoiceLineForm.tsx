import React, { useState, useEffect } from 'react';
import { Form, FormField, FormInput, FormActions } from '../ui/form';
import { Button } from '../ui/button';
import { theme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { InvoiceLineFormData, InvoiceLine } from '../../types/invoice';

interface InvoiceLineFormProps {
  editingLine?: InvoiceLine;
  onSubmit: (data: InvoiceLineFormData) => void;
  onCancel: () => void;
}

export function InvoiceLineForm({
  editingLine,
  onSubmit,
  onCancel
}: InvoiceLineFormProps) {
  const [categories, setCategories] = useState<{ id: string; libelle: string; }[]>([]);
  const [formData, setFormData] = useState<InvoiceLineFormData>({
    designation: editingLine?.designation || '',
    quantite: editingLine?.quantite.toString() || '',
    prix_unitaire_ht: editingLine?.prix_unitaire_ht.toString() || '',
    categorie_id: editingLine?.categorie_id || '',
    montant_ht: editingLine?.montant_ht.toString() || '',
    montant_tva: editingLine?.montant_tva.toString() || '',
    commentaire: editingLine?.commentaire || ''
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('fin_categorie_achat')
          .select('id, libelle')
          .eq('actif', true)
          .order('ordre_affichage')
          .order('libelle');

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    }

    fetchCategories();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value === '' && name === 'montant_tva' ? '0' : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Form size={100} columns={3} onSubmit={handleSubmit}>
      <FormField label="Catégorie" required>
        <select
          name="categorie_id"
          value={formData.categorie_id}
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
          <option value="">Sélectionner une catégorie</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.libelle}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Désignation" required style={{ gridColumn: 'span 2' }}>
        <FormInput
          type="text"
          name="designation"
          value={formData.designation}
          onChange={handleInputChange}
          maxLength={100}
          required
        />
      </FormField>

      <FormField label="Quantité">
        <FormInput
          type="number"
          name="quantite"
          value={formData.quantite}
          onChange={handleInputChange}
          min="0"
          step="0.001"
        />
      </FormField>

      <FormField label="Prix unitaire HT">
        <FormInput
          type="number"
          name="prix_unitaire_ht"
          value={formData.prix_unitaire_ht}
          onChange={handleInputChange}
          min="0"
          step="0.01"
        />
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

      <FormField label="Montant TVA">
        <FormInput
          type="number"
          name="montant_tva"
          value={formData.montant_tva}
          onChange={handleInputChange}
          min="0"
          step="0.01"
          defaultValue="0"
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
            resize: 'vertical',
            maxHeight: '150px'
          }}
        />
      </FormField>

      <FormActions style={{ gridColumn: 'span 3' }}>
        <Button
          label="Annuler"
          type="button"
          icon="X"
          color={theme.colors.secondary}
          onClick={onCancel}
        />
        <Button
          label={editingLine ? "Modifier" : "Ajouter"}
          type="submit"
          icon={editingLine ? "Save" : "Plus"}
          color={theme.colors.primary}
        />
      </FormActions>
    </Form>
  );
}