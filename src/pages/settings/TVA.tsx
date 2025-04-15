import React, { useEffect, useState } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface ParamTVA {
  id: string;
  tx_tva_ca: number;
  tx_tva_ca_datedebut: string;
  tx_tva_ca_datefin: string | null;
  tx_tva_deductible: number;
  tx_tva_deductible_datedebut: string;
  tx_tva_deductible_datefin: string | null;
  created_at: string;
  updated_at: string;
}

function TVA() {
  const [params, setParams] = useState<ParamTVA[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [editingParam, setEditingParam] = useState<ParamTVA | null>(null);
  const [formData, setFormData] = useState({
    tx_tva_ca: '',
    tx_tva_ca_datedebut: '',
    tx_tva_ca_datefin: '',
    tx_tva_deductible: '',
    tx_tva_deductible_datedebut: '',
    tx_tva_deductible_datefin: ''
  });

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
        ...formData,
        tx_tva_ca: parseFloat(formData.tx_tva_ca),
        tx_tva_deductible: parseFloat(formData.tx_tva_deductible),
        tx_tva_ca_datefin: formData.tx_tva_ca_datefin || null,
        tx_tva_deductible_datefin: formData.tx_tva_deductible_datefin || null
      };

      let data, error;

      if (editingParam) {
        ({ data, error } = await supabase
          .from('param_tva')
          .update(paramData)
          .eq('id', editingParam.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from('param_tva')
          .insert([paramData])
          .select()
          .single());
      }

      if (error) throw error;

      if (editingParam) {
        setParams(prev => prev.map(p => p.id === editingParam.id ? data : p));
        setEditingParam(null);
        showToast({
          label: 'Paramètres TVA modifiés avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setParams(prev => [...prev, data]);
        setShowForm(false);
        showToast({
          label: 'Paramètres TVA créés avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setFormData({
        tx_tva_ca: '',
        tx_tva_ca_datedebut: '',
        tx_tva_ca_datefin: '',
        tx_tva_deductible: '',
        tx_tva_deductible_datedebut: '',
        tx_tva_deductible_datefin: ''
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingParam ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (param: ParamTVA) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ces paramètres TVA ?')) {
      try {
        const { error } = await supabase
          .from('param_tva')
          .delete()
          .eq('id', param.id);

        if (error) throw error;

        setParams(prev => prev.filter(p => p.id !== param.id));
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
    }
  };

  const handleEdit = (param: ParamTVA) => {
    setEditingParam(param);
    setFormData({
      tx_tva_ca: param.tx_tva_ca.toString(),
      tx_tva_ca_datedebut: param.tx_tva_ca_datedebut,
      tx_tva_ca_datefin: param.tx_tva_ca_datefin || '',
      tx_tva_deductible: param.tx_tva_deductible.toString(),
      tx_tva_deductible_datedebut: param.tx_tva_deductible_datedebut,
      tx_tva_deductible_datefin: param.tx_tva_deductible_datefin || ''
    });
    setShowForm(true);
    window.scrollTo(0, document.body.scrollHeight);
  };

  useEffect(() => {
    async function fetchParams() {
      try {
        const { data, error } = await supabase
          .from('param_tva')
          .select('*')
          .order('tx_tva_ca_datedebut', { ascending: false });

        if (error) throw error;
        setParams(data || []);
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
        title="Paramètres TVA"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Paramètres TVA"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Paramètres TVA"
        description="Gestion des taux de TVA et leurs périodes de validité"
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label={showForm ? "Masquer le formulaire" : "Créer des paramètres TVA"}
            icon={showForm ? "ChevronUp" : "Plus"}
            color={theme.colors.primary}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>TVA CA (%)</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Début CA</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Fin CA</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>TVA Déd. (%)</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Début Déd.</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Fin Déd.</th>
            </tr>
          </thead>
          <tbody>
            {params.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Aucun paramètre TVA trouvé.
                </td>
              </tr>
            ) : params.map((param) => (
              <tr key={param.id}>
                <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEdit(param)}
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
                      onClick={() => handleDelete(param)}
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
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                  {param.tx_tva_ca.toFixed(2)}%
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {new Date(param.tx_tva_ca_datedebut).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {param.tx_tva_ca_datefin ? new Date(param.tx_tva_ca_datefin).toLocaleDateString('fr-FR') : '-'}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                  {param.tx_tva_deductible.toFixed(2)}%
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {new Date(param.tx_tva_deductible_datedebut).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {param.tx_tva_deductible_datefin ? new Date(param.tx_tva_deductible_datefin).toLocaleDateString('fr-FR') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageSection>

      {(showForm || editingParam) && (
        <PageSection
          subtitle={editingParam ? "Modifier les paramètres TVA" : "Nouveaux paramètres TVA"}
          description={editingParam ? "Modifier les taux de TVA et leurs périodes de validité" : "Créer de nouveaux paramètres TVA"}
        >
          <Form size={50} onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
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
                    name="tx_tva_ca_datedebut"
                    value={formData.tx_tva_ca_datedebut}
                    onChange={handleInputChange}
                  />
                </FormField>

                <FormField label="Date de fin">
                  <FormInput
                    type="date"
                    name="tx_tva_ca_datefin"
                    value={formData.tx_tva_ca_datefin}
                    onChange={handleInputChange}
                  />
                </FormField>
              </div>

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
                    name="tx_tva_deductible_datedebut"
                    value={formData.tx_tva_deductible_datedebut}
                    onChange={handleInputChange}
                  />
                </FormField>

                <FormField label="Date de fin">
                  <FormInput
                    type="date"
                    name="tx_tva_deductible_datefin"
                    value={formData.tx_tva_deductible_datefin}
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
                onClick={() => {
                  setShowForm(false);
                  setEditingParam(null);
                  setFormData({
                    tx_tva_ca: '',
                    tx_tva_ca_datedebut: '',
                    tx_tva_ca_datefin: '',
                    tx_tva_deductible: '',
                    tx_tva_deductible_datedebut: '',
                    tx_tva_deductible_datefin: ''
                  });
                }}
              />
              <Button
                label={editingParam ? "Modifier" : "Créer"}
                type="submit"
                icon={editingParam ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}
    </>
  );
}

export default TVA;