import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CSVImportDialog } from '../../components/csv-import/CSVImportDialog';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface CAReelJour {
  id: string;
  id_entite: string;
  date: string;
  horaire: string;
  docs_emitidos: number | null;
  montant_moyen_ht: number | null;
  montant_moyen_ttc: number | null;
  montant_total_ht: number | null;
  montant_total_ttc: number | null;
  source: string | null;
  date_import: string;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

function RevenueTracking() {
  const [entites, setEntites] = useState<Entite[]>([]);
  const [caReelData, setCAReelData] = useState<CAReelJour[]>([]);
  const [selectedEntites, setSelectedEntites] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Filtres
  const [filters, setFilters] = useState({
    annee: new Date().getFullYear(),
    mois: '',
    date_debut: '',
    date_fin: '',
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

  const handleDisplayClick = async () => {
    setLoading(true);
    try {
      if (selectedEntites.length === 0) {
        showToast({
          label: 'Veuillez sélectionner au moins un restaurant',
          icon: 'AlertTriangle',
          color: theme.colors.warning
        });
        setLoading(false);
        return;
      }

      // Utiliser select('*') sans jointure pour éviter la limite de 1000 lignes
      let query = supabase
        .from('ca_reel_jour')
        .select('*');

      // Filtrer par entités sélectionnées
      if (selectedEntites.length === 1) {
        query = query.eq('id_entite', selectedEntites[0]);
      } else {
        query = query.in('id_entite', selectedEntites);
      }

      // Filtrer par année
      if (filters.annee) {
        const startDate = `${filters.annee}-01-01`;
        const endDate = `${filters.annee}-12-31`;
        
        // Si un mois est sélectionné, filtrer par mois
        if (filters.mois !== '') {
          const month = parseInt(filters.mois);
          // Get the last day of the selected month
          const lastDay = new Date(filters.annee, month, 0).getDate();
          const monthStr = month.toString().padStart(2, '0');
          
          query = query
            .gte('date', `${filters.annee}-${monthStr}-01`)
            .lte('date', `${filters.annee}-${monthStr}-${lastDay}`);
        } else {
          query = query
            .gte('date', startDate)
            .lte('date', endDate);
        }
      }
      
      // Ajouter l'ordre après les filtres
      query = query
        .order('date', { ascending: false })
        .order('id_entite', { ascending: true })
        .order('horaire', { ascending: true });

      // Ajouter la limite après tous les filtres et ordres
      query = query.range(0, 99999);

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Enrichir les données avec les informations d'entité localement
      const enrichedData = (data || []).map(item => {
        return item;
      });
      
      setCAReelData(enrichedData);
      setLoading(false);
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors du chargement des données',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      setLoading(false);
    }
  };

  const handleEntiteToggle = (entiteId: string) => {
    setSelectedEntites(prev => {
      if (prev.includes(entiteId)) {
        return prev.filter(id => id !== entiteId);
      } else {
        return [...prev, entiteId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedEntites.length === entites.length) {
      setSelectedEntites([]);
    } else {
      setSelectedEntites(entites.map(e => e.id));
    }
  };

  const getDropdownLabel = () => {
    if (selectedEntites.length === 0) {
      return "Sélectionner un restaurant";
    } else if (selectedEntites.length === 1) {
      const selected = entites.find(e => e.id === selectedEntites[0]);
      return selected ? `${selected.code} - ${selected.libelle}` : "1 restaurant sélectionné";
    } else {
      return `${selectedEntites.length} restaurants sélectionnés`;
    }
  };

  if (loading && entites.length === 0) {
    return (
      <PageSection
        title="Suivi du CA Réel"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Suivi du CA Réel"
        description={`Erreur: ${error}`}
      />
    );
  }

  // Calcul des totaux pour le tableau
  const totals = caReelData.reduce((acc, item) => ({
    montant_total_ht: acc.montant_total_ht + (item.montant_total_ht || 0),
    montant_total_ttc: acc.montant_total_ttc + (item.montant_total_ttc || 0)
  }), { montant_total_ht: 0, montant_total_ttc: 0 });

  return (
    <PageSection
      title="Suivi du CA Réel"
      description="Consultez les chiffres d'affaires réels par jour"
    >
      <Form size={70}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
          <FormField label="Restaurant">
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  minWidth: '250px',
                  padding: '0.625rem 0.75rem',
                  border: '2px solid var(--color-secondary)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-white)',
                  color: selectedEntites.length === 0 ? 'var(--color-text-light)' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getDropdownLabel()}</span>
                <ChevronDown size={16} style={{ 
                  flexShrink: 0,
                  marginLeft: '8px',
                  transition: 'transform 0.2s',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                }} />
              </div>
              
              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  maxHeight: '250px',
                  overflowY: 'auto',
                  backgroundColor: 'white',
                  border: '1px solid var(--color-secondary)',
                  borderRadius: '0.375rem',
                  zIndex: 10,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                  <div 
                    style={{ 
                      padding: '0.5rem',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Checkbox
                      checked={selectedEntites.length === entites.length && entites.length > 0}
                      onChange={handleSelectAll}
                      color={theme.colors.primary}
                      label="Sélectionner tout"
                    />
                  </div>
                  
                  {entites.map(entite => (
                    <div 
                      key={entite.id} 
                      style={{ 
                        padding: '0.5rem',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleEntiteToggle(entite.id)}
                    >
                      <Checkbox
                        checked={selectedEntites.includes(entite.id)}
                        onChange={() => handleEntiteToggle(entite.id)}
                        color={theme.colors.primary}
                        label={`${entite.code} - ${entite.libelle}`}
                      />
                    </div>
                  ))}
                  
                  {entites.length === 0 && (
                    <div style={{ padding: '0.75rem', color: 'var(--color-text-light)', textAlign: 'center' }}>
                      Aucun restaurant disponible
                    </div>
                  )}
                </div>
              )}
            </div>
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

          <FormField label="Mois">
            <select
              value={filters.mois}
              onChange={(e) => setFilters({ ...filters, mois: e.target.value })}
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
              <option value="">Tous les mois</option>
              <option value="1">Janvier</option>
              <option value="2">Février</option>
              <option value="3">Mars</option>
              <option value="4">Avril</option>
              <option value="5">Mai</option>
              <option value="6">Juin</option>
              <option value="7">Juillet</option>
              <option value="8">Août</option>
              <option value="9">Septembre</option>
              <option value="10">Octobre</option>
              <option value="11">Novembre</option>
              <option value="12">Décembre</option>
            </select>
          </FormField>
          
          <Button
            label="Afficher"
            icon="Search"
            color={theme.colors.primary}
            onClick={handleDisplayClick}
          />
          <Button
            label="Import"
            icon="Upload"
            color={theme.colors.primary}
            onClick={() => setShowImportDialog(true)}
          />
        </div>
      </Form>

      {/* Fermer le dropdown quand on clique ailleurs */}
      {dropdownOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 5 
          }} 
          onClick={() => setDropdownOpen(false)}
        />
      )}

      <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
        {/* Pas de limite sur le nombre de lignes affichées */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <td style={{ 
                textAlign: 'left', 
                padding: '4px 8px', 
                fontSize: '0.7rem', 
                color: 'var(--color-text-light)',
                fontStyle: 'italic'
              }}>
                {caReelData.length} ligne(s)
              </td>
              <td colSpan={9}></td>
            </tr>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', minWidth: '200px' }}>Restaurant</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Horaire</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Docs</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Montant Moyen HT</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Montant Moyen TTC</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', minWidth: '150px' }}>Montant Total HT</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', minWidth: '150px' }}>Montant Total TTC</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Source</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date Import</th>
            </tr>
          </thead>
          <tbody>
            {caReelData.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Aucune donnée trouvée.
                </td>
              </tr>
            ) : (
              <>
                {caReelData.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {(() => {
                        const entite = entites.find(e => e.id === item.id_entite);
                        return entite ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{entite.libelle}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                              {entite.code}
                            </span>
                          </div>
                        ) : item.id_entite;
                      })()}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {new Date(item.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {item.horaire}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {item.docs_emitidos || '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {item.montant_moyen_ht ? item.montant_moyen_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {item.montant_moyen_ttc ? item.montant_moyen_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right', whiteSpace: 'nowrap', minWidth: '150px' }}>
                      {item.montant_total_ht ? item.montant_total_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right', whiteSpace: 'nowrap', minWidth: '150px' }}>
                      {item.montant_total_ttc ? item.montant_total_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {item.source || '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {new Date(item.date_import).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
                {/* Ligne de total */}
                {caReelData.length > 0 && (
                  <tr>
                    <td colSpan={6} style={{ 
                      padding: '8px', 
                      borderTop: '2px solid #e5e7eb',
                      fontSize: '0.875rem',
                      fontWeight: 'bold', 
                      textAlign: 'right',
                      minWidth: '150px'
                    }}>
                      Total :
                    </td>
                    <td style={{ 
                      padding: '8px', 
                      borderTop: '2px solid #e5e7eb',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      textAlign: 'right',
                      minWidth: '150px'
                    }}>
                      {totals.montant_total_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td style={{ 
                      padding: '8px', 
                      borderTop: '2px solid #e5e7eb',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      textAlign: 'right',
                      minWidth: '150px'
                    }}>
                      {totals.montant_total_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td colSpan={2} style={{ padding: '8px', borderTop: '2px solid #e5e7eb' }}></td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Boîte de dialogue d'importation CSV */}
      <CSVImportDialog 
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImportComplete={handleDisplayClick}
      />
    </PageSection>
  );
}

export default RevenueTracking;