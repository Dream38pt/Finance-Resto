import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BudgetCF, Entite, CategorieAchat, BudgetFormData } from '../types/budget';
import { useToast } from '../contexts/ToastContext';

export function useBudgetCF() {
  const [budgets, setBudgets] = useState<BudgetCF[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [categories, setCategories] = useState<CategorieAchat[]>([]);
  const [selectedEntite, setSelectedEntite] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<BudgetCF | null>(null);
  const { showToast } = useToast();

  const defaultFormData: BudgetFormData = {
    entite_id: '', // Sera rempli avec l'entité sélectionnée
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1,
    designation: '',
    montants: Array(12).fill('0'),
    ordre_affichage: 0,
    categorie_achat_id: null
  };

  const [formData, setFormData] = useState<BudgetFormData>(defaultFormData);

  useEffect(() => {
    fetchEntites();
    fetchCategories();
  }, []);

  const fetchEntites = async () => {
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
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('fin_categorie_achat')
        .select('*')
        .eq('actif', true)
        .eq('fait_partie_cout_mp', false)
        .order('ordre_affichage')
        .order('libelle');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
    }
  };

  const handleDisplayClick = async () => {
    if (!selectedEntite) {
      showToast({
        label: 'Veuillez sélectionner un restaurant dans la section filtre',
        icon: 'AlertTriangle',
        color: '#f59e0b'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Utiliser l'entité sélectionnée si le formulaire n'en a pas
    const entiteId = formData.entite_id || selectedEntite;
    
    if (!entiteId) {
      showToast({
        label: 'Veuillez sélectionner un restaurant',
        icon: 'AlertTriangle',
        color: '#f59e0b'
      });
      return;
    }

    try {
      const promises = formData.montants.map((montant, index) => ({
        entite_id: entiteId,
        annee: formData.annee,
        mois: index + 1,
        designation: formData.designation,
        montant: parseFloat(montant),
        ordre_affichage: parseInt(String(formData.ordre_affichage)),
        categorie_achat_id: formData.categorie_achat_id || null
      }));

      let data, error;

      if (editingBudget) {
        ({ data, error } = await supabase
          .from('ca_budget_cf')
          .upsert(promises, {
            onConflict: 'entite_id,annee,mois,designation'
          })
          .select());
      } else {
        ({ data, error } = await supabase
          .from('ca_budget_cf')
          .insert(promises)
          .select());
      }

      if (error) throw error;

      if (editingBudget) {
        setEditingBudget(null);
        showToast({
          label: 'Budget modifié avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        showToast({
          label: 'Budget créé avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setShowForm(false);
      setFormData(defaultFormData);
      // Recharger les données après modification
      if (selectedEntite) {
        await handleDisplayClick();
      }
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingBudget ? 'modification' : 'création'}`,
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

  return {
    budgets,
    entites,
    categories,
    selectedEntite,
    setSelectedEntite,
    selectedYear,
    setSelectedYear,
    loading,
    showForm,
    setShowForm,
    error,
    editingBudget,
    setEditingBudget,
    formData,
    setFormData,
    handleDisplayClick,
    handleSubmit,
    handleDelete,
    defaultFormData
  };
}