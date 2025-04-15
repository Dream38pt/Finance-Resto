import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface Supplier {
  id: string;
  code: string;
  nom: string;
  commentaire: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    commentaire: '',
    actif: true
  });

  const handleDelete = async (supplier: Supplier) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le tiers "${supplier.nom}" ?`)) {
      try {
        const { error } = await supabase
          .from('fin_tiers')
          .delete()
          .eq('id', supplier.id);

        if (error) throw error;

        setSuppliers(prev => prev.filter(s => s.id !== supplier.id));
        showToast({
          label: 'Tiers supprimé avec succès',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let data, error;

      if (editingSupplier) {
        ({ data, error } = await supabase
          .from('fin_tiers')
          .update(formData)
          .eq('id', editingSupplier.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from('fin_tiers')
          .insert([formData])
          .select()
          .single());
      }

      if (error) throw error;

      if (editingSupplier) {
        setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? data : s));
        setEditingSupplier(null);
        showToast({
          label: 'Tiers modifié avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setSuppliers(prev => [...prev, data]);
        setShowForm(false);
        showToast({
          label: 'Tiers créé avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setFormData({
        code: '',
        nom: '',
        commentaire: '',
        actif: true
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingSupplier ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleToggleActive = async (supplier: Supplier) => {
    try {
      const { error } = await supabase
        .from('fin_tiers')
        .update({ actif: !supplier.actif })
        .eq('id', supplier.id);

      if (error) throw error;

      setSuppliers(prev => prev.map(s => 
        s.id === supplier.id ? { ...s, actif: !s.actif } : s
      ));

      showToast({
        label: `Tiers ${!supplier.actif ? 'activé' : 'désactivé'} avec succès`,
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

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      code: supplier.code,
      nom: supplier.nom,
      commentaire: supplier.commentaire || '',
      actif: supplier.actif
    });
    setShowForm(true);
    window.scrollTo(0, document.body.scrollHeight);
  };

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.nom.localeCompare(b.nom));

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const { data, error } = await supabase
          .from('fin_tiers')
          .select('*')
          .order('nom');

        if (error) throw error;
        setSuppliers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchSuppliers();
  }, []);

  if (loading) {
    return (
      <PageSection
        title="Tiers"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Tiers"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Tiers"
        description="Gestion des tiers (fournisseurs)"
      >
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <FormInput
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom ou code..."
            style={{ width: '300px' }}
          />
          <Button
            label={showForm ? "Masquer le formulaire" : "Créer un tiers"}
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
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Nom</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Commentaire</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Actif</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Aucun tiers trouvé.
                </td>
              </tr>
            ) : filteredSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEdit(supplier)}
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
                      onClick={() => handleDelete(supplier)}
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
                  {supplier.code}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {supplier.nom}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {supplier.commentaire || '-'}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={supplier.actif}
                    onChange={() => handleToggleActive(supplier)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageSection>

      {(showForm || editingSupplier) && (
        <PageSection
          subtitle={editingSupplier ? "Modifier un tiers" : "Nouveau tiers"}
          description={editingSupplier ? "Modifier les informations du tiers" : "Créer un nouveau tiers"}
        >
          <Form size={50} onSubmit={handleSubmit}>
            <FormField label="Code" required>
              <FormInput
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                maxLength={20}
                placeholder="CODE123"
              />
            </FormField>

            <FormField label="Nom" required>
              <FormInput
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                maxLength={100}
                placeholder="Nom du tiers"
              />
            </FormField>

            <FormField label="Commentaire">
              <textarea
                name="commentaire"
                value={formData.commentaire}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '2px solid var(--color-secondary)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </FormField>

            <FormField>
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
            </FormField>

            <FormActions>
              <Button
                label="Annuler"
                type="button"
                icon="X"
                color={theme.colors.secondary}
                onClick={() => {
                  setShowForm(false);
                  setEditingSupplier(null);
                  setFormData({
                    code: '',
                    nom: '',
                    commentaire: '',
                    actif: true
                  });
                }}
              />
              <Button
                label={editingSupplier ? "Modifier" : "Créer"}
                type="submit"
                icon={editingSupplier ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}
    </>
  );
}

export default Suppliers;