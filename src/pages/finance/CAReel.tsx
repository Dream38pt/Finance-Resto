import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { ChevronDown, Check, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';
import { CSVImportDialog } from '../../components/csv-import/CSVImportDialog';

interface CAReelJour {
  id: string;
  id_entite: string;
  entite?: {
    code: string;
    libelle: string;
  };
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

function CAReel() {
  const [caReelData, setCAReelData] = useState<CAReelJour[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [selectedEntites, setSelectedEntites] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [dataLoaded, setDataLoaded] = useState(false);

  const mois = [
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  const handleDisplayClick = async () => {
    if (selectedEntites.length === 0) {
      showToast({
        label: 'Veuillez sélectionner au moins un restaurant',
        icon: 'AlertTriangle',
        color: theme.colors.warning
      });
      return;
    }

    try {
      setLoading(true);
   
      let query = supabase
        .from('ca_reel_jour')
        .limit(99999); // ← lève la limite de 1000   
      
      
      // Filtrer par entités sélectionnées
      if (selectedEntites.length === 1) {
        query = query.eq('id_entite', selectedEntites[0]);
      } else {
        query = query.in('id_entite', selectedEntites);
      }
      
      // Ajouter les jointures et l'ordre
      query = query.select(`
          *,
          entite:id_entite (
            code,
            libelle
          )
        `)
        .order('date', { ascending: true })
        .order('id_entite', { ascending: true })
        .order('horaire', { ascending: true });

      // Filtrer par année
      if (selectedYear) {
        const startDate = `${selectedYear}-01-01`;
        const endDate = `${selectedYear}-12-31`;
        
        // Si un mois est sélectionné, filtrer par mois
        if (selectedMonth) {
          const month = parseInt(selectedMonth);
          const lastDay = new Date(selectedYear, month, 0).getDate();
          const monthStr = month.toString().padStart(2, '0');
          
          query = query
            .gte('date', `${selectedYear}-${monthStr}-01`)
            .lte('date', `${selectedYear}-${monthStr}-${lastDay}`);
        } else {
          query = query
            .gte('date', startDate)
            .lte('date', endDate);
        }
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setCAReelData(data || []);
      setDataLoaded(true);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors du chargement des données',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
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

  // Grouper les données par jour
  const groupedByDay = caReelData.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, CAReelJour[]>);

  // Calculer les totaux par jour
  const dailyTotals = Object.entries(groupedByDay).map(([date, items]) => {
    const totalHT = items.reduce((sum, item) => sum + (item.montant_total_ht || 0), 0);
    const totalTTC = items.reduce((sum, item) => sum + (item.montant_total_ttc || 0), 0);
    const totalDocs = items.reduce((sum, item) => sum + (item.docs_emitidos || 0), 0);
    
    return {
      date,
      totalHT,
      totalTTC,
      totalDocs
    };
  });

  // Calculer les totaux globaux
  const grandTotalHT = dailyTotals.reduce((sum, day) => sum + day.totalHT, 0);
  const grandTotalTTC = dailyTotals.reduce((sum, day) => sum + day.totalTTC, 0);
  const grandTotalDocs = dailyTotals.reduce((sum, day) => sum + day.totalDocs, 0);

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

  return (
    <PageSection
      title="Suivi du CA Réel"
      description="Suivi du chiffre d'affaires réel par jour et par heure"
    >
      <Form size={70}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
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
                  cursor: 'pointer'
                }}
              >
                <span>{getDropdownLabel()}</span>
                <ChevronDown size={16} style={{ 
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
                    onClick={handleSelectAll}
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

          <FormField label="Mois">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
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
              {mois.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </FormField>
          
          <Button
            label={loading ? "Chargement..." : "Afficher"}
            icon="Search"
            color={theme.colors.primary}
            onClick={handleDisplayClick}
            disabled={loading && !dataLoaded}
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>
            Chargement des données...
          </div>
        ) : dataLoaded && caReelData.length > 0 ? (
          <>
            {Object.entries(groupedByDay).map(([date, items]) => (
              <div key={date} style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                  {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'left' }}>Restaurant</th>
                      <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'left' }}>Heure</th>
                      <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Docs</th>
                      <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Montant Moyen HT</th>
                      <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Montant Moyen TTC</th>
                      <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Montant Total HT</th>
                      <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Montant Total TTC</th>
                      <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'left' }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                          {item.entite?.code || '-'}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                          {item.horaire.substring(0, 5).replace(':', 'h')}
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
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                          {item.montant_total_ht ? item.montant_total_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '-'}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                          {item.montant_total_ttc ? item.montant_total_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '-'}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                          {item.source || '-'}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <td style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', fontWeight: 'bold' }}>
                        Total du {new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right', fontWeight: 'bold' }}>
                        {items.reduce((sum, item) => sum + (item.docs_emitidos || 0), 0)}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                        -
                      </td>
                      <td style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                        -
                      </td>
                      <td style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right', fontWeight: 'bold' }}>
                        {items.reduce((sum, item) => sum + (item.montant_total_ht || 0), 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right', fontWeight: 'bold' }}>
                        {items.reduce((sum, item) => sum + (item.montant_total_ttc || 0), 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>
                        -
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}

            {/* Totaux globaux */}
            <div style={{ marginTop: '2rem', backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Totaux de la période</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Documents émis</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{grandTotalDocs}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Total HT</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{grandTotalHT.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Total TTC</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{grandTotalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                </div>
              </div>
            </div>
          </>
        ) : dataLoaded ? (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'left' }}>Restaurant</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'left' }}>Heure</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Docs</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Montant Moyen HT</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Montant Moyen TTC</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Montant Total HT</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Montant Total TTC</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'left' }}>Source</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-light)' }}>
                    Aucune donnée trouvée pour les critères sélectionnés.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'left' }}>Restaurant</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'left' }}>Heure</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Docs</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Montant Moyen HT</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Montant Moyen TTC</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Montant Total HT</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>Montant Total TTC</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'left' }}>Source</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-light)' }}>
                    Aucune donnée trouvée. Veuillez sélectionner au moins un restaurant et cliquer sur "Afficher".
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
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

export default CAReel;