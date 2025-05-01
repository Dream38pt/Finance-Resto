import React from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { theme } from '../../theme';
import { useBudgetCF } from '../../hooks/useBudgetCF';
import { BudgetForm } from '../../components/budget/BudgetForm';
import { BudgetTable } from '../../components/budget/BudgetTable';

function BudgetCF() {
  const {
    budgets,
    entites,
    categories,
    selectedEntite,
    setSelectedEntite,
    selectedYear,
    setSelectedYear,
    loading,
    showForm,
    setShowForm,
    error,
    editingBudget,
    setEditingBudget,
    formData,
    setFormData,
    handleDisplayClick,
    handleSubmit,
    handleDelete,
    defaultFormData
  } = useBudgetCF();

  if (loading) {
    return (
      <PageSection
        title="Budget Coût Fixe"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Budget Coût Fixe"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Budget Coût Fixe"
        description="Gestion des coûts fixes budgétés"
      >
        <Form size={50}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
            <FormField label="Restaurant">
              <select
                value={selectedEntite}
                onChange={(e) => setSelectedEntite(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '2px solid var(--color-secondary)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Sélectionner un restaurant</option>
                {entites?.map(entite => (
                  <option key={entite.id} value={entite.id}>
                    {entite.code} - {entite.libelle}
                  </option>
                ))}
              </select>
            </FormField>
            
            <FormField label="Année">
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1900 && value <= 9999) {
                    setSelectedYear(value);
                  }
                }}
                min="1900"
                max="9999"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '2px solid var(--color-secondary)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem'
                }}
              />
            </FormField>
            
            <Button
              label="Afficher"
              color={theme.colors.primary}
              icon="Search"
              onClick={handleDisplayClick}
            />
          </div>
        </Form>

        {selectedEntite && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <Button
                label={showForm ? "Masquer le formulaire" : "Ajouter un coût fixe"}
                icon={showForm ? "ChevronUp" : "Plus"}
                color={theme.colors.primary}
                onClick={() => setShowForm(!showForm)}
              />
            </div>

            <BudgetTable
              budgets={budgets}
              categories={categories}
              onEdit={(budget) => {
                setEditingBudget(budget);
                setFormData({
                  entite_id: selectedEntite, // Utiliser l'entité sélectionnée
                  annee: selectedYear,
                  mois: 1,
                  designation: budget.designation,
                  categorie_achat_id: budget.categorie_achat_id || '',
                  ordre_affichage: budget.ordre_affichage.toString(),
                  montants: budget.montants.map(m => m.toString())
                });
                setShowForm(true);
                window.scrollTo(0, document.body.scrollHeight);
              }}
              onDelete={handleDelete}
            />
          </div>
        )}
      </PageSection>

      {showForm && (
        <PageSection
          subtitle={editingBudget ? "Modifier un coût fixe" : "Nouveau coût fixe"}
          description={editingBudget ? "Modifier les informations du coût fixe" : "Créer un nouveau coût fixe"}
        >
          <BudgetForm
            formData={formData}
            setFormData={setFormData}
            entites={entites}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingBudget(null);
              setFormData(defaultFormData);
            }}
            isEditing={!!editingBudget}
          />
        </PageSection>
      )}
    </>
  );
}

export default BudgetCF;