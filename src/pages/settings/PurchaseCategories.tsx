import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface PurchaseCategory {
  id: string;
  libelle: string;
  fait_partie_cout_mp: boolean;
  ordre_affichage: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

function PurchaseCategories() {
  const [categories, setCategories] = useState<PurchaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [editingCategory, setEditingCategory] = useState<PurchaseCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    libelle: '',
    fait_partie_cout_mp: false,
    ordre_affichage: 0,
    actif: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let data, error;

      if (editingCategory) {
        ({ data, error } = await supabase
          .from('fin_categorie_achat')
          .update(formData)
          .eq('id', editingCategory.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from('fin_categorie_achat')
          .insert([formData])
          .select()
          .single());
      }

      if (error) throw error;

      if (editingCategory) {
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? data : c));
        setEditingCategory(null);
        showToast({
          label: 'Catégorie modifiée avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setCategories(prev => [...prev, data]);
        setShowForm(false);
        showToast({
          label: 'Catégorie créée avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setFormData({
        libelle: '',
        fait_partie_cout_mp: false,
        ordre_affichage: 0,
        actif: true
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingCategory ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (category: PurchaseCategory) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('fin_categorie_achat')
          .delete()
          .eq('id', category.id);

        if (error) throw error;

        setCategories(prev => prev.filter(c => c.id !== category.id));
        showToast({
          label: 'Catégorie supprimée avec succès',
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

  const handleToggleActive = async (category: PurchaseCategory) => {
    try {
      const { error } = await supabase
        .from('fin_categorie_achat')
        .update({ actif: !category.actif })
        .eq('id', category.id);

      if (error) throw error;

      setCategories(prev => prev.map(c => 
        c.id === category.id ? { ...c, actif: !c.actif } : c
      ));

      showToast({
        label: `Catégorie ${!category.actif ? 'activée' : 'désactivée'} avec succès`,
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

  const handleEdit = (category: PurchaseCategory) => {
    setEditingCategory(category);
    setFormData({
      libelle: category.libelle,
      fait_partie_cout_mp: category.fait_partie_cout_mp,
      ordre_affichage: category.ordre_affichage,
      actif: category.actif
    });
    setShowForm(true);
    window.scrollTo(0, document.body.scrollHeight);
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('fin_categorie_achat')
          .select('*')
          .order('ordre_affichage')
          .order('libelle');

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(category =>
    category.libelle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <PageSection
        title="Catégories de dépenses"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Catégories de dépenses"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Catégories de dépenses"
        description="Gestion des catégories de dépenses"
      >
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <FormInput
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par libellé..."
            style={{ width: '300px' }}
          />
          <Button
            label={showForm ? "Masquer le formulaire" : "Créer une catégorie"}
            icon={showForm ? "ChevronUp" : "Plus"}
            color={theme.colors.primary}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Libellé</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Coût MP</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Ordre</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Actif</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Aucune catégorie trouvée.
                </td>
              </tr>
            ) : filteredCategories.map((category) => (
              <tr key={category.id}>
                <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEdit(category)}
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
                      onClick={() => handleDelete(category)}
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
                  {category.libelle}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={category.fait_partie_cout_mp}
                    onChange={() => handleEdit(category)}
                    style={{ cursor: 'pointer' }}
                    disabled
                  />
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                  {category.ordre_affichage}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={category.actif}
                    onChange={() => handleToggleActive(category)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageSection>

      {(showForm || editingCategory) && (
        <PageSection
          subtitle={editingCategory ? "Modifier une catégorie" : "Nouvelle catégorie"}
          description={editingCategory ? "Modifier les informations de la catégorie" : "Créer une nouvelle catégorie"}
        >
          <Form size={50} onSubmit={handleSubmit}>
            <FormField label="Libellé" required>
              <FormInput
                type="text"
                name="libelle"
                value={formData.libelle}
                onChange={handleInputChange}
                maxLength={50}
                placeholder="Nom de la catégorie"
              />
            </FormField>

            <FormField label="Ordre d'affichage" required>
              <FormInput
                type="number"
                name="ordre_affichage"
                value={formData.ordre_affichage}
                onChange={handleInputChange}
                min="0"
              />
            </FormField>

            <FormField>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    name="fait_partie_cout_mp"
                    checked={formData.fait_partie_cout_mp}
                    onChange={handleInputChange}
                    style={{ cursor: 'pointer' }}
                  />
                  <label>Fait partie du coût matière première</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    name="actif"
                    checked={formData.actif}
                    onChange={handleInputChange}
                    style={{ cursor: 'pointer' }}
                  />
                  <label>Actif</label>
                </div>
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
                  setEditingCategory(null);
                  setFormData({
                    libelle: '',
                    fait_partie_cout_mp: false,
                    ordre_affichage: 0,
                    actif: true
                  });
                }}
              />
              <Button
                label={editingCategory ? "Modifier" : "Créer"}
                type="submit"
                icon={editingCategory ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}
    </>
  );
}

export default PurchaseCategories;