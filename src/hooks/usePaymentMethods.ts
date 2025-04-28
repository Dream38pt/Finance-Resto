import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PaymentMethod, PaymentMethodFormData } from '../types/payment';
import { useToast } from '../contexts/ToastContext';

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const { showToast } = useToast();

  const defaultFormData: PaymentMethodFormData = {
    code: '',
    libelle: '',
    ordre_affichage: '0',
    actif: true,
    paiement_par_espece: false
  };

  const [formData, setFormData] = useState<PaymentMethodFormData>(defaultFormData);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('fin_mode_paiement')
        .select('*')
        .order('ordre_affichage')
        .order('libelle');

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const paymentData = {
        code: formData.code,
        libelle: formData.libelle,
        ordre_affichage: parseInt(formData.ordre_affichage),
        actif: formData.actif,
        paiement_par_espece: formData.paiement_par_espece
      };

      let data, error;

      if (editingMethod) {
        ({ data, error } = await supabase
          .from('fin_mode_paiement')
          .update(paymentData)
          .eq('id', editingMethod.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from('fin_mode_paiement')
          .insert([paymentData])
          .select()
          .single());
      }

      if (error) throw error;

      await fetchPaymentMethods();
      setShowForm(false);
      setEditingMethod(null);
      setFormData(defaultFormData);

      showToast({
        label: `Mode de paiement ${editingMethod ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#10b981'
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingMethod ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (method: PaymentMethod) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le mode de paiement "${method.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('fin_mode_paiement')
          .delete()
          .eq('id', method.id);

        if (error) throw error;

        await fetchPaymentMethods();
        showToast({
          label: 'Mode de paiement supprimé avec succès',
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

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from('fin_mode_paiement')
        .update({ actif: !method.actif })
        .eq('id', method.id);

      if (error) throw error;

      await fetchPaymentMethods();
      showToast({
        label: `Mode de paiement ${!method.actif ? 'activé' : 'désactivé'} avec succès`,
        icon: 'Check',
        color: '#10b981'
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors de la modification',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleToggleCashPayment = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from('fin_mode_paiement')
        .update({ paiement_par_espece: !method.paiement_par_espece })
        .eq('id', method.id);

      if (error) throw error;

      setPaymentMethods(prev => prev.map(m => 
        m.id === method.id ? { ...m, paiement_par_espece: !m.paiement_par_espece } : m
      ));

      showToast({
        label: `Mode de paiement ${!method.paiement_par_espece ? 'défini comme paiement en espèces' : 'défini comme paiement non-espèces'}`,
        icon: 'Check',
        color: '#10b981'
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors de la modification',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  return {
    paymentMethods,
    loading,
    showForm,
    setShowForm,
    error,
    editingMethod,
    setEditingMethod,
    formData,
    setFormData,
    handleSubmit,
    handleDelete,
    handleToggleActive,
    handleToggleCashPayment,
    defaultFormData
  };
}