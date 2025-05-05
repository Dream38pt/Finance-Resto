import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2, Check, X, Filter } from 'lucide-react';
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
  fait_partie_cout_mp: boolean;
  depenses_hors_cf: boolean;
  depenses_cf: boolean;
}

function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    commentaire: '',
    actif: true,
    fait_partie_cout_mp: false,
    depenses_hors_cf: false,
    depenses_cf: false
  });

  const checkForAssociatedInvoices = async (supplierId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('fin_facture_achat')
      .select('id')
      .eq('tiers_id', supplierId)
      .limit(1);

    if (error) {
      throw error;
    }

    return data && data.length > 0;
  };

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
        // Vérifier si c'est une erreur de contrainte de clé étrangère (code 23503)
        if (err instanceof Error) {
          const errorObj = JSON.parse(err.message);
          if (errorObj && errorObj.code === '23503') {
            showToast({
              label: 'La suppression n\'est pas possible à cause de la présence de facture',
              icon: 'AlertTriangle',
              color: '#ef4444'
            });
            return;
          }
        }
        
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
        actif: true,
        fait_partie_cout_mp: false,
        depenses_hors_cf: false,
        depenses_cf: false
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

  const handleToggleField = async (supplier: Supplier, field: 'fait_partie_cout_mp' | 'depenses_hors_cf' | 'depenses_cf') => {
    try {
      const { error } = await supabase
        .from('fin_tiers')
        .update({ [field]: !supplier[field] })
        .eq('id', supplier.id);

      if (error) throw error;

      setSuppliers(prev => prev.map(s => 
        s.id === supplier.id ? { ...s, [field]: !supplier[field] } : s
      ));

      showToast({
        label: `Paramètre modifié avec succès`,
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
      actif: supplier.actif,
      fait_partie_cout_mp: supplier.fait_partie_cout_mp,
      depenses_hors_cf: supplier.depenses_hors_cf,
      depenses_cf: supplier.depenses_cf
    });
    setShowForm(true);
    window.scrollTo(0, document.body.scrollHeight);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    // Filtre par texte (nom ou code)
    const textMatch = supplier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      supplier.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre par type
    let typeMatch = true;
    if (typeFilter === 'cout_mp') {
      typeMatch = supplier.fait_partie_cout_mp;
    } else if (typeFilter === 'hors_cf') {
      typeMatch = supplier.depenses_hors_cf;
    } else if (typeFilter === 'charges_fixes') {
      typeMatch = supplier.depenses_cf;
    }
    
    return textMatch && typeMatch;
  }).sort((a, b) => a.nom.localeCompare(b.nom));

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
          
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                paddingLeft: '2.5rem',
                border: '2px solid var(--color-secondary)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--color-white)',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                appearance: 'none'
              }}
            >
              <option value="">Choisir un Type</option>
              <option value="cout_mp">Fait partie des coûts matières premières</option>
              <option value="hors_cf">Dépenses hors charges fixes</option>
              <option value="charges_fixes">Dépenses charges fixes</option>
            </select>
            <div style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}>
              <Filter size={16} color={theme.colors.primary} />
            </div>
          </div>
          
          <Button
            label={showForm ? "Masquer le formulaire" : "Créer un tiers"}
            icon={showForm ? "ChevronUp" : "Plus"}
            color={theme.colors.primary}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
          {typeFilter && (
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.25rem 0.75rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: theme.colors.primary
            }}>
              <span>
                {typeFilter === 'cout_mp' && 'Filtre: Coûts matières premières'}
                {typeFilter === 'hors_cf' && 'Filtre: Dépenses hors charges fixes'}
                {typeFilter === 'charges_fixes' && 'Filtre: Dépenses charges fixes'}
              </span>
              <button
                onClick={() => setTypeFilter('')}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--color-text-light)',
            marginTop: typeFilter ? '0.5rem' : '0'
          }}>
            {filteredSuppliers.length} tiers trouvés
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Code</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Nom</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Commentaire</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Coût MP</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Hors CF</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Charges Fixes</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Actif</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
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
                  <button
                    onClick={() => handleToggleField(supplier, 'fait_partie_cout_mp')}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      color: supplier.fait_partie_cout_mp ? '#10b981' : '#9ca3af',
                      transition: 'all 0.2s'
                    }}
                    title={supplier.fait_partie_cout_mp ? "Fait partie des coûts matières premières" : "Ne fait pas partie des coûts matières premières"}
                  >
                    {supplier.fait_partie_cout_mp ? <Check size={18} /> : <X size={18} />}
                  </button>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                  <button
                    onClick={() => handleToggleField(supplier, 'depenses_hors_cf')}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      color: supplier.depenses_hors_cf ? '#10b981' : '#9ca3af',
                      transition: 'all 0.2s'
                    }}
                    title={supplier.depenses_hors_cf ? "Dépenses hors charges fixes" : "Ne fait pas partie des dépenses hors charges fixes"}
                  >
                    {supplier.depenses_hors_cf ? <Check size={18} /> : <X size={18} />}
                  </button>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                  <button
                    onClick={() => handleToggleField(supplier, 'depenses_cf')}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      color: supplier.depenses_cf ? '#10b981' : '#9ca3af',
                      transition: 'all 0.2s'
                    }}
                    title={supplier.depenses_cf ? "Fait partie des charges fixes" : "Ne fait pas partie des charges fixes"}
                  >
                    {supplier.depenses_cf ? <Check size={18} /> : <X size={18} />}
                  </button>
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

            <FormField>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    name="fait_partie_cout_mp"
                    checked={formData.fait_partie_cout_mp}
                    onChange={(e) => setFormData({ ...formData, fait_partie_cout_mp: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  <label>Fait partie des coûts matières premières</label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    name="depenses_hors_cf"
                    checked={formData.depenses_hors_cf}
                    onChange={(e) => setFormData({ ...formData, depenses_hors_cf: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  <label>Dépenses hors charges fixes</label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    name="depenses_cf"
                    checked={formData.depenses_cf}
                    onChange={(e) => setFormData({ ...formData, depenses_cf: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  <label>Dépenses charges fixes</label>
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
                  setEditingSupplier(null);
                  setFormData({
                    code: '',
                    nom: '',
                    commentaire: '',
                    actif: true,
                    fait_partie_cout_mp: false,
                    depenses_hors_cf: false,
                    depenses_cf: false
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