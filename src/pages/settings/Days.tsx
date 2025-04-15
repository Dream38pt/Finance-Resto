import React, { useEffect, useState } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface ParamJours {
  id: string;
  entite_id: string;
  entite: {
    code: string;
    libelle: string;
  };
  annee: number;
  mois: number;
  jours_ouverts: number;
  created_at: string;
  updated_at: string;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

function Days() {
  const [params, setParams] = useState<ParamJours[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [editingParam, setEditingParam] = useState<ParamJours | null>(null);
  const [formData, setFormData] = useState({
    entite_id: '',
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1,
    jours_ouverts: '',
    tx_mp: '0'
  });

  const mois = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tx_mp = parseFloat(formData.tx_mp);
      if (isNaN(tx_mp) || tx_mp < 0 || tx_mp > 100) {
        throw new Error('Le taux de matière première doit être compris entre 0 et 100%');
      }

      const jours = parseInt(formData.jours_ouverts);
      if (isNaN(jours) || jours < 0 || jours > 31) {
        throw new Error('Le nombre de jours doit être compris entre 0 et 31');
      }

      const paramData = {
        entite_id: formData.entite_id,
        annee: formData.annee,
        mois: formData.mois,
        jours_ouverts: jours,
        tx_mp: tx_mp
      };

      let data, error;

      if (editingParam) {
        ({ data, error } = await supabase
          .from('ca_param_jours')
          .update(paramData)
          .eq('id', editingParam.id)
          .select(`
            *,
            entite:entite_id (
              code,
              libelle
            )
          `)
          .single());
      } else {
        ({ data, error } = await supabase
          .from('ca_param_jours')
          .insert([paramData])
          .select(`
            *,
            entite:entite_id (
              code,
              libelle
            )
          `)
          .single());
      }

      if (error) throw error;

      if (editingParam) {
        setParams(prev => prev.map(p => p.id === editingParam.id ? data : p));
        setEditingParam(null);
        showToast({
          label: 'Paramètres modifiés avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setParams(prev => [...prev, data]);
        setShowForm(false);
        showToast({
          label: 'Paramètres créés avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setFormData({
        entite_id: '',
        annee: new Date().getFullYear(),
        mois: new Date().getMonth() + 1,
        jours_ouverts: '0',
        tx_mp: '0'
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingParam ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (param: ParamJours) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer les jours paramétrés pour ${param.entite.libelle} (${mois[param.mois - 1].label} ${param.annee}) ?`)) {
      try {
        const { error } = await supabase
          .from('ca_param_jours')
          .delete()
          .eq('id', param.id);

        if (error) throw error;

        setParams(prev => prev.filter(p => p.id !== param.id));
        showToast({
          label: 'Paramètres supprimés avec succès',
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

  const handleEdit = (param: ParamJours) => {
    setEditingParam(param);
    setFormData({
      entite_id: param.entite_id,
      annee: param.annee,
      mois: param.mois,
      jours_ouverts: param.jours_ouverts.toString(),
      jours_ouverts: param.jours_ouverts.toString(),
      tx_mp: param.tx_mp.toString()
    });
    setShowForm(true);
    window.scrollTo(0, document.body.scrollHeight);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Charger les entités
        const { data: entitesData, error: entitesError } = await supabase
          .from('entite')
          .select('id, code, libelle')
          .order('code');

        if (entitesError) throw entitesError;
        setEntites(entitesData);

        // Charger les paramètres
        const { data: paramsData, error: paramsError } = await supabase
          .from('ca_param_jours')
          .select(`
            *,
            entite:entite_id (
              code,
              libelle
            )
          `)
          .order('annee', { ascending: false })
          .order('mois');

        if (paramsError) throw paramsError;
        setParams(paramsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <PageSection
        title="Paramètres des jours"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Paramètres des jours"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Paramètres des jours"
        description="Gestion des jours d'ouverture par entité et par mois"
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label={showForm ? "Masquer le formulaire" : "Créer des paramètres"}
            icon={showForm ? "ChevronUp" : "Plus"}
            color={theme.colors.primary}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Entité</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Année</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Mois</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Jours ouverts</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Taux MP (%)</th>
            </tr>
          </thead>
          <tbody>
            {params.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Aucun paramètre trouvé.
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
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{param.entite.libelle}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                      {param.entite.code}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {param.annee}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {mois[param.mois - 1].label}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {param.jours_ouverts}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                  {param.tx_mp.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageSection>

      {(showForm || editingParam) && (
        <PageSection
          subtitle={editingParam ? "Modifier les paramètres" : "Nouveaux paramètres"}
          description={editingParam ? "Modifier les jours d'ouverture" : "Définir les jours d'ouverture"}
        >
          <Form size={50} onSubmit={handleSubmit}>
            <FormField label="Entité" required>
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
                <option value="">Sélectionner une entité</option>
                {entites.map(entite => (
                  <option key={entite.id} value={entite.id}>
                    {entite.code} - {entite.libelle}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Année" required>
              <FormInput
                type="number"
                name="annee"
                value={formData.annee}
                onChange={handleInputChange}
                min="1900"
                max="9999"
              />
            </FormField>

            <FormField label="Mois" required>
              <select
                name="mois"
                value={formData.mois}
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
                {mois.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField 
              label="Jours ouverts" 
              required
              description="Entrez le nombre de jours ouvrés dans le mois (entre 0 et 31)"
            >
              <FormInput
                type="number"
                name="jours_ouverts"
                value={formData.jours_ouverts}
                onChange={handleInputChange}
                min="0"
                max="31"
                placeholder="20"
              />
            </FormField>
            
            <FormField 
              label="Taux de matière première (%)" 
              required
              description="Entrez le taux de matière première (entre 0 et 100%)"
            >
              <FormInput
                type="number"
                name="tx_mp"
                value={formData.tx_mp}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                placeholder="0.00"
              />
            </FormField>

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
                    entite_id: '',
                    annee: new Date().getFullYear(),
                    mois: new Date().getMonth() + 1,
                    jours_ouverts: '0',
                    jours_ouverts: '0',
                    tx_mp: '0'
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

export default Days;