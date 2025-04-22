import React, { useEffect, useState } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface Entite {
  id: string;
  code: string;
  libelle: string;
  created_at: string;
  updated_at: string;
}

function Entity() {
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [editingEntity, setEditingEntity] = useState<Entite | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    libelle: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let data, error;

      if (editingEntity) {
        // Mode modification
        ({ data, error } = await supabase
          .from('entite')
          .update(formData)
          .eq('id', editingEntity.id)
          .select()
          .single());
      } else {
        // Mode création
        ({ data, error } = await supabase
          .from('entite')
          .insert([formData])
          .select()
          .single());
      }

      if (error) throw error;

      if (editingEntity) {
        setEntites(prev => prev.map(e => e.id === editingEntity.id ? data : e));
        setEditingEntity(null);
        showToast({
          label: `L'entité "${data.libelle}" a été modifiée avec succès`,
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setEntites(prev => [...prev, data]);
        setShowForm(false);
        showToast({
          label: `L'entité "${data.libelle}" a été créée avec succès`,
          icon: 'Check',
          color: '#10b981'
        });
      }

      setFormData({ code: '', libelle: '' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erreur lors de la ${editingEntity ? 'modification' : 'création'}`;
      
      showToast({
        label: errorMessage,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (entite: Entite) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'entité "${entite.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('entite')
          .delete()
          .eq('id', entite.id);

        if (error) throw error;

        // Rafraîchir la liste des entités
        const { data, error: fetchError } = await supabase
          .from('entite')
          .select('*')
          .order('code', { ascending: true });

        if (fetchError) throw fetchError;
        setEntites(data || []);

        showToast({
          label: `L'entité "${entite.libelle}" a été supprimée avec succès`,
          icon: 'Check',
          color: '#10b981'
        });
      } catch (err) {
        let errorMessage = 'Erreur lors de la suppression';
        
        // Vérifier si c'est une erreur de contrainte de clé étrangère
        if (err instanceof Error && err.message.includes('violates foreign key constraint')) {
          errorMessage = `Impossible de supprimer l'entité "${entite.libelle}" car elle est utilisée par d'autres éléments (comptes bancaires, factures, etc.)`;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        showToast({
          label: errorMessage,
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const handleEdit = (entite: Entite) => {
    setEditingEntity(entite);
    setFormData({
      code: entite.code,
      libelle: entite.libelle
    });
    
    showToast({
      label: `Modification de l'entité "${entite.libelle}"`,
      icon: 'Edit',
      color: theme.colors.primary
    });
    
    window.scrollTo(0, document.body.scrollHeight);
  };

  useEffect(() => {
    async function fetchEntites() {
      try {
        const { data, error } = await supabase
          .from('entite')
          .select('*')
          .order('code', { ascending: true });

        if (error) throw error;
        setEntites(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchEntites();
  }, []);

  return (
    <>
      <PageSection
        title="Liste des entités"
        description="Liste de toutes les entités enregistrées."
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label={showForm ? "Masquer le formulaire" : "Créer une entité"}
            icon={showForm ? "ChevronUp" : "Plus"}
            color={theme.colors.primary}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        {error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Code</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Libellé</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date de création</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Dernière modification</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Chargement des entités...
                </td>
              </tr>
            ) : entites.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Aucune entité trouvée.
                </td>
              </tr>
            ) : entites.map((entite) => (
              <tr key={entite.id}>
                <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEdit(entite)}
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
                      onClick={() => handleDelete(entite)}
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
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>{entite.code}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>{entite.libelle}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {new Date(entite.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {new Date(entite.updated_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        )}
      </PageSection>
      
      {(showForm || editingEntity) && (
        <PageSection
          subtitle={editingEntity ? "Modifier une entité" : "Nouvelle entité"}
          description={editingEntity ? "Modifier les informations de l'entité" : "Créer une nouvelle entité"}
        >
          <Form size={50} onSubmit={handleSubmit}>
            <FormField label="Code" required>
              <FormInput
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                maxLength={12}
                placeholder="CODE123"
              />
            </FormField>
            
            <FormField label="Libellé" required>
              <FormInput
                type="text"
                name="libelle"
                value={formData.libelle}
                onChange={handleInputChange}
                maxLength={30}
                placeholder="Nom de l'entité"
              />
            </FormField>
            
            <FormActions>
              {editingEntity && (
                <Button
                  label="Annuler"
                  type="button"
                  icon="X"
                  color={theme.colors.secondary}
                  onClick={() => {
                    setEditingEntity(null);
                    setFormData({ code: '', libelle: '' });
                  }}
                />
              )}
              <Button
                label={editingEntity ? "Modifier" : "Créer"}
                type="submit"
                icon={editingEntity ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}
    </>
  );
}

export default Entity;