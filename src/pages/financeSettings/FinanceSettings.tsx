import React from 'react';
import { PageLayout } from '../../components/layout/page-layout';
import { PageSection } from '../../components/layout/page-layout';
import { HeaderGestionFinanciereParam } from '../../components/layout/HeaderGestionFinanciereParam';

function FinanceSettings() {
  return (
    <PageLayout header={<HeaderGestionFinanciereParam />}>
      <PageSection
        title="Paramètres Gestion Financière"
        description="Configuration des paramètres de la gestion financière"
      >
        {/* Le contenu sera ajouté ultérieurement */}
      </PageSection>
    </PageLayout>
  );
}

export default FinanceSettings;