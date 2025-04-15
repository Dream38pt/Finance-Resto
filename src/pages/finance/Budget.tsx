import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface ServiceCA {
  id: string;
  code_service_ca: string;
  libelle_service_ca: string;
}

interface BudgetCA {
  id: string;
  entite_id: string;
  service_ca_id: string;
  annee: number;
  mois: number;
  qjp: number;
  pvjp: number;
  ndj: number;
  cadm: number;
}

function Budget() {
  const [entites, setEntites] = useState<Entite[]>([]);
  const [services, setServices] = useState<ServiceCA[]>([]);
  const [budgets, setBudgets] = useState<BudgetCA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedEntite, setSelectedEntite] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<{[key: string]: { qjp: string; pvjp: string }}>({});
  const [joursOuverts, setJoursOuverts] = useState<{[key: string]: number}>({});

  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const handleInputChange = (mois: number, field: 'qjp' | 'pvjp', value: string) => {
    setFormData(prev => ({
      ...prev,
      [mois]: {
        ...prev[mois],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      const updates = Object.entries(formData).map(([mois, data]) => ({
        entite_id: selectedEntite,
        service_ca_id: selectedService,
        annee: selectedYear,
        mois: parseInt(mois),
        qjp: parseFloat(data.qjp || '0'),
        pvjp: parseFloat(data.pvjp || '0'),
        ndj: 0 // Sera mis à jour par le trigger
      }));

      const { error } = await supabase
        .from('budget_ca_mensuel')
        .upsert(updates, {
          onConflict: 'entite_id,service_ca_id,annee,mois'
        });

      if (error) throw error;

      showToast({
        label: 'Budget enregistré avec succès',
        icon: 'Check',
        color: '#10b981'
      });

      setEditMode(false);
      loadBudgetData();
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const loadJoursOuverts = async () => {
    if (!selectedEntite) return;

    try {
      const { data, error } = await supabase
        .from('ca_param_jours')
        .select('mois, jours_ouverts')
        .eq('entite_id', selectedEntite)
        .eq('annee', selectedYear);

      if (error) throw error;

      const joursMap: {[key: string]: number} = {};
      data?.forEach(jour => {
        joursMap[jour.mois] = jour.jours_ouverts;
      });
      setJoursOuverts(joursMap);
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors du chargement des jours ouvrés',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const loadBudgetData = async () => {
    if (!selectedEntite || !selectedService) return;

    try {
      const { data, error } = await supabase
        .from('budget_ca_mensuel')
        .select('*')
        .eq('entite_id', selectedEntite)
        .eq('service_ca_id', selectedService)
        .eq('annee', selectedYear);

      if (error) throw error;

      setBudgets(data || []);
      
      // Initialiser le formData avec les valeurs existantes
      const newFormData: {[key: string]: { qjp: string; pvjp: string }} = {};
      data?.forEach(budget => {
        newFormData[budget.mois] = {
          qjp: budget.qjp.toString(),
          pvjp: budget.pvjp.toString()
        };
      });
      setFormData(newFormData);
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

  useEffect(() => {
    async function fetchServices() {
      if (!selectedEntite) return;

      try {
        const { data, error } = await supabase
          .from('service_ca')
          .select('id, code_service_ca, libelle_service_ca')
          .eq('entite_id', selectedEntite)
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
    }

    fetchServices();
  }, [selectedEntite]);

  useEffect(() => {
    loadJoursOuverts();
  }, [selectedEntite, selectedYear]);

  useEffect(() => {
    loadBudgetData();
  }, [selectedEntite, selectedService, selectedYear]);

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
      description="Gestion du budget de chiffre d'affaires"
    >
      <Form size={70}>
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

          {selectedEntite && (
            <FormField label="Service">
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
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
                <option value="">Sélectionner un service</option>
                {services?.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.code_service_ca} - {service.libelle_service_ca}
                  </option>
                ))}
              </select>
            </FormField>
          )}
          
          {selectedEntite && selectedService && (
            <Button
              label={editMode ? "Annuler" : "Modifier"}
              color={editMode ? theme.colors.secondary : theme.colors.primary}
              icon={editMode ? "X" : "Pencil"}
              onClick={() => setEditMode(!editMode)}
            />
          )}

          {editMode && (
            <Button
              label="Enregistrer"
              color={theme.colors.primary}
              icon="Save"
              onClick={handleSave}
            />
          )}
        </div>
      </Form>

      {selectedEntite && selectedService && (
        <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'left' }}>Mois</th>
                <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>QJP</th>
                <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>PVJP</th>
                <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>NDJ</th>
                <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>CADM</th>
              </tr>
            </thead>
            <tbody>
              {mois.map((moisNom, index) => {
                const moisNum = index + 1;
                const budget = budgets.find(b => b.mois === moisNum);
                return (
                  <tr key={moisNum}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {moisNom}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {editMode ? (
                        <input
                          type="number"
                          value={formData[moisNum]?.qjp || ''}
                          onChange={(e) => handleInputChange(moisNum, 'qjp', e.target.value)}
                          style={{
                            width: '100px',
                            padding: '4px',
                            textAlign: 'right'
                          }}
                          min="0"
                          step="0.01"
                        />
                      ) : budget?.qjp?.toString() || '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {editMode ? (
                        <input
                          type="number"
                          value={formData[moisNum]?.pvjp || ''}
                          onChange={(e) => handleInputChange(moisNum, 'pvjp', e.target.value)}
                          style={{
                            width: '100px',
                            padding: '4px',
                            textAlign: 'right'
                          }}
                          min="0"
                          step="0.01"
                        />
                      ) : budget?.pvjp?.toString() || '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {joursOuverts[moisNum] || '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>{budget?.cadm?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageSection>
  );
}

export default Budget;