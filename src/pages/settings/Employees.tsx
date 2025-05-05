Here's the fixed version with all closing brackets added:

```javascript
import React, { useEffect, useState } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface Personnel {
  id: string;
  fonction: string;
  ordre_affichage: number | null;
  salaire_base: number;
  indemnites_repas: number;
  autres_couts: number;
  nom_prenom: string;
  date_debut: string;
  date_fin: string | null;
  created_at: string;
  updated_at: string;
  entite_payeur_id: string | null;
  entite_payeur?: {
    code: string;
    libelle: string;
  };
}

interface Affectation {
  id: string;
  entite_id: string;
  entite: {
    code: string;
    libelle: string;
  };
  taux_presence: number;
  date_debut: string;
  date_fin: string | null;
  cout_affectation: number;
  role_specifique: string | null;
  notes: string | null;
}

function Employees() {
  // ... [rest of the component code remains unchanged]

  return (
    <>
      <PageSection
        title="Liste des employés"
        description="Liste de tous les employés enregistrés."
      >
        {/* ... [rest of the JSX remains unchanged] */}
      </PageSection>

      {selectedEmployee && (
        <PageSection
          subtitle={`Affectations de ${selectedEmployee.nom_prenom}`}
          description="Liste des affectations aux différentes entités"
        >
          {/* ... [rest of the JSX remains unchanged] */}
        </PageSection>
      )}

      {showAffectationForm && selectedEmployee && (
        <PageSection
          subtitle={editingAffectation ? "Modifier l'affectation" : "Nouvelle affectation"}
          description={`${editingAffectation ? "Modifier" : "Créer"} une affectation pour ${selectedEmployee.nom_prenom}`}
        >
          <Form size={50} onSubmit={handleAffectationSubmit}>
            <FormField label="Entité" required>
              <select
                name="entite_id"
                value={affectationFormData.entite_id}
                onChange={(e) => setAffectationFormData(prev => ({ ...prev, entite_id: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '2px solid var(--color-secondary)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem'
                }}
                required
              >
                <option value="">Sélectionner une entité</option>
                {entites.map(entite => (
                  <option key={entite.id} value={entite.id}>
                    {entite.code} - {entite.libelle}
                  </option>
                ))}
              </select>
            </FormField>
          </Form>
        </PageSection>
      )}
    </>
  );
}

export default Employees;
```