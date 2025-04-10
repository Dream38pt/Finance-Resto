import React from 'react';
import { PageLayout, PageSection } from '../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../components/ui/form';
import { Button } from '../components/ui/button';
import { Toggle } from '../components/ui/toggle';
import { theme } from '../theme';

function Settings() {
  const [notifications, setNotifications] = React.useState(true);
  const [newsletter, setNewsletter] = React.useState(false);

  return (
    <PageLayout>
      <PageSection
        title="Paramètres"
        description="Gérez vos préférences et configurations."
      />
      <PageSection
        subtitle="Général"
        description="Paramètres généraux de votre compte"
      >
        <Form size={70}>
          <FormField
            label="Nom d'utilisateur"
            description="Votre nom d'utilisateur public"
          >
            <FormInput
              type="text"
              placeholder="johndoe"
            />
          </FormField>
          
          <FormField
            label="Email"
            description="Votre adresse email principale"
          >
            <FormInput
              type="email"
              placeholder="john@example.com"
            />
          </FormField>
          
          <FormField
            label="Notifications"
            description="Gérez vos préférences de notifications"
          >
            <Toggle
              checked={notifications}
              onChange={setNotifications}
              color={theme.colors.primary}
              label="Activer les notifications"
              icon="Bell"
            />
          </FormField>
          
          <FormField
            label="Newsletter"
            description="Restez informé des dernières nouveautés"
          >
            <Toggle
              checked={newsletter}
              onChange={setNewsletter}
              color={theme.colors.primary}
              label="S'abonner à la newsletter"
              icon="Mail"
            />
          </FormField>
          
          <FormActions>
            <Button
              label="Annuler"
              color={theme.colors.secondary}
              type="button"
            />
            <Button
              label="Enregistrer"
              color={theme.colors.primary}
              icon="Save"
              type="submit"
            />
          </FormActions>
        </Form>
      </PageSection>
    </PageLayout>
  );
}

export default Settings;