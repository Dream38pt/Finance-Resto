import React from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { theme } from '../../theme';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';

interface PaymentMethodsProps {}

function PaymentMethods() {
  const {
    paymentMethods,
    loading,
    showForm,
    setShowForm,
    error,
    editingMethod,
    setEditingMethod,
    formData,
    setFormData,
    handleSubmit,
    handleDelete,
    handleToggleActive,
    defaultFormData
  } = usePaymentMethods();

  if (loading) {
    return (
      <PageSection
        title="Modes de paiement"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Modes de paiement"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Modes de paiement"
        description="Gestion des modes de paiement"
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label={showForm ? "Masquer le formulaire" : "Nouveau mode de paiement"}
            icon={showForm ? "ChevronUp" : "Plus"}
            color={theme.colors.primary}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Code</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Libellé</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Ordre</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Actif</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Paiement en espèces</th>
            </tr>
          </thead>
          <tbody>
            {paymentMethods.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Aucun mode de paiement trouvé.
                </td>
              </tr>
            ) : paymentMethods.map((method) => (
              <tr key={method.id}>
                <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => {
                        setEditingMethod(method);
                        setFormData({
                          code: method.code,
                          libelle: method.libelle,
                          ordre_affichage: method.ordre_affichage.toString(),
                          actif: method.actif
                        });
                        setShowForm(true);
                        window.scrollTo(0, document.body.scrollHeight);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        borderRadius: '4px',
                        color: theme.colors.primary,
                        transition: 'all 0.2s'
                      }}
                      title="Modifier"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(method)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        borderRadius: '4px',
                        color: '#ef4444',
                        transition: 'all 0.2s'
                      }}
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {method.code}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {method.libelle}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                  {method.ordre_affichage}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={method.actif}
                    onChange={() => handleToggleActive(method)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={method.paiement_par_espece}
                    onChange={() => handleToggleCashPayment(method)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageSection>

      {showForm && (
        <PageSection
          subtitle={editingMethod ? "Modifier un mode de paiement" : "Nouveau mode de paiement"}
          description={editingMethod ? "Modifier les informations du mode de paiement" : "Créer un nouveau mode de paiement"}
        >
          <Form size={50} onSubmit={handleSubmit}>
            <FormField label="Code" required>
              <FormInput
                type="text"
                name="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                maxLength={20}
                placeholder="CAISSE"
              />
            </FormField>

            <FormField label="Libellé" required>
              <FormInput
                type="text"
                name="libelle"
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                maxLength={50}
                placeholder="Paiement en caisse"
              />
            </FormField>

            <FormField label="Ordre d'affichage" required>
              <FormInput
                type="number"
                name="ordre_affichage"
                value={formData.ordre_affichage}
                onChange={(e) => setFormData({ ...formData, ordre_affichage: e.target.value })}
                min="0"
              />
            </FormField>

            <FormField>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="actif"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <label>Actif</label>
              </div>
            </FormField>

            <FormField>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="paiement_par_espece"
                  checked={formData.paiement_par_espece}
                  onChange={(e) => setFormData({ ...formData, paiement_par_espece: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <label>Paiement en espèces</label>
              </div>
            </FormField>

            <FormActions>
              <Button
                label="Annuler"
                type="button"
                icon="X"
                color={theme.colors.secondary}
                onClick={() => {
                  setShowForm(false);
                  setEditingMethod(null);
                  setFormData(defaultFormData);
                }}
              />
              <Button
                label={editingMethod ? "Modifier" : "Créer"}
                type="submit"
                icon={editingMethod ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}
    </>
  );
}

export default PaymentMethods;