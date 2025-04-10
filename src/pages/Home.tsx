import React from 'react';
import { PageLayout, PageSection } from '../components/layout/page-layout';
import { Button } from '../components/ui/button';
import { Toggle } from '../components/ui/toggle';
import { Checkbox } from '../components/ui/checkbox';
import { Dropdown } from '../components/ui/dropdown';
import { ProgressBar } from '../components/ui/progress-bar';
import { Form, FormField, FormInput, FormActions } from '../components/ui/form';
import { useToast } from '../contexts/ToastContext';
import styles from './Home.module.css';
import { theme } from '../theme';

function Home() {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [primary, setPrimary] = React.useState(false);
  const [secondary, setSecondary] = React.useState(false);
  const [warning, setWarning] = React.useState(false);
  const [option1, setOption1] = React.useState(false);
  const [option2, setOption2] = React.useState(false);
  const [option3, setOption3] = React.useState(false);
  const [selectedLanguage, setSelectedLanguage] = React.useState('');
  const [selectedTheme, setSelectedTheme] = React.useState('');
  const [selectedSize, setSelectedSize] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState('');
  const [selectedIcon, setSelectedIcon] = React.useState('');
  const { toasts, showToast, closeToast } = useToast();

  const languages = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'de', label: 'Deutsch' }
  ];

  const themes = [
    { value: 'light', label: 'Thème clair' },
    { value: 'dark', label: 'Thème sombre' },
    { value: 'system', label: 'Système' }
  ];

  const sizes = [
    { value: 'xs', label: 'Extra petit' },
    { value: 'sm', label: 'Petit' },
    { value: 'md', label: 'Moyen' },
    { value: 'lg', label: 'Grand' },
    { value: 'xl', label: 'Extra grand' }
  ];

  const colors = [
    { value: 'slate', label: 'Slate' },
    { value: 'gray', label: 'Gris' },
    { value: 'zinc', label: 'Zinc' },
    { value: 'neutral', label: 'Neutre' },
    { value: 'stone', label: 'Pierre' }
  ];

  const icons = [
    { value: 'sun', label: 'Soleil', icon: 'Sun' },
    { value: 'moon', label: 'Lune', icon: 'Moon' },
    { value: 'star', label: 'Étoile', icon: 'Star' },
    { value: 'cloud', label: 'Nuage', icon: 'Cloud' },
    { value: 'heart', label: 'Cœur', icon: 'Heart' }
  ];

  return (
    <PageLayout>
      <PageSection
        title="Bienvenue"
        description="Découvrez nos différents styles de boutons utilisant notre thème personnalisé."
        subtitle="Boutons avec icônes"
      >
          <div className={styles.buttons}>
            <Button color={theme.colors.primary} icon="Home" label="Primary" />
            <Button color={theme.colors.secondary} icon="Settings" label="Secondary" />
            <Button color={theme.colors.warning} icon="AlertTriangle" label="Warning" />
            <Button color="#14b8a6" icon="Leaf" label="Teal" />
            <Button color="#8b5cf6" icon="Sparkles" label="Purple" />
          </div>
      </PageSection>
      
      <PageSection subtitle="Boutons sans icônes">
          <div className={styles.buttons}>
            <Button color={theme.colors.primary} label="Primary" />
            <Button color={theme.colors.secondary} label="Secondary" />
            <Button color={theme.colors.warning} label="Warning" />
            <Button color="#14b8a6" label="Teal" />
            <Button color="#8b5cf6" label="Purple" />
          </div>
      </PageSection>
      
      <PageSection subtitle="Tailles de boutons">
          <div className={styles.buttons}>
            <Button
              color={theme.colors.primary}
              label="Petit"
              size="sm"
              icon="ArrowRight"
            />
            <Button
              color={theme.colors.primary}
              label="Moyen"
              size="md"
              icon="ArrowRight"
            />
            <Button
              color={theme.colors.primary}
              label="Grand"
              size="lg"
              icon="ArrowRight"
            />
          </div>
      </PageSection>
      
      <PageSection subtitle="Toggles">
          <div className={styles.toggles}>
            <div className={styles.toggleGroup}>
              <Toggle
                checked={primary}
                onChange={setPrimary}
                color={theme.colors.primary}
                label="Primary"
                icon="Check"
                showIcon
              />
            </div>
            <div className={styles.toggleGroup}>
              <Toggle
                checked={secondary}
                onChange={setSecondary}
                color={theme.colors.secondary}
                label="Secondary"
                icon="Settings"
                showIcon
              />
            </div>
            <div className={styles.toggleGroup}>
              <Toggle
                checked={warning}
                onChange={setWarning}
                color={theme.colors.warning}
                label="Warning"
                icon="Bell"
                showIcon={false}
              />
            </div>
            <div className={styles.toggleGroup}>
              <Toggle
                disabled
                color={theme.colors.warning}
                label="Option désactivée"
                icon="Lock"
                showIcon
              />
            </div>
          </div>
      </PageSection>
      
      <PageSection subtitle="Checkboxes">
          <div className={styles.toggles}>
            <div className={styles.toggleGroup}>
              <Checkbox
                checked={option1}
                onChange={setOption1}
                color={theme.colors.primary}
                label="Option primaire"
                icon="Check"
              />
            </div>
            <div className={styles.toggleGroup}>
              <Checkbox
                checked={option2}
                onChange={setOption2}
                color={theme.colors.secondary}
                label="Option secondaire"
                size="lg"
                icon="Star"
              />
            </div>
            <div className={styles.toggleGroup}>
              <Checkbox
                checked={option3}
                onChange={setOption3}
                color={theme.colors.warning}
                label="Option d'avertissement"
                size="sm"
                icon="AlertTriangle"
              />
            </div>
            <div className={styles.toggleGroup}>
              <Checkbox
                disabled
                label="Option désactivée"
                icon="Lock"
              />
            </div>
          </div>
      </PageSection>
      
      <PageSection subtitle="Listes déroulantes">
          <div className={styles.toggles}>
            <div className={styles.toggleGroup}>
              <span className={styles.textMuted}>Taille normale :</span>
              <Dropdown
                options={languages}
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                color={theme.colors.primary}
                icon="Globe"
                label="Choisir une langue"
              />
            </div>
            <div className={styles.toggleGroup}>
              <span className={styles.textMuted}>Petite taille :</span>
              <Dropdown
                options={sizes}
                value={selectedSize}
                onChange={setSelectedSize}
                color="#8b5cf6"
                icon="Ruler"
                label="Choisir une taille"
                size="sm"
              />
            </div>
            <div className={styles.toggleGroup}>
              <span className={styles.textMuted}>Grande taille :</span>
              <Dropdown
                options={themes}
                value={selectedTheme}
                onChange={setSelectedTheme}
                color={theme.colors.secondary}
                icon="Sun"
                label="Choisir un thème"
                size="lg"
              />
            </div>
            <div className={styles.toggleGroup}>
              <span className={styles.textMuted}>Sans icône :</span>
              <Dropdown
                options={colors}
                value={selectedColor}
                onChange={setSelectedColor}
                color="#14b8a6"
                label="Choisir une couleur"
              />
            </div>
            <div className={styles.toggleGroup}>
              <span className={styles.textMuted}>Avec icônes dans les options :</span>
              <Dropdown
                options={icons}
                value={selectedIcon}
                onChange={setSelectedIcon}
                color="#f43f5e"
                icon="Palette"
                label="Choisir une icône"
              />
            </div>
          </div>
      </PageSection>
      
      <PageSection subtitle="Barres de progression">
          <div className={styles.toggles}>
            <div className={styles.toggleGroup}>
              <span className={styles.textMuted}>Taille normale :</span>
              <ProgressBar
                percent={75}
                color={theme.colors.primary}
                icon="Activity"
                label="Chargement..."
              />
            </div>
            <div className={styles.toggleGroup}>
              <span className={styles.textMuted}>Petite taille :</span>
              <ProgressBar
                percent={45}
                color="#8b5cf6"
                icon="Download"
                size="sm"
              />
            </div>
            <div className={styles.toggleGroup}>
              <span className={styles.textMuted}>Grande taille :</span>
              <ProgressBar
                percent={90}
                color={theme.colors.warning}
                icon="Upload"
                size="lg"
              />
            </div>
            <div className={styles.toggleGroup}>
              <span className={styles.textMuted}>Sans icône :</span>
              <ProgressBar
                percent={60}
                color="#14b8a6"
              />
            </div>
            <div className={styles.toggleGroup}>
              <span className={styles.textMuted}>Label personnalisé :</span>
              <ProgressBar
                percent={85}
                color="#f43f5e"
                icon="Heart"
                label="85 points"
              />
            </div>
          </div>
      </PageSection>
      
      <PageSection
        subtitle="Formulaire simple (100%, 1 colonne)"
        description="Un formulaire basique avec une disposition en une colonne"
      >
          <Form onSubmit={(e) => {
            showToast({
              label: 'Formulaire soumis !',
              icon: 'Check',
              color: '#10b981'
            });
          }}>
            <FormField
              label="Nom d'utilisateur"
              required
              description="Choisissez un nom d'utilisateur unique"
            >
              <FormInput
                type="text"
                placeholder="john_doe"
              />
            </FormField>
            
            <FormField
              label="Email"
              required
              error="L'email est invalide"
            >
              <FormInput
                type="email"
                placeholder="john@example.com"
                error
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
              label="Thème"
              description="Choisissez votre thème préféré"
            >
              <Dropdown
                options={themes}
                value={selectedTheme}
                onChange={setSelectedTheme}
                color={theme.colors.primary}
                icon="Palette"
                label="Sélectionner un thème"
              />
            </FormField>
            
            <FormField
              label="Options"
            >
              <Checkbox
                checked={option1}
                onChange={setOption1}
                color={theme.colors.primary}
                label="Sauvegarder mes préférences"
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

      <PageSection
        subtitle="Formulaire compact (50%, 1 colonne)"
        description="Version compacte du formulaire avec une largeur réduite"
      >
          <Form
            size={50}
            onSubmit={(e) => {
              showToast({
                label: 'Formulaire compact soumis !',
                icon: 'Check',
                color: '#10b981'
              });
            }}
          >
            <FormField label="Nom" required>
              <FormInput type="text" placeholder="John Doe" />
            </FormField>
            
            <FormField label="Email" required>
              <FormInput type="email" placeholder="john@example.com" />
            </FormField>
            
            <FormActions>
              <Button
                label="Envoyer"
                color={theme.colors.primary}
                icon="Send"
                type="submit"
              />
            </FormActions>
          </Form>
      </PageSection>

      <PageSection
        subtitle="Formulaire large (100%, 2 colonnes)"
        description="Formulaire sur deux colonnes pour une meilleure organisation des champs"
      >
          <Form
            columns={2}
            onSubmit={(e) => {
              showToast({
                label: 'Formulaire large soumis !',
                icon: 'Check',
                color: '#10b981'
              });
            }}
          >
            <FormField label="Prénom" required>
              <FormInput type="text" placeholder="John" />
            </FormField>
            
            <FormField label="Nom" required>
              <FormInput type="text" placeholder="Doe" />
            </FormField>
            
            <FormField label="Email" required>
              <FormInput type="email" placeholder="john@example.com" />
            </FormField>
            
            <FormField label="Téléphone">
              <FormInput type="tel" placeholder="+33 6 12 34 56 78" />
            </FormField>
            
            <FormField label="Pays">
              <Dropdown
                options={[
                  { value: 'fr', label: 'France' },
                  { value: 'us', label: 'États-Unis' },
                  { value: 'uk', label: 'Royaume-Uni' }
                ]}
                color={theme.colors.primary}
                icon="Globe"
                label="Sélectionner un pays"
              />
            </FormField>
            
            <FormField label="Ville">
              <FormInput type="text" placeholder="Paris" />
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

      <PageSection
        subtitle="Formulaire compact (70%, 3 colonnes)"
        description="Formulaire multi-colonnes avec une largeur optimisée"
      >
          <Form
            size={70}
            columns={3}
            onSubmit={(e) => {
              showToast({
                label: 'Formulaire multi-colonnes soumis !',
                icon: 'Check',
                color: '#10b981'
              });
            }}
          >
            <FormField label="Nom">
              <FormInput type="text" placeholder="Nom" />
            </FormField>
            
            <FormField label="Prénom">
              <FormInput type="text" placeholder="Prénom" />
            </FormField>
            
            <FormField label="Age">
              <FormInput type="number" placeholder="25" />
            </FormField>
            
            <FormField label="Email">
              <FormInput type="email" placeholder="email@example.com" />
            </FormField>
            
            <FormField label="Téléphone">
              <FormInput type="tel" placeholder="Téléphone" />
            </FormField>
            
            <FormField label="Site web">
              <FormInput type="url" placeholder="https://" />
            </FormField>
            
            <FormActions>
              <Button
                label="Envoyer"
                color={theme.colors.primary}
                icon="Send"
                type="submit"
              />
            </FormActions>
          </Form>
      </PageSection>

      <PageSection
        subtitle="Notifications Toast"
        description="Cliquez sur les boutons pour voir différents styles de notifications."
      >
          <div className={styles.buttons}>
            <Button
              color={theme.colors.primary}
              icon="Bell"
              label="Notification"
              onClick={() => showToast({
                label: 'Nouvelle notification !',
                icon: 'Bell',
                color: theme.colors.primary
              })}
            />
            <Button
              color={theme.colors.secondary}
              icon="Settings"
              label="Paramètres"
              onClick={() => showToast({
                label: 'Paramètres mis à jour',
                icon: 'Settings',
                color: theme.colors.secondary,
                duration: 5000
              })}
            />
            <Button
              color={theme.colors.warning}
              icon="AlertTriangle"
              label="Attention"
              onClick={() => showToast({
                label: 'Action requise !',
                icon: 'AlertTriangle',
                color: theme.colors.warning
              })}
            />
            <Button
              color="#10b981"
              icon="Check"
              label="Succès"
              onClick={() => showToast({
                label: 'Opération réussie !',
                icon: 'Check',
                color: '#10b981'
              })}
            />
          </div>
      </PageSection>
    </PageLayout>
  );
}

export default Home;