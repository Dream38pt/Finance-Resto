import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface BudgetCF {
  id: string;
  entite_id: string;
  annee: number;
  mois: number;
  designation: string;
  montant: number;
  ordre_affichage: number;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

function BudgetCF() {
  const [budgets, setBudgets] = useState<BudgetCF[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [selectedEntite, setSelectedEntite] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    designation: '',
    ordre_affichage: '0',
    montants: Array(12).fill('0')
  });

  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('montant_')) {
      const index = parseInt(name.split('_')[1]);
      const newMontants = [...formData.montants];
      newMontants[index] = value;
      setFormData(prev => ({ ...prev, montants: newMontants }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = (budget: { designation: string; ordre_affichage: number; montants: number[] }) => {
    setEditingBudget(budget.designation);
    setFormData({
      designation: budget.designation,
      ordre_affichage: budget.ordre_affichage.toString(),
      montants: budget.montants.map(m => m.toString())
    });
    setShowForm(true);
    window.scrollTo(0, document.body.scrollHeight);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBudget) {
        // Supprimer l'ancien budget
        const { error: deleteError } = await supabase
          .from('ca_budget_cf')
          .delete()
          .eq('entite_id', selectedEntite)
          .eq('annee', selectedYear)
          .eq('designation', editingBudget);

        if (deleteError) throw deleteError;
      }

      const budgetData = formData.montants.map((montant, index) => ({
        entite_id: selectedEntite,
        annee: selectedYear,
        mois: index + 1,
        designation: formData.designation,
        montant: parseFloat(montant),
        ordre_affichage: parseInt(formData.ordre_affichage)
      }));

      const { data, error } = await supabase
        .from('ca_budget_cf')
        .insert(budgetData)
        .select();

      if (error) throw error;

      await handleDisplayClick();
      setEditingBudget(null);
      setShowForm(false);
      setFormData({
        designation: '',
        ordre_affichage: '0',
        montants: Array(12).fill('0')
      });

      showToast({
        label: `Budget ${editingBudget ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#10b981'
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors de la création',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (budget: BudgetCF) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce coût fixe ?`)) {
      try {
        const { error } = await supabase
          .from('ca_budget_cf')
          .delete()
          .eq('entite_id', budget.entite_id)
          .eq('annee', budget.annee)
          .eq('designation', budget.designation);

        if (error) throw error;

        setBudgets(prev => prev.filter(b => 
          !(b.entite_id === budget.entite_id && 
            b.annee === budget.annee && 
            b.designation === budget.designation)
        ));

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

  const handleDisplayClick = async () => {
    if (!selectedEntite) {
      showToast({
        label: 'Veuillez sélectionner un restaurant',
        icon: 'AlertTriangle',
        color: theme.colors.warning
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ca_budget_cf')
        .select('*')
        .eq('entite_id', selectedEntite)
        .eq('annee', selectedYear)
        .order('ordre_affichage', { ascending: true })
        .order('designation');

      if (error) throw error;
      setBudgets(data || []);
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors du chargement des données',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  useEffect(() => {
    async function fetchEntites() {
      try {
        const { data, error } = await supabase
          .from('entite')
          .select('id, code, libelle')
          .order('code');

        if (error) throw error;
        setEntites(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchEntites();
  }, []);

  if (loading) {
    return (
      <PageSection
        title="Budget Coût Fixe"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Budget Coût Fixe"
        description={`Erreur: ${error}`}
      />
    );
  }

  // Grouper les budgets par désignation
  const budgetsByDesignation = budgets.reduce((acc, budget) => {
    if (!acc[budget.designation]) {
      acc[budget.designation] = {
        designation: budget.designation,
        ordre_affichage: budget.ordre_affichage,
        montants: Array(12).fill(0)
      };
    }
    acc[budget.designation].montants[budget.mois - 1] = budget.montant;
    return acc;
  }, {} as Record<string, { designation: string; ordre_affichage: number; montants: number[] }>);

  // Convertir en tableau et trier par ordre d'affichage
  const groupedBudgets = Object.values(budgetsByDesignation)
    .sort((a, b) => a.ordre_affichage - b.ordre_affichage);

  return (
    <PageSection
      title="Budget Coût Fixe"
      description="Gestion des coûts fixes budgétés"
    >
      <Form size={50}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
          <FormField label="Restaurant">
            <select
              value={selectedEntite}
              onChange={(e) => setSelectedEntite(e.target.value)}
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
              <option value="">Sélectionner un restaurant</option>
              {entites?.map(entite => (
                <option key={entite.id} value={entite.id}>
                  {entite.code} - {entite.libelle}
                </option>
              ))}
            </select>
          </FormField>
          
          <FormField label="Année">
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1900 && value <= 9999) {
                  setSelectedYear(value);
                }
              }}
              min="1900"
              max="9999"
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
          </FormField>
          
          <Button
            label="Afficher"
            color={theme.colors.primary}
            icon="Search"
            onClick={handleDisplayClick}
          />
        </div>
      </Form>

      {selectedEntite && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Button
              label={showForm ? "Masquer le formulaire" : "Ajouter un coût fixe"}
              icon={showForm ? "ChevronUp" : "Plus"}
              color={theme.colors.primary}
              onClick={() => setShowForm(!showForm)}
            />
          </div>

          {showForm && (
            <Form size={70} onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
                <FormField label="Désignation" required>
                  <FormInput
                    style={{ width: '100%', minWidth: '300px' }}
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    maxLength={50}
                    placeholder="Nom du coût fixe"
                  />
                </FormField>

                <FormField label="Ordre d'affichage" required>
                  <FormInput
                    style={{ width: '100px' }}
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
                {/* Première ligne : Janvier à Juin */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                  {mois.slice(0, 6).map((moisNom, index) => (
                    <FormField key={index} label={moisNom}>
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
                {/* Deuxième ligne : Juillet à Décembre */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                  {mois.slice(6).map((moisNom, index) => (
                    <FormField key={index + 6} label={moisNom}>
                      <div style={{ width: '120px' }}>
                        <FormInput
                          type="number"
                          name={`montant_${index + 6}`}
                          value={formData.montants[index + 6]}
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
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      designation: '',
                      ordre_affichage: '0',
                      montants: Array(12).fill('0')
                    });
                  }}
                />
                <Button
                  label={editingBudget ? "Modifier" : "Créer"}
                  type="submit" 
                  icon="Plus"
                  color={theme.colors.primary}
                />
              </FormActions>
            </Form>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Désignation</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', width: '60px' }}>Ordre</th>
                  {mois.map((moisNom, index) => (
                    <th key={index} style={{ textAlign: 'right', padding: '4px', borderBottom: '2px solid #e5e7eb', fontSize: '0.75rem', width: '85px' }}>{moisNom}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedBudgets.map((budget) => (
                  <tr key={budget.designation}>
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
                        ><Pencil size={16} /></button>
                        <button
                          onClick={() => handleDelete({ 
                            id: '', 
                            entite_id: selectedEntite,
                            annee: selectedYear,
                            mois: 1,
                            designation: budget.designation,
                            montant: 0,
                            ordre_affichage: budget.ordre_affichage
                          })}
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
                      {budget.designation}
                    </td>
                    <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right' }}>
                      {budget.ordre_affichage}
                    </td>
                    {budget.montants.map((montant, index) => (
                      <td key={index} style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right' }}>
                        {montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Ligne vide */}
                {groupedBudgets.length > 0 && (
                  <tr>
                    <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb' }}>&nbsp;</td>
                    <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb' }}>&nbsp;</td>
                    <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb' }}>&nbsp;</td>
                    {Array(12).fill(null).map((_, index) => (
                      <td key={index} style={{ padding: '4px', borderBottom: '1px solid #e5e7eb' }}>&nbsp;</td>
                    ))}
                  </tr>
                )}
                {/* Ligne Total */}
                {groupedBudgets.length > 0 && (
                  <tr>
                    <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb' }}></td>
                    <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      Total
                    </td>
                    <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb' }}></td>
                    {Array(12).fill(null).map((_, moisIndex) => {
                      const total = groupedBudgets.reduce((sum, budget) => sum + budget.montants[moisIndex], 0);
                      return (
                        <td key={moisIndex} style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                          {total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageSection>
  );
}

export default BudgetCF;