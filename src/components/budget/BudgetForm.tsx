import React from 'react';
import { Form, FormField, FormInput, FormActions } from '../ui/form';
import { Button } from '../ui/button';
import { theme } from '../../theme';
import { Entite, CategorieAchat, BudgetFormData } from '../../types/budget';

const mois = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

interface BudgetFormProps {
  formData: BudgetFormData;
  setFormData: (data: BudgetFormData) => void;
  entites: Entite[];
  categories: CategorieAchat[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export function BudgetForm({
  formData,
  setFormData,
  entites,
  categories,
  onSubmit,
  onCancel,
  isEditing
}: BudgetFormProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('montant_')) {
      const index = parseInt(name.split('_')[1]);
      const newMontants = [...formData.montants];
      newMontants[index] = value;
      setFormData({ ...formData, montants: newMontants });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <Form size={70} onSubmit={onSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
        <FormField label="Désignation" required>
          <FormInput
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleInputChange}
            maxLength={50}
            placeholder="Nom du coût fixe"
          />
        </FormField>

        <FormField label="Catégorie d'achat">
          <select
            name="categorie_achat_id"
            value={formData.categorie_achat_id}
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
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.libelle}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Ordre d'affichage" required>
          <FormInput
            type="number"
            name="ordre_affichage"
            value={formData.ordre_affichage}
            onChange={handleInputChange}
            min="0"
            style={{ width: '100px' }}
          />
        </FormField>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
          {mois.map((nomMois, index) => (
            <FormField key={index} label={nomMois}>
              <div style={{ width: '120px' }}>
                <FormInput
                  type="number"
                  name={`montant_${index}`}
                  value={formData.montants[index]}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  style={{ width: '100%' }}
                />
              </div>
            </FormField>
          ))}
        </div>
      </div>

      <FormActions>
        <Button
          label="Annuler"
          type="button"
          icon="X"
          color={theme.colors.secondary}
          onClick={onCancel}
        />
        <Button
          label={isEditing ? "Modifier" : "Créer"}
          type="submit"
          icon={isEditing ? "Save" : "Plus"}
          color={theme.colors.primary}
        />
      </FormActions>
    </Form>
  );
}