import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface CompteBancaire {
  id: string;
  code: string;
  nom: string;
  id_entite: string;
  entite?: {
    code: string;
    libelle: string;
  };
  banque: string;
  iban: string;
  bic: string | null;
  est_actif: boolean;
  commentaire: string | null;
  date_creation: string;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

function BankAccounts() {
  const [comptes, setComptes] = useState<CompteBancaire[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [editingCompte, setEditingCompte] = useState<CompteBancaire | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    id_entite: '',
    banque: '',
    iban: '',
    bic: '',
    est_actif: true,
    commentaire: ''
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
      let data, error;

      if (editingCompte) {
        ({ data, error } = await supabase
          .from('fin_compte_bancaire')
          .update(formData)
          .eq('id', editingCompte.id)
          .select(`
            *,
            entite:id_entite (
              code,
              libelle
            )
          `)
          .single());
      } else {
        ({ data, error } = await supabase
          .from('fin_compte_bancaire')
          .insert([formData])
          .select(`
            *,
            entite:id_entite (
              code,
              libelle
            )
          `)
          .single());
      }

      if (error) throw error;

      if (editingCompte) {
        setComptes(prev => prev.map(c => c.id === editingCompte.id ? data : c));
        setEditingCompte(null);
        showToast({
          label: 'Compte bancaire modifié avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setComptes(prev => [...prev, data]);
        setShowForm(false);
        showToast({
          label: 'Compte bancaire créé avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setFormData({
        code: '',
        nom: '',
        id_entite: '',
        banque: '',
        iban: '',
        bic: '',
        est_actif: true,
        commentaire: ''
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingCompte ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (compte: CompteBancaire) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le compte "${compte.nom}" ?`)) {
      try {
        const { error } = await supabase
          .from('fin_compte_bancaire')
          .delete()
          .eq('id', compte.id);

        if (error) throw error;

        setComptes(prev => prev.filter(c => c.id !== compte.id));
        showToast({
          label: 'Compte bancaire supprimé avec succès',
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

  const handleToggleActive = async (compte: CompteBancaire) => {
    try {
      const { error } = await supabase
        .from('fin_compte_bancaire')
        .update({ est_actif: !compte.est_actif })
        .eq('id', compte.id);

      if (error) throw error;

      setComptes(prev => prev.map(c => 
        c.id === compte.id ? { ...c, est_actif: !c.est_actif } : c
      ));

      showToast({
        label: `Compte bancaire ${!compte.est_actif ? 'activé' : 'désactivé'} avec succès`,
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

  const handleEdit = (compte: CompteBancaire) => {
    setEditingCompte(compte);
    setFormData({
      code: compte.code,
      nom: compte.nom,
      id_entite: compte.id_entite,
      banque: compte.banque,
      iban: compte.iban,
      bic: compte.bic || '',
      est_actif: compte.est_actif,
      commentaire: compte.commentaire || ''
    });
    setShowForm(true);
    window.scrollTo(0, document.body.scrollHeight);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Charger les entités
        const { data: entitesData, error: entitesError } = await supabase
          .from('entite')
          .select('id, code, libelle')
          .order('code');

        if (entitesError) throw entitesError;
        setEntites(entitesData || []);

        // Charger les comptes bancaires
        const { data: comptesData, error: comptesError } = await supabase
          .from('fin_compte_bancaire')
          .select(`
            *,
            entite:id_entite (
              code,
              libelle
            )
          `)
          .order('code');

        if (comptesError) throw comptesError;
        setComptes(comptesData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <PageSection
        title="Comptes bancaires"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Comptes bancaires"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Comptes bancaires"
        description="Gestion des comptes bancaires des restaurants"
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label={showForm ? "Masquer le formulaire" : "Créer un compte"}
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
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Restaurant</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Banque</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>IBAN</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>BIC</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Actif</th>
            </tr>
          </thead>
          <tbody>
            {comptes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Aucun compte bancaire trouvé.
                </td>
              </tr>
            ) : comptes.map((compte) => (
              <tr key={compte.id}>
                <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEdit(compte)}
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
                      onClick={() => handleDelete(compte)}
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
                  {compte.code}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {compte.nom}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {compte.entite && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building size={16} style={{ color: theme.colors.primary }} />
                      <span>{compte.entite.code}</span>
                      <span style={{ color: 'var(--color-text-light)', fontSize: '0.75rem' }}>
                        ({compte.entite.libelle})
                      </span>
                    </div>
                  )}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {compte.banque}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                  {compte.iban}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {compte.bic || '-'}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={compte.est_actif}
                    onChange={() => handleToggleActive(compte)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageSection>

      {(showForm || editingCompte) && (
        <PageSection
          subtitle={editingCompte ? "Modifier un compte bancaire" : "Nouveau compte bancaire"}
          description={editingCompte ? "Modifier les informations du compte" : "Créer un nouveau compte bancaire"}
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

            <FormField label="Nom" required>
              <FormInput
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                maxLength={30}
                placeholder="Compte principal"
              />
            </FormField>

            <FormField label="Restaurant" required>
              <select
                name="id_entite"
                value={formData.id_entite}
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
                <option value="">Sélectionner un restaurant</option>
                {entites.map(entite => (
                  <option key={entite.id} value={entite.id}>
                    {entite.code} - {entite.libelle}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Banque" required>
              <FormInput
                type="text"
                name="banque"
                value={formData.banque}
                onChange={handleInputChange}
                maxLength={30}
                placeholder="Nom de la banque"
              />
            </FormField>

            <FormField label="IBAN" required>
              <FormInput
                type="text"
                name="iban"
                value={formData.iban}
                onChange={handleInputChange}
                maxLength={30}
                placeholder="FR76..."
              />
            </FormField>

            <FormField label="BIC">
              <FormInput
                type="text"
                name="bic"
                value={formData.bic}
                onChange={handleInputChange}
                maxLength={11}
                placeholder="BNPAFRPP..."
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
                  setEditingCompte(null);
                  setFormData({
                    code: '',
                    nom: '',
                    id_entite: '',
                    banque: '',
                    iban: '',
                    bic: '',
                    est_actif: true,
                    commentaire: ''
                  });
                }}
              />
              <Button
                label={editingCompte ? "Modifier" : "Créer"}
                type="submit"
                icon={editingCompte ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}
    </>
  );
}

export default BankAccounts;