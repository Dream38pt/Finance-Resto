import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { theme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface ServiceCA {
  id: string;
  code_service_ca: string;
  libelle_service_ca: string;
  ordre_affich: number | null;
  budget?: {
    montant: number;
  };
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

function RevenueTracking() {
  const [entites, setEntites] = useState<Entite[]>([]);
  const [selectedEntite, setSelectedEntite] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceCA[]>([]);
  const [editingService, setEditingService] = useState<ServiceCA | null>(null);
  const [budgetAmount, setBudgetAmount] = useState<string>('');
  const { showToast } = useToast();

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !selectedEntite) return;

    try {
      const montant = parseFloat(budgetAmount);
      if (isNaN(montant)) throw new Error('Le montant doit être un nombre valide');

      const { data, error } = await supabase
        .from('budget_ca')
        .upsert({
          entite_id: selectedEntite,
          service_ca_id: editingService.id,
          montant,
          annee: selectedYear
        }, {
          onConflict: '(entite_id, service_ca_id, annee)'
        })
        .select();

      if (error) throw error;

      showToast({
        label: 'Budget enregistré avec succès',
        icon: 'Check',
        color: '#10b981'
      });

      setEditingService(null);
      setBudgetAmount('');
      handleDisplayClick();
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du budget',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDeleteBudget = async (service: ServiceCA) => {
    if (!selectedEntite || !window.confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) return;

    try {
      const { error } = await supabase
        .from('budget_ca')
        .delete()
        .eq('entite_id', selectedEntite)
        .eq('service_ca_id', service.id)
        .eq('annee', selectedYear);

      if (error) throw error;

      showToast({
        label: 'Budget supprimé avec succès',
        icon: 'Check',
        color: '#10b981'
      });

      handleDisplayClick();
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors de la suppression du budget',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
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
        .from('service_ca')
        .select(`
          id,
          code_service_ca,
          libelle_service_ca,
          ordre_affich,
          budget:budget_ca!inner(montant)
        `)
        .eq('entite_id', selectedEntite)
        .eq('budget_ca.annee', selectedYear)
        .order('ordre_affich', { ascending: true, nullsLast: true })
        .order('code_service_ca');

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors du chargement des services',
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
        showToast({
          label: err instanceof Error ? err.message : 'Erreur lors du chargement des entités',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      } finally {
        setLoading(false);
      }
    }

    fetchEntites();
  }, [showToast]);

  const handleEntiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEntite(e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1900 && value <= 9999) {
      setSelectedYear(value);
    }
  };

  if (loading) {
    return (
      <PageSection
        title="Suivi / mois du CA"
        description="Chargement des données..."
      />
    );
  }

  return (
    <PageSection
      title="Suivi / mois du CA"
      description="Suivi mensuel du chiffre d'affaires par entité et type de service"
    >
      <Form size={50}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
          <FormField label="Restaurant">
            <select
              value={selectedEntite}
              onChange={handleEntiteChange}
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
              {entites.map(entite => (
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
              onChange={handleYearChange}
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
      
      {services.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Code</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Libellé</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Budget</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Ordre</th>
              <th style={{ width: '100px', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {service.code_service_ca}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {service.libelle_service_ca}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                  {service.budget?.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '-'}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                  {service.ordre_affich || '-'}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button
                      label=""
                      icon={service.budget ? "Pencil" : "Plus"}
                      color={theme.colors.primary}
                      size="sm"
                      onClick={() => {
                        setEditingService(service);
                        setBudgetAmount(service.budget?.montant.toString() || '');
                      }}
                    />
                    {service.budget && (
                      <Button
                        label=""
                        icon="Trash2"
                        color="#ef4444"
                        size="sm"
                        onClick={() => handleDeleteBudget(service)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {editingService && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '100%',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              {editingService.budget ? 'Modifier le' : 'Ajouter un'} budget pour {editingService.libelle_service_ca}
            </h3>
            
            <Form onSubmit={handleBudgetSubmit}>
              <FormField label="Montant" required>
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  step="0.01"
                  min="0"
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
                />
              </FormField>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <Button
                  label="Annuler"
                  icon="X"
                  color={theme.colors.secondary}
                  onClick={() => {
                    setEditingService(null);
                    setBudgetAmount('');
                  }}
                />
                <Button
                  label="Enregistrer"
                  icon="Save"
                  color={theme.colors.primary}
                  type="submit"
                />
              </div>
            </Form>
          </div>
        </div>
      )}
    </PageSection>
  );
}

export default RevenueTracking;