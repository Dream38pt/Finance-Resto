import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { theme } from '../../theme';
import { useInvoices } from '../../hooks/useInvoices';
import { InvoiceFilters } from '../../components/invoice/InvoiceFilters';
import { InvoiceList } from '../../components/invoice/InvoiceList';

function Invoice() {
  const navigate = useNavigate();
  const {
    entites,
    invoices,
    loading,
    error,
    filters,
    setFilters,
    fetchInvoices
  } = useInvoices();

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

      <InvoiceList invoices={invoices} />
    </PageSection>
  );
}

export default Invoice;