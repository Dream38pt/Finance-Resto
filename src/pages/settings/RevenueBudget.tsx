import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface BudgetCA {
  id: string;
  entite_id: string;
  entite: {
    code: string;
    libelle: string;
  };
  annee: number;
  mois: number;
  type_service: 'petit-déjeuner' | 'déjeuner' | 'dinner' | 'livraison';
  quantite_prevue: number;
  prix_vente_prevu: number;
  jours_ouverts: number;
  ca_previsionnel: number;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

function RevenueBudget() {
  const [budgets, setBudgets] = useState<BudgetCA[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [editingBudget, setEditingBudget] = useState<BudgetCA | null>(null);
  const [formData, setFormData] = useState({
    entite_id: '',
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1,
    type_service: 'déjeuner' as const,
    quantite_prevue: '',
    prix_vente_prevu: '',
    jours_ouverts: ''
  });

  const typeServices = [
    { value: 'petit-déjeuner', label: 'Petit-déjeuner' },
    { value: 'déjeuner', label: 'Déjeuner' },
    { value: 'dinner', label: 'Dîner' },
    { value: 'livraison', label: 'Livraison' }
  ];

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
      const budgetData = {
        ...formData,
        annee: parseInt(formData.annee.toString()),
        mois: parseInt(formData.mois.toString()),
        quantite_prevue: parseFloat(formData.quantite_prevue),
        prix_vente_prevu: parseFloat(formData.prix_vente_prevu),
        jours_ouverts: parseInt(formData.jours_ouverts)
      };

      let data, error;

      if (editingBudget) {
        // Mode modification
        ({ data, error } = await supabase
          .from('budget_ca_mensuel')
          .update(budgetData)
          .eq('id', editingBudget.id)
          .select(`
            *,
            entite:entite_id (
              code,
              libelle
            )
          `)
          .single());
      } else {
        // Mode création
        ({ data, error } = await supabase
          .from('budget_ca_mensuel')
          .insert([budgetData])
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

      if (editingBudget) {
        setBudgets(prev => prev.map(b => b.id === editingBudget.id ? data : b));
        setEditingBudget(null);
        showToast({
          label: 'Budget modifié avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setBudgets(prev => [...prev, data]);
        showToast({
          label: 'Budget créé avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setShowForm(false);
      setFormData({
        entite_id: '',
        annee: new Date().getFullYear(),
        mois: new Date().getMonth() + 1,
        type_service: 'déjeuner',
        quantite_prevue: '',
        prix_vente_prevu: '',
        jours_ouverts: ''
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingBudget ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (budget: BudgetCA) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce budget ?`)) {
      try {
        const { error } = await supabase
          .from('budget_ca_mensuel')
          .delete()
          .eq('id', budget.id);

        if (error) throw error;

        setBudgets(prev => prev.filter(b => b.id !== budget.id));
        showToast({
          label: 'Budget supprimé avec succès',
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

  const handleEdit = (budget: BudgetCA) => {
    setEditingBudget(budget);
    setFormData({
      entite_id: budget.entite_id,
      annee: budget.annee,
      mois: budget.mois,
      type_service: budget.type_service,
      quantite_prevue: budget.quantite_prevue.toString(),
      prix_vente_prevu: budget.prix_vente_prevu.toString(),
      jours_ouverts: budget.jours_ouverts.toString()
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

        // Charger les budgets
        const { data: budgetsData, error: budgetsError } = await supabase
          .from('budget_ca_mensuel')
          .select(`
            *,
            entite:entite_id (
              code,
              libelle
            )
          `)
          .order('annee', { ascending: false })
          .order('mois')
          .order('type_service');

        if (budgetsError) throw budgetsError;
        setBudgets(budgetsData);
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
        title="Budget CA"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Budget CA"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <PageSection
      title="Budget CA"
      description="Gérez votre budget de chiffre d'affaires mensuel par entité et type de service"
    >
      <div style={{ marginBottom: '1rem' }}>
        <Button
          label={showForm ? "Masquer le formulaire" : "Créer un budget"}
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
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Période</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Service</th>
            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Quantité</th>
            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Prix</th>
            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Jours</th>
            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>CA Prév.</th>
          </tr>
        </thead>
        <tbody>
          {budgets.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                Aucun budget trouvé.
              </td>
            </tr>
          ) : budgets.map((budget) => (
            <tr key={budget.id}>
              <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={() => handleEdit(budget)}
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
                    onClick={() => handleDelete(budget)}
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
                  <span>{budget.entite.libelle}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                    {budget.entite.code}
                  </span>
                </div>
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                {mois[budget.mois - 1].label} {budget.annee}
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                {typeServices.find(t => t.value === budget.type_service)?.label}
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                {budget.quantite_prevue.toLocaleString('fr-FR')}
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                {budget.prix_vente_prevu.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                {budget.jours_ouverts}
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                {budget.ca_previsionnel.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <PageSection
          subtitle={editingBudget ? "Modifier un budget" : "Nouveau budget"}
          description={editingBudget ? "Modifier les informations du budget" : "Créer un nouveau budget"}
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
                min={2020}
                max={2100}
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

            <FormField label="Type de service" required>
              <select
                name="type_service"
                value={formData.type_service}
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
                {typeServices.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Quantité prévue" required>
              <FormInput
                type="number"
                name="quantite_prevue"
                value={formData.quantite_prevue}
                onChange={handleInputChange}
                min="0"
                step="1"
                placeholder="100"
              />
            </FormField>

            <FormField label="Prix de vente prévu" required>
              <FormInput
                type="number"
                name="prix_vente_prevu"
                value={formData.prix_vente_prevu}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="10.00"
              />
            </FormField>

            <FormField label="Jours d'ouverture" required>
              <FormInput
                type="number"
                name="jours_ouverts"
                value={formData.jours_ouverts}
                onChange={handleInputChange}
                min="0"
                max="31"
                step="1"
                placeholder="20"
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
                  setEditingBudget(null);
                  setFormData({
                    entite_id: '',
                    annee: new Date().getFullYear(),
                    mois: new Date().getMonth() + 1,
                    type_service: 'déjeuner',
                    quantite_prevue: '',
                    prix_vente_prevu: '',
                    jours_ouverts: ''
                  });
                }}
              />
              <Button
                label={editingBudget ? "Modifier" : "Créer"}
                type="submit"
                icon={editingBudget ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}
    </PageSection>
  );
}

export default RevenueBudget;