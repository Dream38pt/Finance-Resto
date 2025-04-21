import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface TypeMouvementBancaire {
  id: string;
  code: string;
  libelle: string;
  sens: 'credit' | 'debit' | 'aucun';
  ordre_affichage: number | null;
  est_actif: boolean;
  created_at: string;
  updated_at: string;
}

function BankMovementTypes() {
  const [types, setTypes] = useState<TypeMouvementBancaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [editingType, setEditingType] = useState<TypeMouvementBancaire | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    sens: 'credit' as 'credit' | 'debit' | 'aucun',
    ordre_affichage: '',
    est_actif: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const typeData = {
        ...formData,
        ordre_affichage: formData.ordre_affichage ? parseInt(formData.ordre_affichage) : null
      };

      let data, error;

      if (editingType) {
        ({ data, error } = await supabase
          .from('fin_type_mouvement_bancaire')
          .update(typeData)
          .eq('id', editingType.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from('fin_type_mouvement_bancaire')
          .insert([typeData])
          .select()
          .single());
      }

      if (error) throw error;

      if (editingType) {
        setTypes(prev => prev.map(t => t.id === editingType.id ? data : t));
        setEditingType(null);
        showToast({
          label: 'Type de mouvement modifié avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setTypes(prev => [...prev, data]);
        setShowForm(false);
        showToast({
          label: 'Type de mouvement créé avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setFormData({
        code: '',
        libelle: '',
        sens: 'credit',
        ordre_affichage: '',
        est_actif: true
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingType ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (type: TypeMouvementBancaire) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le type de mouvement "${type.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('fin_type_mouvement_bancaire')
          .delete()
          .eq('id', type.id);

        if (error) throw error;

        setTypes(prev => prev.filter(t => t.id !== type.id));
        showToast({
          label: 'Type de mouvement supprimé avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } catch (err) {
        showToast({
          label: err instanceof Error ? err.message : 'Erreur lors de la suppression',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const handleToggleActive = async (type: TypeMouvementBancaire) => {
    try {
      const { error } = await supabase
        .from('fin_type_mouvement_bancaire')
        .update({ est_actif: !type.est_actif })
        .eq('id', type.id);

      if (error) throw error;

      setTypes(prev => prev.map(t => 
        t.id === type.id ? { ...t, est_actif: !t.est_actif } : t
      ));

      showToast({
        label: `Type de mouvement ${!type.est_actif ? 'activé' : 'désactivé'} avec succès`,
        icon: 'Check',
        color: '#10b981'
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors de la modification',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleEdit = (type: TypeMouvementBancaire) => {
    setEditingType(type);
    setFormData({
      code: type.code,
      libelle: type.libelle,
      sens: type.sens,
      ordre_affichage: type.ordre_affichage?.toString() || '',
      est_actif: type.est_actif
    });
    setShowForm(true);
    window.scrollTo(0, document.body.scrollHeight);
  };

  useEffect(() => {
    async function fetchTypes() {
      try {
        const { data, error } = await supabase
          .from('fin_type_mouvement_bancaire')
          .select('*')
          .order('ordre_affichage', { ascending: true, nullsLast: true })
          .order('code');

        if (error) throw error;
        setTypes(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchTypes();
  }, []);

  if (loading) {
    return (
      <PageSection
        title="Types de mouvement bancaire"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Types de mouvement bancaire"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Types de mouvement bancaire"
        description="Gestion des types de mouvements bancaires"
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label={showForm ? "Masquer le formulaire" : "Créer un type"}
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
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Sens</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Ordre</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Actif</th>
            </tr>
          </thead>
          <tbody>
            {types.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Aucun type de mouvement trouvé.
                </td>
              </tr>
            ) : types.map((type) => (
              <tr key={type.id}>
                <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEdit(type)}
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
                      onClick={() => handleDelete(type)}
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
                  {type.code}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {type.libelle}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {type.sens === 'credit' ? 'Crédit' : type.sens === 'debit' ? 'Débit' : 'Aucun'}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                  {type.ordre_affichage || '-'}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={type.est_actif}
                    onChange={() => handleToggleActive(type)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageSection>

      {(showForm || editingType) && (
        <PageSection
          subtitle={editingType ? "Modifier un type de mouvement" : "Nouveau type de mouvement"}
          description={editingType ? "Modifier les informations du type" : "Créer un nouveau type de mouvement"}
        >
          <Form size={50} onSubmit={handleSubmit}>
            <FormField label="Code" required>
              <FormInput
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                maxLength={20}
                placeholder="VIREMENT"
              />
            </FormField>

            <FormField label="Libellé" required>
              <FormInput
                type="text"
                name="libelle"
                value={formData.libelle}
                onChange={handleInputChange}
                maxLength={50}
                placeholder="Virement bancaire"
              />
            </FormField>

            <FormField label="Sens" required>
              <select
                name="sens"
                value={formData.sens}
                onChange={handleInputChange}
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
                <option value="credit">Crédit</option>
                <option value="debit">Débit</option>
                <option value="aucun">Aucun</option>
              </select>
            </FormField>

            <FormField label="Ordre d'affichage">
              <FormInput
                type="number"
                name="ordre_affichage"
                value={formData.ordre_affichage}
                onChange={handleInputChange}
                min="0"
              />
            </FormField>

            <FormField>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="est_actif"
                  checked={formData.est_actif}
                  onChange={handleInputChange}
                  style={{ cursor: 'pointer' }}
                />
                <label>Actif</label>
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
                  setEditingType(null);
                  setFormData({
                    code: '',
                    libelle: '',
                    sens: 'credit',
                    ordre_affichage: '',
                    est_actif: true
                  });
                }}
              />
              <Button
                label={editingType ? "Modifier" : "Créer"}
                type="submit"
                icon={editingType ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}
    </>
  );
}

export default BankMovementTypes;