import React from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { PageLayout } from '../../components/layout/page-layout';
import { HeaderGestionEmployesParam } from '../../components/layout/HeaderGestionEmployesParam';

function EmployeesSettings() {
  return (
    <PageLayout header={<HeaderGestionEmployesParam />}>
      <PageSection
        title="Paramétrages RH"
        description="Gestion des paramètres des ressources humaines"
      >
        {/* Le contenu sera ajouté ultérieurement */}
      </PageSection>
    </PageLayout>
  );
}

export default EmployeesSettings;