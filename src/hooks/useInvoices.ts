import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Entite } from '../types/budget';
import { Invoice } from '../types/invoice';
import { useToast } from '../contexts/ToastContext';

export function useInvoices() {
  const [entites, setEntites] = useState<Entite[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  
  // Filtres
  const [filters, setFilters] = useState({
    entite_id: '',
    annee: new Date().getFullYear(),
    mois: '',
  });

  useEffect(() => {
    fetchEntites();
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
      console.error('Erreur lors du chargement des entités:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      if (!filters.annee) {
        showToast({
          label: 'Veuillez sélectionner une année',
          icon: 'AlertTriangle',
          color: theme.colors.warning
        });
        setLoading(false);
        return;
      }

      let query = supabase
        .from('fin_facture_achat')
        .select(`
          id,
          *,
          entite_id,
          entite:entite_id (
            code,
            libelle
          ),
          tiers:tiers_id (
            code,
            nom
          ),
          mode_paiement:mode_paiement_id (
            code,
            libelle
          )
        `)
        .order('date_facture', { ascending: false });

      if (filters.entite_id) {
        query = query.eq('entite_id', filters.entite_id);
      }

      if (filters.annee) {
        if (filters.mois !== '') {
          const month = parseInt(filters.mois.toString());
          // Get the last day of the selected month
          const lastDay = new Date(filters.annee, month, 0).getDate();
          const monthStr = month.toString().padStart(2, '0');
          
          query = query
            .gte('date_facture', `${filters.annee}-${monthStr}-01`)
            .lte('date_facture', `${filters.annee}-${monthStr}-${lastDay}`);
        } else {
          query = query
            .gte('date_facture', `${filters.annee}-01-01`)
            .lte('date_facture', `${filters.annee}-12-31`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
      setLoading(false);
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors du chargement des factures',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      setLoading(false);
    }
  };

  return {
    entites,
    invoices,
    loading,
    error,
    filters,
    setFilters,
    fetchInvoices
  };
}