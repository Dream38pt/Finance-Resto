import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface PersonnelCout {
  personnel_id: string;
  nom_prenom: string;
  role_specifique: string | null;
  ordre_affichage: number | null;
  cout_mensuel: number;
  mois: number;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface BudgetData {
  service_ca: {
    libelle_service_ca: string;
  };
  mois: number;
  qjp: number;
  pvjp: number;
  ndj: number;
  cadm: number;
}

interface ParamTVA {
  tx_tva_ca: number;
}

interface BudgetCF {
  designation: string;
  ordre_affichage: number;
  montant: number;
  mois: number;
}

function BudgetView() {
  const [entites, setEntites] = useState<Entite[]>([]);
  const [selectedEntite, setSelectedEntite] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [budgetCF, setBudgetCF] = useState<BudgetCF[]>([]);
  const [tauxTVA, setTauxTVA] = useState<number>(0);
  const [personnelCouts, setPersonnelCouts] = useState<PersonnelCout[]>([]);
  const [tauxMP, setTauxMP] = useState<{[key: string]: number}>({});
  const { showToast } = useToast();

  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

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
      // Récupérer le taux de TVA
      const { data: tvadata, error: tvaerror } = await supabase
        .from('param_tva')
        .select('tx_tva_ca')
        .order('tx_tva_ca_datedebut', { ascending: false })
        .limit(1);

      if (tvaerror) throw tvaerror;
      
      if (tvadata && tvadata.length > 0) {
        setTauxTVA(tvadata[0].tx_tva_ca);
      }

      const { data, error } = await supabase
        .from('budget_ca_mensuel')
        .select(`
          service_ca (
            libelle_service_ca
          ),
          mois,
          qjp,
          pvjp,
          ndj,
          cadm
        `)
        .eq('entite_id', selectedEntite)
        .eq('annee', selectedYear)
        .order('service_ca_id')
        .order('mois');

      if (error) throw error;
      setBudgetData(data || []);
      // Récupérer les coûts fixes
      const { data: cfData, error: cfError } = await supabase
        .from('ca_budget_cf')
        .select('*')
        .eq('entite_id', selectedEntite)
        .eq('annee', selectedYear)
        .order('ordre_affichage', { ascending: true })
        .order('designation');

      if (cfError) throw cfError;
      setBudgetCF(cfData || []);

      // Récupérer les coûts du personnel
      const { data: personnelData, error: personnelError } = await supabase
        .from('v_cout_personnel_mensuel')
        .select('*')
        .eq('entite_id', selectedEntite)
        .eq('annee', selectedYear);

      if (personnelError) throw personnelError;
      setPersonnelCouts(personnelData || []);

      // Récupérer les taux de matière première
      const { data: mpData, error: mpError } = await supabase
        .from('ca_param_jours')
        .select('mois, tx_mp')
        .eq('entite_id', selectedEntite)
        .eq('annee', selectedYear);

      if (mpError) throw mpError;
      
      const tauxMPMap: {[key: string]: number} = {};
      mpData?.forEach(mp => {
        tauxMPMap[mp.mois] = mp.tx_mp;
      });
      setTauxMP(tauxMPMap);

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
        title="Visualisation Budget CA"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Visualisation Budget CA"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <PageSection
      title="Visualisation Budget CA"
      description="Visualisation du budget de chiffre d'affaires"
    >
      <Form size={70}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <FormField label="Restaurant">
            <select
              value={selectedEntite}
              onChange={(e) => setSelectedEntite(e.target.value)}
              style={{
                width: '300px',
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
                width: '120px',
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
            icon="Search"
            color={theme.colors.primary}
            onClick={handleDisplayClick}
          />
        </div>
      </Form>

      {budgetData.length > 0 && (
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', border: '2px solid black' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 8px', borderBottom: '2px solid black', fontSize: '0.75rem', textAlign: 'left', minWidth: '250px', borderRight: '1px solid black' }}>Service</th>
                {mois.map((m, index) => (
                  <th key={index} style={{ padding: '4px 8px', borderBottom: '2px solid black', fontSize: '0.75rem', textAlign: 'right', minWidth: '80px', borderRight: '1px solid black' }}>{m}</th>
                ))}
                <th style={{ padding: '4px 8px', borderBottom: '2px solid black', fontSize: '0.75rem', textAlign: 'right', minWidth: '100px', borderRight: '1px solid black' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(new Set(budgetData.map(b => b.service_ca.libelle_service_ca))).map(service => (
                <React.Fragment key={service}>
                  {/* Ligne QJP */}
                  <tr>
                    <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', borderRight: '1px solid black', minWidth: '250px' }}>
                      {service} - QJP
                    </td>
                    {mois.map((_, index) => {
                      const data = budgetData.find(b => 
                        b.service_ca.libelle_service_ca === service && 
                        b.mois === index + 1
                      );
                      return (
                        <td key={index} style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', borderRight: '1px solid black' }}>
                          {data?.qjp ? Math.round(data.qjp) : '-'}
                        </td>
                      );
                    })}
                    <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', borderRight: '1px solid black' }}>-</td>
                  </tr>

                  {/* Ligne PVJP */}
                  <tr>
                    <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', borderRight: '1px solid black' }}>
                      {service} - PVJP
                    </td>
                    {mois.map((_, index) => {
                      const data = budgetData.find(b => 
                        b.service_ca.libelle_service_ca === service && 
                        b.mois === index + 1
                      );
                      return (
                        <td key={index} style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', borderRight: '1px solid black' }}>
                          {data?.pvjp ? Math.round(data.pvjp).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : '-'}
                        </td>
                      );
                    })}
                    <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', borderRight: '1px solid black' }}>-</td>
                  </tr>

                  {/* Ligne NDJ */}
                  <tr>
                    <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', borderRight: '1px solid black' }}>
                      {service} - NDJ
                    </td>
                    {mois.map((_, index) => {
                      const data = budgetData.find(b => 
                        b.service_ca.libelle_service_ca === service && 
                        b.mois === index + 1
                      );
                      return (
                        <td key={index} style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', borderRight: '1px solid black' }}>
                          {data?.ndj || '-'}
                        </td>
                      );
                    })}
                    <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', borderRight: '1px solid black' }}>-</td>
                  </tr>

                  {/* Ligne CADM */}
                  <tr>
                    <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', fontWeight: 'bold', borderRight: '1px solid black' }}>
                      {service} - CADM
                    </td>
                    {mois.map((_, index) => {
                      const data = budgetData.find(b => 
                        b.service_ca.libelle_service_ca === service && 
                        b.mois === index + 1
                      );
                      return (
                        <td key={index} style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid black' }}>
                          {data?.cadm ? Math.round(data.cadm).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : '-'}
                        </td>
                      );
                    })}
                    <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid black' }}>
                      {budgetData
                        .filter(b => b.service_ca.libelle_service_ca === service)
                        .reduce((sum, b) => sum + (b.cadm || 0), 0)
                        .toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
              {/* Ligne vide */}
              <tr>
                <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid black' }}>&nbsp;</td>
                {mois.map((_, index) => (
                  <td key={index} style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid black' }}>&nbsp;</td>
                ))}
                <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid black' }}>&nbsp;</td>
              </tr>
              {/* Ligne Total */}
              <tr>
                <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', fontWeight: 'bold', borderRight: '1px solid black' }}>
                  Total CADM TTC
                </td>
                {mois.map((_, index) => {
                  const monthTotal = budgetData
                    .filter(b => b.mois === index + 1)
                    .reduce((sum, b) => sum + (b.cadm || 0), 0);
                  return (
                    <td key={index} style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid black' }}>
                      {monthTotal > 0 ? Math.round(monthTotal).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : '-'}
                    </td>
                  );
                })}
                <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid black' }}>
                  {budgetData
                    .reduce((sum, b) => sum + (b.cadm || 0), 0)
                    .toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </td>
              </tr>
              {/* Ligne Total HT */}
              <tr>
                <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', fontWeight: 'bold', borderRight: '1px solid black' }}>
                  Total CADM HT
                </td>
                {mois.map((_, index) => {
                  const monthTotal = budgetData
                    .filter(b => b.mois === index + 1)
                    .reduce((sum, b) => sum + (b.cadm || 0), 0);
                  const monthTotalHT = monthTotal / (1 + tauxTVA/100);
                  return (
                    <td key={index} style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid black' }}>
                      {monthTotal > 0 ? Math.round(monthTotalHT).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : '-'}
                    </td>
                  );
                })}
                <td style={{ padding: '2px 8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid black' }}>
                  {(budgetData
                    .reduce((sum, b) => sum + (b.cadm || 0), 0) / (1 + tauxTVA/100))
                    .toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </td>
              </tr>
              {/* Ligne vide supplémentaire */}
              <tr>
                <td style={{ padding: '0.67px 8px', borderBottom: '2px solid black', borderRight: '1px solid black' }}>&nbsp;</td>
                {mois.map((_, index) => (
                  <td key={index} style={{ padding: '0.67px 8px', borderBottom: '2px solid black', borderRight: '1px solid black' }}>&nbsp;</td>
                ))}
                <td style={{ padding: '0.67px 8px', borderBottom: '2px solid black', borderRight: '1px solid black' }}>&nbsp;</td>
              </tr>
            </tbody>
            {/* Ligne Taux MP */}
            <tbody>
              {/* Ligne Taux MP */}
              <tr>
                <td style={{ padding: '4px 8px', borderBottom: '0', borderRight: '1px solid black', fontSize: '0.65rem', fontWeight: 'bold' }}>
                  Tx Matière Première
                </td>
                {mois.map((_, index) => {
                  const moisNum = index + 1;
                  return (
                    <td key={index} style={{ padding: '4px 8px', borderBottom: '0', borderRight: '1px solid black', fontSize: '0.65rem', textAlign: 'right', fontWeight: 'bold' }}>
                      {tauxMP[moisNum] ? `${tauxMP[moisNum].toFixed(2)}%` : '-'}
                    </td>
                  );
                })}
                <td style={{ 
                  padding: '4px 8px', 
                  borderBottom: '0', 
                  borderRight: '1px solid black', 
                  fontSize: '0.65rem', 
                  textAlign: 'right', 
                  fontWeight: 'bold',
                  backgroundColor: theme.colors.primary,
                  color: 'white'
                }}>
                  {(() => {
                    const totalHT = budgetData.reduce((sum, b) => sum + (b.cadm || 0), 0) / (1 + tauxTVA/100);
                    const totalCoutMP = Object.entries(tauxMP).reduce((sum, [mois, taux]) => {
                      const monthTotal = budgetData
                        .filter(b => b.mois === parseInt(mois))
                        .reduce((sum, b) => sum + (b.cadm || 0), 0);
                      const monthTotalHT = monthTotal / (1 + tauxTVA/100);
                      return sum + (monthTotalHT * taux / 100);
                    }, 0);
                    return totalHT > 0 ? `${((totalCoutMP / totalHT) * 100).toFixed(2)}%` : '-';
                  })()}
                </td>
              </tr>
              {/* Ligne Coût Matière Première */}
              <tr>
                <td style={{ padding: '8px', borderBottom: '2px solid black', borderRight: '1px solid black', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                  Coût Matière Première
                </td>
                {mois.map((_, index) => {
                  const moisNum = index + 1;
                  const monthTotal = budgetData
                    .filter(b => b.mois === moisNum)
                    .reduce((sum, b) => sum + (b.cadm || 0), 0);
                  const monthTotalHT = monthTotal / (1 + tauxTVA/100);
                  const coutMP = monthTotalHT * (tauxMP[moisNum] || 0) / 100;
                  
                  return (
                    <td key={index} style={{ padding: '8px', borderBottom: '2px solid black', borderRight: '1px solid black', fontSize: '0.75rem', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                      {monthTotal > 0 && tauxMP[moisNum] ? Math.round(coutMP).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : '-'}
                    </td>
                  );
                })}
                <td style={{ padding: '8px', borderBottom: '2px solid black', borderRight: '1px solid black', fontSize: '0.75rem', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                  {(() => {
                    const totalHT = budgetData.reduce((sum, b) => sum + (b.cadm || 0), 0) / (1 + tauxTVA/100);
                    const totalCoutMP = Object.entries(tauxMP).reduce((sum, [mois, taux]) => {
                      const monthTotal = budgetData
                        .filter(b => b.mois === parseInt(mois))
                        .reduce((sum, b) => sum + (b.cadm || 0), 0);
                      const monthTotalHT = monthTotal / (1 + tauxTVA/100);
                      return sum + (monthTotalHT * taux / 100);
                    }, 0);
                    return totalCoutMP > 0 ? Math.round(totalCoutMP).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : '-';
                  })()}
                </td>
              </tr>
              {/* Coûts fixes */}
              {Array.from(new Set(budgetCF.map(cf => cf.designation))).map(designation => {
                const couts = budgetCF.filter(cf => cf.designation === designation);
                return (
                  <tr key={designation}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', borderRight: '1px solid black', minWidth: '250px' }}>
                      {designation}
                    </td>
                    {mois.map((_, index) => {
                      const cout = couts.find(c => c.mois === index + 1);
                      return (
                        <td key={index} style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', borderRight: '1px solid black' }}>
                          {cout ? Math.round(cout.montant).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : '-'}
                        </td>
                      );
                    })}
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', borderRight: '1px solid black' }}>
                      {couts.reduce((sum, cout) => sum + cout.montant, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                );
              })}
              {/* Total des coûts fixes */}
              {budgetCF.length > 0 && (
                <tr>
                  <td style={{ padding: '8px', borderBottom: '2px solid black', fontSize: '0.75rem', fontWeight: 'bold', borderRight: '1px solid black', minWidth: '250px' }}>
                    Total Coûts Fixes
                  </td>
                  {mois.map((_, index) => {
                    const total = budgetCF
                      .filter(cf => cf.mois === index + 1)
                      .reduce((sum, cf) => sum + cf.montant, 0);
                    return (
                      <td key={index} style={{ padding: '8px', borderBottom: '2px solid black', fontSize: '0.75rem', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid black' }}>
                        {total > 0 ? Math.round(total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : '-'}
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px', borderBottom: '2px solid black', fontSize: '0.75rem', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid black' }}>
                    {budgetCF.reduce((sum, cf) => sum + cf.montant, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Section des coûts du personnel */}
      {personnelCouts.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', border: '2px solid black' }}>
            <tbody>
              {Array.from(new Set(personnelCouts.map(p => p.personnel_id))).map(personnelId => {
                const employe = personnelCouts.find(p => p.personnel_id === personnelId);
                if (!employe) return null;
                
                return (
                  <tr key={personnelId}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', borderRight: '1px solid black', minWidth: '250px' }}>
                      {employe.nom_prenom} / <i>{employe.role_specifique || '-'}</i>
                    </td>
                    {mois.map((_, index) => {
                      const coutMois = personnelCouts.find(
                        p => p.personnel_id === personnelId && p.mois === index + 1
                      )?.cout_mensuel || 0;
                      
                      return (
                        <td key={index} style={{ 
                          padding: '8px', 
                          borderBottom: '1px solid #e5e7eb', 
                          fontSize: '0.75rem', 
                          textAlign: 'right',
                          borderRight: '1px solid black',
                          backgroundColor: coutMois > 0 ? 'transparent' : '#f3f4f6'
                        }}>
                          {coutMois > 0 ? Math.round(coutMois).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : '-'}
                        </td>
                      );
                    })}
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

export default BudgetView;