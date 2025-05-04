import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { ChevronDown, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface BankMovement {
  id: number;
  id_compte: string;
  compte?: {
    code: string;
    nom: string;
  };
  data_lancamento: string;
  data_valor: string;
  descricao: string;
  valor: number;
  saldo: number;
  referencia_doc: string | null;
  num_lettrage: number | null;
}

interface CompteBancaire {
  id: string;
  code: string;
  nom: string;
  id_entite: string;
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

function BankMovements() {
  const [mouvements, setMouvements] = useState<BankMovement[]>([]);
  const [comptes, setComptes] = useState<CompteBancaire[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [selectedComptes, setSelectedComptes] = useState<string[]>([]);
  const [selectedEntites, setSelectedEntites] = useState<string[]>([]);
  const [dropdownComptesOpen, setDropdownComptesOpen] = useState(false);
  const [dropdownEntitesOpen, setDropdownEntitesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [onlyNonLettered, setOnlyNonLettered] = useState(false);
  
  // Filtres
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
  });

  useEffect(() => {
    fetchEntites();
    fetchComptes();
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

  const fetchComptes = async () => {
    try {
      const { data, error } = await supabase
        .from('fin_compte_bancaire')
        .select(`
          id, 
          code, 
          nom, 
          id_entite,
          entite:id_entite (
            code,
            libelle
          )
        `)
        .eq('est_actif', true)
        .order('code');

      if (error) throw error;
      setComptes(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des comptes bancaires:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleDisplayClick = async () => {
    if (selectedComptes.length === 0 && selectedEntites.length === 0) {
      showToast({
        label: 'Veuillez sélectionner au moins un compte bancaire ou un restaurant',
        icon: 'AlertTriangle',
        color: theme.colors.warning
      });
      return;
    }

    try {
      setLoading(true);
   
      let query = supabase
        .from('fin_bq_Mouvement')
        .select(`
          id,
          id_compte,
          compte:id_compte (
            code,
            nom
          ),
          data_lancamento,
          data_valor,
          descricao,
          valor,
          saldo,
          referencia_doc,
          num_lettrage
        `)
        .limit(1000);
      
      // Filtrer par comptes sélectionnés
      if (selectedComptes.length > 0) {
        if (selectedComptes.length === 1) {
          query = query.eq('id_compte', selectedComptes[0]);
        } else {
          query = query.in('id_compte', selectedComptes);
        }
      } else if (selectedEntites.length > 0) {
        // Si aucun compte n'est sélectionné mais des entités le sont,
        // récupérer les comptes de ces entités
        const comptesEntites = comptes
          .filter(compte => selectedEntites.includes(compte.id_entite))
          .map(compte => compte.id);
        
        if (comptesEntites.length === 0) {
          showToast({
            label: 'Aucun compte bancaire trouvé pour les restaurants sélectionnés',
            icon: 'AlertTriangle',
            color: theme.colors.warning
          });
          setLoading(false);
          return;
        }
        
        if (comptesEntites.length === 1) {
          query = query.eq('id_compte', comptesEntites[0]);
        } else {
          query = query.in('id_compte', comptesEntites);
        }
      }
      
      // Filtrer par date de début
      if (filters.dateDebut) {
        query = query.gte('data_valor', filters.dateDebut);
      }
      
      // Filtrer par date de fin
      if (filters.dateFin) {
        query = query.lte('data_valor', filters.dateFin);
      }
      
      // Filtrer par num_lettrage vide si demandé
      if (onlyNonLettered) {
        query = query.is('num_lettrage', null);
      }
      
      // Ajouter l'ordre
      query = query.order('data_valor', { ascending: false })
                  .order('id', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      setMouvements(data || []);
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

  const handleCompteToggle = (compteId: string) => {
    setSelectedComptes(prev => {
      if (prev.includes(compteId)) {
        return prev.filter(id => id !== compteId);
      } else {
        return [...prev, compteId];
      }
    });
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

  const handleSelectAllComptes = () => {
    if (selectedComptes.length === comptes.length) {
      setSelectedComptes([]);
    } else {
      setSelectedComptes(comptes.map(c => c.id));
    }
  };

  const handleSelectAllEntites = () => {
    if (selectedEntites.length === entites.length) {
      setSelectedEntites([]);
    } else {
      setSelectedEntites(entites.map(e => e.id));
    }
  };

  const getDropdownComptesLabel = () => {
    if (selectedComptes.length === 0) {
      return "Sélectionner un compte";
    } else if (selectedComptes.length === 1) {
      const selected = comptes.find(c => c.id === selectedComptes[0]);
      return selected ? `${selected.code} - ${selected.nom}` : "1 compte sélectionné";
    } else {
      return `${selectedComptes.length} comptes sélectionnés`;
    }
  };

  const getDropdownEntitesLabel = () => {
    if (selectedEntites.length === 0) {
      return "Sélectionner un restaurant";
    } else if (selectedEntites.length === 1) {
      const selected = entites.find(e => e.id === selectedEntites[0]);
      return selected ? `${selected.code} - ${selected.libelle}` : "1 restaurant sélectionné";
    } else {
      return `${selectedEntites.length} restaurants sélectionnés`;
    }
  };

  // Calculer les totaux pour le tableau
  const totals = mouvements.reduce((acc, item) => ({
    credit: acc.credit + (item.valor > 0 ? item.valor : 0),
    debit: acc.debit + (item.valor < 0 ? Math.abs(item.valor) : 0)
  }), { credit: 0, debit: 0 });

  if (loading && entites.length === 0) {
    return (
      <PageSection
        title="Mouvements bancaires"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Mouvements bancaires"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <PageSection
      title="Mouvements bancaires"
      description="Consultez les mouvements bancaires par compte et par période"
    >
      <Form size={70}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
          <FormField label="Compte bancaire">
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setDropdownComptesOpen(!dropdownComptesOpen)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '2px solid var(--color-secondary)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-white)',
                  color: selectedComptes.length === 0 ? 'var(--color-text-light)' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getDropdownComptesLabel()}</span>
                <ChevronDown size={16} style={{ 
                  flexShrink: 0,
                  marginLeft: '8px',
                  transition: 'transform 0.2s',
                  transform: dropdownComptesOpen ? 'rotate(180deg)' : 'rotate(0)'
                }} />
              </div>
              
              {dropdownComptesOpen && (
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
                    onClick={handleSelectAllComptes}
                  >
                    <Checkbox
                      checked={selectedComptes.length === comptes.length && comptes.length > 0}
                      onChange={handleSelectAllComptes}
                      color={theme.colors.primary}
                      label="Sélectionner tout"
                    />
                  </div>
                  
                  {comptes.map(compte => (
                    <div 
                      key={compte.id} 
                      style={{ 
                        padding: '0.5rem',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleCompteToggle(compte.id)}
                    >
                      <Checkbox
                        checked={selectedComptes.includes(compte.id)}
                        onChange={() => handleCompteToggle(compte.id)}
                        color={theme.colors.primary}
                        label={`${compte.code} - ${compte.nom}`}
                      />
                    </div>
                  ))}
                  
                  {comptes.length === 0 && (
                    <div style={{ padding: '0.75rem', color: 'var(--color-text-light)', textAlign: 'center' }}>
                      Aucun compte bancaire disponible
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormField>
          
          <FormField label="Restaurant">
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setDropdownEntitesOpen(!dropdownEntitesOpen)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
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
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getDropdownEntitesLabel()}</span>
                <ChevronDown size={16} style={{ 
                  flexShrink: 0,
                  marginLeft: '8px',
                  transition: 'transform 0.2s',
                  transform: dropdownEntitesOpen ? 'rotate(180deg)' : 'rotate(0)'
                }} />
              </div>
              
              {dropdownEntitesOpen && (
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
                    onClick={handleSelectAllEntites}
                  >
                    <Checkbox
                      checked={selectedEntites.length === entites.length && entites.length > 0}
                      onChange={handleSelectAllEntites}
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

          <FormField label="Date de début">
            <input
              type="date"
              value={filters.dateDebut}
              onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
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

          <FormField label="Date de fin">
            <input
              type="date"
              value={filters.dateFin}
              onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
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
            label={loading ? "Chargement..." : "Afficher"}
            icon="Search"
            color={theme.colors.primary}
            onClick={handleDisplayClick}
            disabled={loading}
          />
        </div>
        
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center' }}>
          <Checkbox
            checked={onlyNonLettered}
            onChange={() => setOnlyNonLettered(!onlyNonLettered)}
            color={theme.colors.primary}
            label="Afficher uniquement les écritures non lettrées"
          />
        </div>
      </Form>

      {/* Fermer les dropdowns quand on clique ailleurs */}
      {dropdownComptesOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 5 
          }} 
          onClick={() => setDropdownComptesOpen(false)}
        />
      )}
      
      {dropdownEntitesOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 5 
          }} 
          onClick={() => setDropdownEntitesOpen(false)}
        />
      )}

      <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>
            Chargement des données...
          </div>
        ) : dataLoaded && mouvements.length > 0 ? (
          <>
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
                    {mouvements.length} mouvement(s)
                  </td>
                  <td colSpan={7}></td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Compte</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date opération</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date valeur</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Description</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Débit</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Crédit</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Solde</th>
                  <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>N° Lettrage</th>
                </tr>
              </thead>
              <tbody>
                {mouvements.map((mouvement) => (
                  <tr key={mouvement.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {mouvement.compte ? (
                        <span>{mouvement.compte.code} - {mouvement.compte.nom}</span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} style={{ color: theme.colors.primary }} />
                        {mouvement.data_lancamento ? new Date(mouvement.data_lancamento).toLocaleDateString('fr-FR') : '-'}
                      </div>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {mouvement.data_valor ? new Date(mouvement.data_valor).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {mouvement.descricao}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {mouvement.valor < 0 ? Math.abs(mouvement.valor).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {mouvement.valor > 0 ? mouvement.valor.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {mouvement.saldo.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                      {mouvement.num_lettrage || '-'}
                    </td>
                  </tr>
                ))}
                {/* Ligne de total */}
                <tr>
                  <td colSpan={4} style={{ 
                    padding: '8px', 
                    borderTop: '2px solid #e5e7eb',
                    fontSize: '0.875rem',
                    fontWeight: 'bold', 
                    textAlign: 'right'
                  }}>
                    Total :
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    borderTop: '2px solid #e5e7eb',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    textAlign: 'right'
                  }}>
                    {totals.debit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    borderTop: '2px solid #e5e7eb',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    textAlign: 'right'
                  }}>
                    {totals.credit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td colSpan={2} style={{ padding: '8px', borderTop: '2px solid #e5e7eb' }}></td>
                </tr>
              </tbody>
            </table>
          </>
        ) : dataLoaded ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>
            Aucun mouvement bancaire trouvé pour les critères sélectionnés.
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>
            Veuillez sélectionner au moins un compte bancaire ou un restaurant et cliquer sur "Afficher".
          </div>
        )}
      </div>
    </PageSection>
  );
}

export default BankMovements;