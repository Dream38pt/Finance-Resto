import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { theme } from '../../theme';
import { useToast } from '../../contexts/ToastContext';
import { useInvoices } from '../../hooks/useInvoices';
import { supabase } from '../../lib/supabase';
import { Invoice as InvoiceType } from '../../types/invoice';
import { InvoiceFilters } from '../../components/invoice/InvoiceFilters';
import { InvoiceList } from '../../components/invoice/InvoiceList';

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
      description="Sélectionnez les critères et cliquez sur Rechercher pour afficher les factures"
    >
      <div style={{ marginBottom: '2rem' }}>
        <InvoiceFilters
          entites={entites}
          filters={filters}
          setFilters={setFilters}
          onSearch={fetchInvoices}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <Button
          label="Ajouter une Facture"
          icon="Plus"
          color={theme.colors.primary}
          onClick={() => navigate('/finance/nouvelle-facture', { state: { selectedEntiteId: filters.entite_id } })}
        />
      </div>

      <InvoiceList 
        invoices={invoices}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </PageSection>
  );
}

export default Invoice;