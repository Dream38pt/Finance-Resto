import React from 'react';
import { PageLayout, PageSection } from '../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../components/ui/form';
import { Button } from '../components/ui/button';
import { Toggle } from '../components/ui/toggle';

function Settings() {
  return (
    <PageLayout>
      <PageSection
        title="Paramètres"
        description="Gérez vos préférences et configurations."
      />
    </PageLayout>
  );
}

export default Settings;