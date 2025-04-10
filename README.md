# React UI Components Library

Une bibliothèque de composants React modernes et personnalisables.

## Composants

### Button

Un bouton personnalisable avec support des icônes et différentes tailles.

```tsx
import { Button } from './components/ui/button';

<Button label="Click me" />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Texte du bouton (requis) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille du bouton |
| `color` | `string` | - | Couleur personnalisée (format CSS) |
| `icon` | `keyof typeof icons` | - | Nom de l'icône Lucide React |
| `className` | `string` | `''` | Classes CSS additionnelles |
| `...props` | `ButtonHTMLAttributes` | - | Attributs HTML standard du bouton |

### Toggle

Un composant de bascule (switch) avec support des icônes et des labels.

```tsx
import { Toggle } from './components/ui/toggle';

<Toggle checked={checked} onChange={setChecked} />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | État du toggle |
| `onChange` | `(checked: boolean) => void` | - | Fonction appelée lors du changement d'état |
| `disabled` | `boolean` | `false` | Désactive le toggle |
| `color` | `string` | - | Couleur personnalisée |
| `label` | `string` | - | Label du toggle |
| `icon` | `keyof typeof icons` | - | Icône à afficher dans le thumb |
| `showIcon` | `boolean` | `false` | Affiche l'icône même quand désactivé |
| `className` | `string` | `''` | Classes CSS additionnelles |

### Checkbox

Une case à cocher personnalisable avec support des icônes et des labels.

```tsx
import { Checkbox } from './components/ui/checkbox';

<Checkbox checked={checked} onChange={setChecked} />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | État de la case à cocher |
| `onChange` | `(checked: boolean) => void` | - | Fonction appelée lors du changement d'état |
| `disabled` | `boolean` | `false` | Désactive la case à cocher |
| `color` | `string` | - | Couleur personnalisée |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille de la case à cocher |
| `icon` | `keyof typeof icons` | `'Check'` | Icône à afficher quand cochée |
| `label` | `string` | - | Label de la case à cocher |
| `className` | `string` | `''` | Classes CSS additionnelles |

### Toast

Un composant de notification contextuelle non-obstructive.

```tsx
import { useToast } from './hooks/useToast';

const { showToast } = useToast();

showToast({
  label: "Notification",
  icon: "Bell",
  color: "#3b82f6"
});
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | - | Couleur de la notification |
| `icon` | `keyof typeof icons` | `'Bell'` | Icône de la notification |
| `label` | `string` | - | Texte de la notification |
| `duration` | `number` | `3000` | Durée d'affichage en millisecondes |

### Card

Un conteneur avec ombre et coins arrondis.

```tsx
import { Card } from './components/ui/card';

<Card>Content</Card>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Contenu de la carte |
| `className` | `string` | `''` | Classes CSS additionnelles |

### Dropdown

Une liste déroulante personnalisable avec support des icônes.

```tsx
import { Dropdown } from './components/ui/dropdown';

<Dropdown
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  value={value}
  onChange={setValue}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `Array<{ value: string, label: string }>` | - | Liste des options (requis) |
| `value` | `string` | - | Valeur sélectionnée |
| `onChange` | `(value: string) => void` | - | Fonction appelée lors de la sélection |
| `color` | `string` | - | Couleur personnalisée |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille de la liste déroulante |
| `icon` | `keyof typeof icons` | - | Icône à afficher |
| `label` | `string` | `'Sélectionner'` | Texte affiché quand aucune option n'est sélectionnée |
| `className` | `string` | `''` | Classes CSS additionnelles |

### ProgressBar

Une barre de progression personnalisable avec support des icônes et des labels.

```tsx
import { ProgressBar } from './components/ui/progress-bar';

<ProgressBar percent={75} />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `percent` | `number` | - | Pourcentage de progression (0-100) |
| `color` | `string` | - | Couleur personnalisée |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille de la barre |
| `icon` | `keyof typeof icons` | - | Icône à afficher |
| `label` | `string` | - | Label personnalisé (si non défini, affiche le pourcentage) |
| `className` | `string` | `''` | Classes CSS additionnelles |

## Composants de Formulaire

### Form

Conteneur principal pour les formulaires.

```tsx
import { Form } from './components/ui/form';

<Form onSubmit={handleSubmit}>
  <FormField label="Email">
    <FormInput type="email" />
  </FormField>
</Form>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `100` | Largeur du formulaire en pourcentage |
| `columns` | `number` | `1` | Nombre de colonnes pour la disposition des champs |
| `onSubmit` | `(e: React.FormEvent) => void` | - | Fonction appelée lors de la soumission |
| `className` | `string` | `''` | Classes CSS additionnelles |

### FormField

Groupe de champ de formulaire avec label, description et gestion des erreurs.

```tsx
import { FormField } from './components/ui/form';

<FormField
  label="Email"
  required
  error="Email invalide"
  description="Entrez votre adresse email"
>
  <FormInput type="email" />
</FormField>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label du champ |
| `required` | `boolean` | `false` | Indique si le champ est requis |
| `error` | `string` | - | Message d'erreur |
| `description` | `string` | - | Description du champ |
| `children` | `ReactNode` | - | Contenu du champ |
| `className` | `string` | `''` | Classes CSS additionnelles |

### FormInput

Champ de saisie stylisé.

```tsx
import { FormInput } from './components/ui/form';

<FormInput
  type="text"
  placeholder="Entrez votre nom"
  error={!!errorMessage}
/>
```

### FormActions

Conteneur pour les boutons d'action du formulaire.

```tsx
import { FormActions } from './components/ui/form';

<FormActions>
  <Button label="Annuler" />
  <Button label="Enregistrer" type="submit" />
</FormActions>
```