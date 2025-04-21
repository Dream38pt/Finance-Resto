import React, { useState } from 'react';
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

function Invoice() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    entites,
    invoices,
    loading,
    error,
    filters,
    setFilters,
    fetchInvoices
  } = useInvoices();

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
          onClick={() => navigate('/finance/nouvelle-facture', { state: { selectedEntiteId: filters.entite_id } })}
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