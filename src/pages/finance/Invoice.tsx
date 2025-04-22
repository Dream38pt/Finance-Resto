import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSection } from '../../components/layout/page-layout';
import { Form } from '../../components/ui/form';
import { theme } from '../../theme';
import { useToast } from '../../contexts/ToastContext';
import { useInvoices } from '../../hooks/useInvoices';
import { supabase } from '../../lib/supabase';
import { Invoice as InvoiceType } from '../../types/invoice';
import { InvoiceFilters } from '../../components/invoice/InvoiceFilters';
import { InvoiceList } from '../../components/invoice/InvoiceList';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';

function Invoice() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userEntites, setUserEntites] = useState<string[]>([]);
  const {
    entites,
    invoices,
    loading,
    error,
    filters,
    setFilters,
    fetchInvoices
  } = useInvoices();

  // Vérifier si l'utilisateur est admin et récupérer ses entités autorisées
  useEffect(() => {
    async function checkUserPermissions() {
      if (!user) return;
      
      try {
        // Vérifier si l'utilisateur est un administrateur
        const { data: collaborateur } = await supabase
          .from('param_collaborateur')
          .select('id, role_id, param_role:role_id(libelle)')
          .eq('auth_id', user.id)
          .single();
        
        if (collaborateur?.param_role?.libelle === 'Administrateur') {
          setIsAdmin(true);
          return;
        }
        
        // Récupérer les entités auxquelles l'utilisateur a accès
        if (collaborateur) {
          const { data: habilitations } = await supabase
            .from('param_habilitation')
            .select('entite_id')
            .eq('collaborateur_id', collaborateur.id)
            .eq('est_actif', true)
            .gte('date_debut', new Date().toISOString())
            .or(`date_fin.is.null,date_fin.gte.${new Date().toISOString()}`);
          
          if (habilitations) {
            setUserEntites(habilitations.map(h => h.entite_id));
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des permissions:', error);
      }
    }
    
    checkUserPermissions();
  }, [user]);

  const handleEdit = (invoice: InvoiceType) => {
    navigate('/finance/nouvelle-facture', { 
      state: { 
        selectedEntiteId: invoice.entite_id,
        editMode: true,
        invoice: invoice
      } 
    });
  };

  const handleDelete = async (invoice: InvoiceType) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette facture ?`)) {
      try {
        const { error } = await supabase
          .from('fin_facture_achat')
          .delete()
          .eq('id', invoice.id);

        if (error) throw error;

        // Recharger la liste des factures
        await fetchInvoices();
        showToast({
          label: 'Facture supprimée avec succès',
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

  if (loading) {
    return (
      <PageSection
        title="Saisie des factures"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Saisie des factures"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <PageSection
      title="Saisie des factures"
      description="Gestion des factures d'achat"
    >
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <InvoiceFilters
          entites={entites}
          filters={filters}
          setFilters={setFilters}
          onSearch={fetchInvoices}
        />
        <Button
          label="Ajouter une Facture"
          icon="Plus"
          color={theme.colors.primary}
          onClick={() => {
            // Si l'utilisateur n'est pas admin et a accès à une seule entité, présélectionner cette entité
            if (!isAdmin && userEntites.length === 1) {
              navigate('/finance/nouvelle-facture', { state: { selectedEntiteId: userEntites[0] } });
            } else {
              navigate('/finance/nouvelle-facture', { state: { selectedEntiteId: filters.entite_id } });
            }
          }}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <InvoiceList 
          invoices={invoices}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </PageSection>
  );
}

export default Invoice;