import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface ImportFormat {
  id: string;
  code: string;
  nom_affichage: string;
  type_fichier: string;
  separateur: string | null;
  sauter_lignes: number | null;
  parsing_function: string | null;
  commentaires: string | null;
  actif: boolean;
  created_at: string;
}

function ImportFormats() {
  const [formats, setFormats] = useState<ImportFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [editingFormat, setEditingFormat] = useState<ImportFormat | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nom_affichage: '',
    type_fichier: 'csv',
    separateur: '',
    sauter_lignes: '0',
    parsing_function: '',
    commentaires: '',
    actif: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formatData = {
        ...formData,
        sauter_lignes: parseInt(formData.sauter_lignes),
        separateur: formData.separateur || null,
        parsing_function: formData.parsing_function || null,
        commentaires: formData.commentaires || null
      };

      let data, error;

      if (editingFormat) {
        ({ data, error } = await supabase
          .from('fin_bq_format_import')
          .update(formatData)
          .eq('id', editingFormat.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from('fin_bq_format_import')
          .insert([formatData])
          .select()
          .single());
      }

      if (error) throw error;

      if (editingFormat) {
        setFormats(prev => prev.map(f => f.id === editingFormat.id ? data : f));
        setEditingFormat(null);
        showToast({
          label: 'Format d\'importation modifié avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setFormats(prev => [...prev, data]);
        setShowForm(false);
        showToast({
          label: 'Format d\'importation créé avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setFormData({
        code: '',
        nom_affichage: '',
        type_fichier: 'csv',
        separateur: '',
        sauter_lignes: '0',
        parsing_function: '',
        commentaires: '',
        actif: true
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingFormat ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (format: ImportFormat) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le format "${format.nom_affichage}" ?`)) {
      try {
        const { error } = await supabase
          .from('fin_bq_format_import')
          .delete()
          .eq('id', format.id);

        if (error) throw error;

        setFormats(prev => prev.filter(f => f.id !== format.id));
        showToast({
          label: 'Format d\'importation supprimé avec succès',
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

  const handleToggleActive = async (format: ImportFormat) => {
    try {
      const { error } = await supabase
        .from('fin_bq_format_import')
        .update({ actif: !format.actif })
        .eq('id', format.id);

      if (error) throw error;

      setFormats(prev => prev.map(f => 
        f.id === format.id ? { ...f, actif: !f.actif } : f
      ));

      showToast({
        label: `Format d'importation ${!format.actif ? 'activé' : 'désactivé'} avec succès`,
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

  const handleEdit = (format: ImportFormat) => {
    setEditingFormat(format);
    setFormData({
      code: format.code,
      nom_affichage: format.nom_affichage,
      type_fichier: format.type_fichier,
      separateur: format.separateur || '',
      sauter_lignes: format.sauter_lignes?.toString() || '0',
      parsing_function: format.parsing_function || '',
      commentaires: format.commentaires || '',
      actif: format.actif
    });
    setShowForm(true);
    window.scrollTo(0, document.body.scrollHeight);
  };

  useEffect(() => {
    async function fetchFormats() {
      try {
        const { data, error } = await supabase
          .from('fin_bq_format_import')
          .select('*')
          .order('nom_affichage');

        if (error) throw error;
        setFormats(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchFormats();
  }, []);

  if (loading) {
    return (
      <PageSection
        title="Formats d'importation"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Formats d'importation"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Formats d'importation"
        description="Gestion des formats d'importation des relevés bancaires"
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label={showForm ? "Masquer le formulaire" : "Créer un format"}
            icon={showForm ? "ChevronUp" : "Plus"}
            color={theme.colors.primary}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Code</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Nom d'affichage</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Type de fichier</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Séparateur</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Lignes à ignorer</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Fonction de parsing</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Commentaires</th>
                <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Actif</th>
              </tr>
            </thead>
            <tbody>
              {formats.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                    Aucun format d'importation trouvé.
                  </td>
                </tr>
              ) : formats.map((format) => (
                <tr key={format.id}>
                  <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEdit(format)}
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
                        onClick={() => handleDelete(format)}
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
                    {format.code}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {format.nom_affichage}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {format.type_fichier.toUpperCase()}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {format.separateur || '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {format.sauter_lignes || '0'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {format.parsing_function || '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {format.commentaires || '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={format.actif}
                      onChange={() => handleToggleActive(format)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>

      {(showForm || editingFormat) && (
        <PageSection
          subtitle={editingFormat ? "Modifier un format d'importation" : "Nouveau format d'importation"}
          description={editingFormat ? "Modifier les informations du format" : "Créer un nouveau format d'importation"}
        >
          <Form size={50} onSubmit={handleSubmit}>
            <FormField label="Code" required>
              <FormInput
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="bcp"
                required
              />
            </FormField>

            <FormField label="Nom d'affichage" required>
              <FormInput
                type="text"
                name="nom_affichage"
                value={formData.nom_affichage}
                onChange={handleInputChange}
                placeholder="Banco BCP (CSV)"
                required
              />
            </FormField>

            <FormField label="Type de fichier" required>
              <select
                name="type_fichier"
                value={formData.type_fichier}
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
                <option value="csv">CSV</option>
                <option value="xls">XLS</option>
                <option value="xlsx">XLSX</option>
              </select>
            </FormField>

            <FormField label="Séparateur" description="Laissez vide pour les fichiers Excel">
              <FormInput
                type="text"
                name="separateur"
                value={formData.separateur}
                onChange={handleInputChange}
                placeholder=";"
                maxLength={10}
              />
            </FormField>

            <FormField label="Lignes à ignorer">
              <FormInput
                type="number"
                name="sauter_lignes"
                value={formData.sauter_lignes}
                onChange={handleInputChange}
                min="0"
                placeholder="0"
              />
            </FormField>

            <FormField label="Fonction de parsing" description="Nom de la fonction JavaScript à utiliser pour le parsing">
              <FormInput
                type="text"
                name="parsing_function"
                value={formData.parsing_function}
                onChange={handleInputChange}
                placeholder="parseBCP"
              />
            </FormField>

            <FormField label="Commentaires" description="Informations supplémentaires sur ce format">
              <FormInput
                type="text"
                name="commentaires"
                value={formData.commentaires}
                onChange={handleInputChange}
                placeholder="Commentaires (40 caractères max)"
                maxLength={40}
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
                  setEditingFormat(null);
                  setFormData({
                    code: '',
                    nom_affichage: '',
                    type_fichier: 'csv',
                    separateur: '',
                    sauter_lignes: '0',
                    parsing_function: '',
                    commentaires: '',
                    actif: true
                  });
                }}
              />
              <Button
                label={editingFormat ? "Modifier" : "Créer"}
                type="submit"
                icon={editingFormat ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}
    </>
  );
}

export default ImportFormats;