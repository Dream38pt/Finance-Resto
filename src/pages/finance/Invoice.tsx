import React from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

function Invoice() {
  const { showToast } = useToast();

  return (
    <PageSection
      title="Saisie des factures"
      description="Gestion des factures fournisseurs"
    >
      <Form size={70}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <FormField label="Restaurant">
            <select
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
            </select>
          </FormField>
          
          <Button
            label="Nouvelle facture"
            icon="Plus"
            color={theme.colors.primary}
          />
        </div>
      </Form>
    </PageSection>
  );
}

export default Invoice;