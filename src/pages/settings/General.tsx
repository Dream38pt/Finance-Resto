import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface ParamGen {
  id: string | null;
  tx_tva_ca: number;
  tx_tva_ca_date_debut: string;
  tx_tva_ca_date_fin: string | null;
  tx_tva_deductible: number;
  tx_tva_deductible_date_debut: string;
  tx_tva_deductible_date_fin: string | null;
  annee_dispo: number | null;
  annee_dispo_date_debut: string;
  annee_dispo_date_fin: string | null;
}

const defaultFormData: ParamGen = {
  id: null,
  tx_tva_ca: 0,
  tx_tva_ca_date_debut: '',
  tx_tva_ca_date_fin: null,
  tx_tva_deductible: 0,
  tx_tva_deductible_date_debut: '',
  tx_tva_deductible_date_fin: null,
  annee_dispo: null,
  annee_dispo_date_debut: '',
  annee_dispo_date_fin: null
};

function General() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ParamGen>(defaultFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const paramData = {
        tx_tva_ca: parseFloat(formData.tx_tva_ca.toString()),
        tx_tva_deductible: parseFloat(formData.tx_tva_deductible.toString()),
        tx_tva_ca_date_debut: formData.tx_tva_ca_date_debut,
        tx_tva_ca_date_fin: formData.tx_tva_ca_date_fin || null,
        tx_tva_deductible_date_debut: formData.tx_tva_deductible_date_debut,
        tx_tva_deductible_date_fin: formData.tx_tva_deductible_date_fin || null
      };

      let response;
      if (formData.id) {
        // Mode modification
        response = await supabase
          .from('param_gen')
          .update(paramData)
          .eq('id', formData.id)
          .select();
      } else {
        // Mode création
        response = await supabase
          .from('param_gen')
          .insert([paramData])
          .select();
      }

      if (response.error) throw response.error;

      showToast({
        label: formData.id ? 'Paramètres mis à jour' : 'Paramètres créés',
        icon: 'Check',
        color: '#10b981'
      });

      if (response.data && response.data[0]) {
        setFormData(response.data[0]);
      }
      setShowForm(false);
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async () => {
    if (!formData.id || !window.confirm('Êtes-vous sûr de vouloir supprimer ces paramètres TVA ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('param_gen')
        .delete()
        .eq('id', formData.id);

      if (error) throw error;

      setFormData(defaultFormData);
      showToast({
        label: 'Paramètres TVA supprimés avec succès',
        icon: 'Check',
        color: '#10b981'
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors de la suppression',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  useEffect(() => {
    async function fetchParams() {
      try {
        const { data, error } = await supabase
          .from('param_gen')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        // Si des données existent, utiliser la première entrée, sinon utiliser les valeurs par défaut
        setFormData(data && data.length > 0 ? data[0] : defaultFormData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchParams();
  }, []);

  if (loading) {
    return (
      <PageSection
        title="Paramètres généraux"
        description="Chargement des paramètres..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Paramètres généraux"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <PageSection
      title="Paramètres généraux"
      description="Gérez les paramètres généraux de l'application"
    >
      <PageSection
        subtitle="Paramètres des années"
        description="Configuration des années disponibles"
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label={showForm ? "Masquer le formulaire" : formData.id ? "Modifier les paramètres" : "Créer des paramètres"}
            icon={showForm ? "ChevronUp" : "Plus"}
            color={theme.colors.primary}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        {formData.id && <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', padding: '12px', borderBottom: '2px solid #e5e7eb' }}></th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', color: theme.colors.primary }}>Année disponible</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', color: theme.colors.primary }}>Date de début</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', color: theme.colors.primary }}>Date de fin</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      color: theme.colors.primary,
                      transition: 'all 0.2s'
                    }}
                    title="Modifier"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      color: '#ef4444',
                      transition: 'all 0.2s'
                    }}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>{formData.annee_dispo || '-'}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                {formData.annee_dispo_date_debut ? new Date(formData.annee_dispo_date_debut).toLocaleDateString('fr-FR') : '-'}
              </td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                {formData.annee_dispo_date_fin ? new Date(formData.annee_dispo_date_fin).toLocaleDateString('fr-FR') : '-'}
              </td>
            </tr>
          </tbody>
        </table>}
        
        {!formData.id && !showForm && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '2rem' }}>
            Aucun paramètre d'année n'est configuré. Cliquez sur le bouton "Créer des paramètres" pour commencer.
          </p>
        )}

        {showForm && <Form size={70} onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Année disponible</h3>
              <FormField label="Année" required>
                <FormInput
                  type="number"
                  name="annee_dispo"
                  value={formData.annee_dispo || ''}
                  onChange={handleInputChange}
                  min="1900"
                  max="9999"
                  placeholder="2024"
                />
              </FormField>
              
              <FormField label="Date de début" required>
                <FormInput
                  type="date"
                  name="annee_dispo_date_debut"
                  value={formData.annee_dispo_date_debut || ''}
                  onChange={handleInputChange}
                />
              </FormField>
              
              <FormField label="Date de fin">
                <FormInput
                  type="date"
                  name="annee_dispo_date_fin"
                  value={formData.annee_dispo_date_fin || ''}
                  onChange={handleInputChange}
                />
              </FormField>
            </div>
          </div>
        </Form>}
      </PageSection>

      <PageSection
        subtitle="Paramètres TVA"
        description="Configuration des taux de TVA"
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label={showForm ? "Masquer le formulaire" : formData.id ? "Modifier les paramètres TVA" : "Créer des paramètres TVA"}
            icon={showForm ? "ChevronUp" : "Plus"}
            color={theme.colors.primary}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        {formData.id && <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', padding: '12px', borderBottom: '2px solid #e5e7eb' }}></th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', color: theme.colors.primary }}>Type de TVA</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', color: theme.colors.primary }}>Taux (%)</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', color: theme.colors.primary }}>Date de début</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', color: theme.colors.primary }}>Date de fin</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      color: theme.colors.primary,
                      transition: 'all 0.2s'
                    }}
                    title="Modifier"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      color: '#ef4444',
                      transition: 'all 0.2s'
                    }}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>TVA sur CA</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>{formData.tx_tva_ca}%</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                {formData.tx_tva_ca_date_debut ? new Date(formData.tx_tva_ca_date_debut).toLocaleDateString('fr-FR') : '-'}
              </td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                {formData.tx_tva_ca_date_fin ? new Date(formData.tx_tva_ca_date_fin).toLocaleDateString('fr-FR') : '-'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}></td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>TVA déductible</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>{formData.tx_tva_deductible}%</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                {formData.tx_tva_deductible_date_debut ? new Date(formData.tx_tva_deductible_date_debut).toLocaleDateString('fr-FR') : '-'}
              </td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                {formData.tx_tva_deductible_date_fin ? new Date(formData.tx_tva_deductible_date_fin).toLocaleDateString('fr-FR') : '-'}
              </td>
            </tr>
          </tbody>
        </table>}
        
        {!formData.id && !showForm && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '2rem' }}>
            Aucun paramètre TVA n'est configuré. Cliquez sur le bouton "Créer des paramètres TVA" pour commencer.
          </p>
        )}

        {showForm && <Form size={70} onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* TVA sur CA */}
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>TVA sur Chiffre d'Affaires</h3>
              <FormField label="Taux de TVA (%)" required>
                <FormInput
                  type="number"
                  name="tx_tva_ca"
                  value={formData.tx_tva_ca}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="20.00"
                />
              </FormField>
              
              <FormField label="Date de début" required>
                <FormInput
                  type="date"
                  name="tx_tva_ca_date_debut"
                  value={formData.tx_tva_ca_date_debut}
                  onChange={handleInputChange}
                />
              </FormField>
              
              <FormField label="Date de fin">
                <FormInput
                  type="date"
                  name="tx_tva_ca_date_fin"
                  value={formData.tx_tva_ca_date_fin || ''}
                  onChange={handleInputChange}
                />
              </FormField>
            </div>

            {/* TVA déductible */}
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>TVA Déductible</h3>
              <FormField label="Taux de TVA (%)" required>
                <FormInput
                  type="number"
                  name="tx_tva_deductible"
                  value={formData.tx_tva_deductible}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="20.00"
                />
              </FormField>
              
              <FormField label="Date de début" required>
                <FormInput
                  type="date"
                  name="tx_tva_deductible_date_debut"
                  value={formData.tx_tva_deductible_date_debut}
                  onChange={handleInputChange}
                />
              </FormField>
              
              <FormField label="Date de fin">
                <FormInput
                  type="date"
                  name="tx_tva_deductible_date_fin"
                  value={formData.tx_tva_deductible_date_fin || ''}
                  onChange={handleInputChange}
                />
              </FormField>
            </div>
          </div>

          <FormActions>
            <Button
              label="Annuler"
              type="button"
              icon="X"
              color={theme.colors.secondary}
              onClick={() => setShowForm(false)}
            />
            <Button
              label="Enregistrer"
              type="submit"
              icon="Save"
              color={theme.colors.primary}
            />
          </FormActions>
        </Form>}
      </PageSection>
    </PageSection>
  );
}

export default General;