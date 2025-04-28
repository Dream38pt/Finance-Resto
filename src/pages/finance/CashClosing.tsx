import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2, Check, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';
import { useNavigate } from 'react-router-dom';

interface FermCaisse {
  id: string;
  date_fermeture: string;
  ca_ttc: number;
  ca_ht: number;
  depot_banque_theorique: number | null;
  depot_banque_reel: number | null;
  est_valide: boolean;
  commentaire: string | null;
  entite_id: string;
  entite?: {
    code: string;
    libelle: string;
  };
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

function CashClosing() {
  const [fermetures, setFermetures] = useState<FermCaisse[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  // Filtres
  const [filters, setFilters] = useState({
    entite_id: '',
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1,
  });

  useEffect(() => {
    fetchEntites();
    fetchFermetures();
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
    }
  };

  const fetchFermetures = async () => {
    try {
      let query = supabase
        .from('fin_ferm_caisse')
        .select(`
          *,
          entite:entite_id (
            code,
            libelle
          )
        `)
        .order('date_fermeture', { ascending: false });

      if (filters.entite_id) {
        query = query.eq('entite_id', filters.entite_id);
      }

      if (filters.annee && filters.mois) {
        const month = filters.mois.toString().padStart(2, '0');
        const lastDay = new Date(filters.annee, filters.mois, 0).getDate();
        
        query = query
          .gte('date_fermeture', `${filters.annee}-${month}-01`)
          .lte('date_fermeture', `${filters.annee}-${month}-${lastDay}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFermetures(data || []);
      setLoading(false);
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors du chargement des fermetures',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchFermetures();
  };

  const handleDelete = async (fermeture: FermCaisse) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la fermeture du ${new Date(fermeture.date_fermeture).toLocaleDateString('fr-FR')} ?`)) {
      try {
        const { error } = await supabase
          .from('fin_ferm_caisse')
          .delete()
          .eq('id', fermeture.id);

        if (error) throw error;

        showToast({
          label: 'Fermeture supprimée avec succès',
          icon: 'Check',
          color: '#10b981'
        });

        fetchFermetures();
      } catch (err) {
        showToast({
          label: err instanceof Error ? err.message : 'Erreur lors de la suppression',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const handleEdit = (fermeture: FermCaisse) => {
    navigate('/finance/add-cash-closing', { 
      state: { 
        editMode: true, // Indique qu'on est en mode édition
        fermeture: fermeture,
        editingFermeture: fermeture
      } 
    });
  };

  const handleValidate = async (fermeture: FermCaisse) => {
    try {
      const { error } = await supabase
        .from('fin_ferm_caisse')
        .update({ est_valide: true })
        .eq('id', fermeture.id);

      if (error) throw error;

      showToast({
        label: 'Fermeture validée avec succès',
        icon: 'Check',
        color: '#10b981'
      });

      fetchFermetures();
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors de la validation',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

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

  return (
    <PageSection
      title="Fermeture de la caisse"
      description="Gestion des fermetures de caisse journalières"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <Form size={100} style={{ margin: 0 }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <FormField label="Restaurant">
              <select
                value={filters.entite_id}
                onChange={(e) => setFilters({ ...filters, entite_id: e.target.value })}
                style={{
                  width: '180px',
                  padding: '0.625rem 0.75rem',
                  border: '2px solid var(--color-secondary)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Tous les restaurants</option>
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
                value={filters.annee}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1900 && value <= 9999) {
                    setFilters({ ...filters, annee: value });
                  }
                }}
                min="1900"
                max="9999"
                style={{
                  width: '100px',
                  padding: '0.625rem 0.75rem',
                  border: '2px solid var(--color-secondary)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem'
                }}
              />
            </FormField>

            <FormField label="Mois">
              <select
                value={filters.mois}
                onChange={(e) => setFilters({ ...filters, mois: parseInt(e.target.value) })}
                style={{
                  width: '120px',
                  padding: '0.625rem 0.75rem',
                  border: '2px solid var(--color-secondary)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem'
                }}
              >
                {mois.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </FormField>

            <Button
              label="Rechercher"
              icon="Search"
              color={theme.colors.primary}
              onClick={handleSearch}
              size="sm"
            />
          </div>
        </Form>
        <Button
          label="Ajouter une fermeture"
          icon="Plus"
          color={theme.colors.primary}
          onClick={() => navigate('/finance/add-cash-closing')}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Restaurant</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>CA TTC</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>CA HT</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Dépôt théorique</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Dépôt réel</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Validé</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: '16px', textAlign: 'center' }}>
                  Chargement des données...
                </td>
              </tr>
            ) : fermetures.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '16px', textAlign: 'center' }}>
                  Aucune fermeture de caisse trouvée.
                </td>
              </tr>
            ) : (
              fermetures.map((fermeture) => (
                <tr key={fermeture.id}>
                  <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {fermeture.est_valide ? (
                        <button
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'default',
                            padding: '2px',
                            borderRadius: '4px',
                            color: '#10b981',
                            transition: 'all 0.2s'
                          }}
                          title="Validé"
                        >
                          <Check size={16} />
                        </button>
                      ) : ( 
                        <>
                          <button
                            onClick={() => handleEdit(fermeture)}
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
                            onClick={() => handleDelete(fermeture)}
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
                        </>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {fermeture.entite?.libelle || '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {new Date(fermeture.date_fermeture).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {fermeture.ca_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {fermeture.ca_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {fermeture.depot_banque_theorique 
                      ? fermeture.depot_banque_theorique.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) 
                      : '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {fermeture.depot_banque_reel 
                      ? fermeture.depot_banque_reel.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) 
                      : '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      borderRadius: '50%', 
                      backgroundColor: fermeture.est_valide ? '#10b981' : '#f59e0b',
                      margin: '0 auto'
                    }}></div>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {fermeture.commentaire || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}

export default CashClosing;