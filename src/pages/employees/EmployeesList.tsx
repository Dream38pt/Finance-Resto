import React, { useState, useEffect } from 'react';
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

function EmployeesList() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Personnel | null>(null);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAffectation, setEditingAffectation] = useState<Affectation | null>(null);
  const [entites, setEntites] = useState<{ id: string; code: string; libelle: string; }[]>([]);
  const [showAffectationForm, setShowAffectationForm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [editingEmployee, setEditingEmployee] = useState<Personnel | null>(null);
  const [affectationFormData, setAffectationFormData] = useState({
    entite_id: '',
    taux_presence: '100',
    date_debut: '',
    date_fin: '',
    cout_affectation: '0',
    role_specifique: '',
    notes: ''
  });
  const [formData, setFormData] = useState({
    fonction: '',
    salaire_base: '',
    ordre_affichage: '',
    indemnites_repas: '0',
    autres_couts: '0',
    nom_prenom: '',
    date_debut: '',
    date_fin: '',
    entite_payeur_id: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAffectationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAffectationFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAffectationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      const affectationData = {
        personnel_id: selectedEmployee.id,
        ...affectationFormData,
        taux_presence: parseFloat(affectationFormData.taux_presence) / 100,
        cout_affectation: parseFloat(affectationFormData.cout_affectation),
        date_fin: affectationFormData.date_fin || null,
        role_specifique: affectationFormData.role_specifique || null,
        notes: affectationFormData.notes || null
      };

      let data, error;

      if (editingAffectation) {
        // Mode modification
        ({ data, error } = await supabase
          .from('affectation_personnel_entite')
          .update(affectationData)
          .eq('id', editingAffectation.id)
          .select(`
            id,
            entite_id,
            entite:entite_id (
              code,
              libelle
            ),
            taux_presence,
            date_debut,
            date_fin,
            cout_affectation,
            role_specifique,
            notes
          `)
          .single());
      } else {
        // Mode création
        ({ data, error } = await supabase
          .from('affectation_personnel_entite')
          .insert([affectationData])
          .select(`
          id,
          entite_id,
          entite:entite_id (
            code,
            libelle
          ),
          taux_presence,
          date_debut,
          date_fin,
          cout_affectation,
          role_specifique,
          notes
          `)
          .single());
      }

      if (error) throw error;

      if (editingAffectation) {
        setAffectations(prev => prev.map(a => a.id === editingAffectation.id ? data : a));
        setEditingAffectation(null);
        showToast({
          label: 'Affectation modifiée avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setAffectations(prev => [data, ...prev]);
        showToast({
          label: 'Affectation créée avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setShowAffectationForm(false);
      setAffectationFormData({
        entite_id: '',
        taux_presence: '100',
        date_debut: '',
        date_fin: '',
        cout_affectation: '0',
        role_specifique: '',
        notes: ''
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingAffectation ? 'modification' : 'création'} de l'affectation`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDeleteAffectation = async (affectation: Affectation) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) {
      try {
        const { error } = await supabase
          .from('affectation_personnel_entite')
          .delete()
          .eq('id', affectation.id);

        if (error) throw error;

        setAffectations(prev => prev.filter(a => a.id !== affectation.id));
        showToast({
          label: 'Affectation supprimée avec succès',
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

  const handleEditAffectation = (affectation: Affectation) => {
    setEditingAffectation(affectation);
    setShowAffectationForm(true);
    setAffectationFormData({
      entite_id: affectation.entite_id,
      taux_presence: (affectation.taux_presence * 100).toString(),
      date_debut: affectation.date_debut,
      date_fin: affectation.date_fin || '',
      cout_affectation: affectation.cout_affectation.toString(),
      role_specifique: affectation.role_specifique || '',
      notes: affectation.notes || ''
    });
    window.scrollTo(0, document.body.scrollHeight);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const employeeData = {
        ...formData,
        salaire_base: parseFloat(formData.salaire_base),
        ordre_affichage: formData.ordre_affichage ? parseInt(formData.ordre_affichage) : null,
        indemnites_repas: parseFloat(formData.indemnites_repas),
        autres_couts: parseFloat(formData.autres_couts),
        date_fin: formData.date_fin || null,
        entite_payeur_id: formData.entite_payeur_id
      };

      let data, error;

      if (editingEmployee) {
        // Mode modification
        ({ data, error } = await supabase
          .from('personnel')
          .update(employeeData)
          .eq('id', editingEmployee.id)
          .select(`
            *,
            entite_payeur:entite_payeur_id (
              code,
              libelle
            )
          `)
          .single());
      } else {
        // Mode création
        ({ data, error } = await supabase
          .from('personnel')
          .insert([employeeData])
          .select(`
            *,
            entite_payeur:entite_payeur_id (
              code,
              libelle
            )
          `)
          .single());
      }

      if (error) throw error;

      if (editingEmployee) {
        setPersonnel(prev => prev.map(e => e.id === editingEmployee.id ? data : e));
        setEditingEmployee(null);
        showToast({
          label: 'Employé modifié avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setPersonnel(prev => [...prev, data]);
        setShowForm(false);
        showToast({
          label: 'Employé créé avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setFormData({
        fonction: '',
        salaire_base: '',
        ordre_affichage: '',
        indemnites_repas: '0',
        autres_couts: '0',
        nom_prenom: '',
        date_debut: '',
        date_fin: '',
        entite_payeur_id: ''
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingEmployee ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (employee: Personnel) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'employé "${employee.nom_prenom}" ?`)) {
      try {
        const { error } = await supabase
          .from('personnel')
          .delete()
          .eq('id', employee.id);

        if (error) throw error;

        // Rafraîchir la liste du personnel
        const { data, error: fetchError } = await supabase
          .from('personnel')
          .select('*')
          .order('nom_prenom', { ascending: true });

        if (fetchError) throw fetchError;
        setPersonnel(data || []);

        showToast({
          label: 'Employé supprimé avec succès',
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

  const handleEdit = (employee: Personnel) => {
    setEditingEmployee(employee);
    setFormData({
      fonction: employee.fonction,
      salaire_base: employee.salaire_base.toString(),
      ordre_affichage: employee.ordre_affichage?.toString() || '',
      indemnites_repas: employee.indemnites_repas.toString(),
      autres_couts: employee.autres_couts.toString(),
      nom_prenom: employee.nom_prenom,
      date_debut: employee.date_debut,
      date_fin: employee.date_fin || '',
      entite_payeur_id: employee.entite_payeur_id || ''
    });
    window.scrollTo(0, document.body.scrollHeight);
  };

  useEffect(() => {
    async function fetchPersonnel() {
      try {
        const { data, error } = await supabase
          .from('personnel')
          .select(`
            *,
            entite_payeur:entite_payeur_id (
              code,
              libelle
            )
          `);

        if (error) throw error;

        // Trier d'abord par ordre_affichage (si défini), puis par nom_prenom
        const sortedData = (data || []).sort((a, b) => {
          if (a.ordre_affichage !== null && b.ordre_affichage !== null) {
            return a.ordre_affichage - b.ordre_affichage;
          }
          if (a.ordre_affichage !== null) return -1;
          if (b.ordre_affichage !== null) return 1;
          return a.nom_prenom.localeCompare(b.nom_prenom);
        });

        setPersonnel(sortedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchPersonnel();
  }, []);

  useEffect(() => {
    async function fetchEntites() {
      try {
        const { data, error } = await supabase
          .from('entite')
          .select('id, code, libelle')
          .order('code', { ascending: true });

        if (error) throw error;
        setEntites(data || []);
      } catch (err) {
        showToast({
          label: err instanceof Error ? err.message : 'Erreur lors du chargement des entités',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }

    fetchEntites();
  }, [showToast]);

  useEffect(() => {
    async function fetchAffectations() {
      if (!selectedEmployee) {
        setAffectations([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('affectation_personnel_entite')
          .select(`
            id,
            entite_id,
            entite:entite_id (
              code,
              libelle
            ),
            taux_presence,
            date_debut,
            date_fin,
            cout_affectation,
            role_specifique,
            notes
          `)
          .eq('personnel_id', selectedEmployee.id)
          .order('date_debut', { ascending: false });

        if (error) throw error;
        setAffectations(data || []);
      } catch (err) {
        showToast({
          label: err instanceof Error ? err.message : 'Erreur lors du chargement des affectations',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }

    fetchAffectations();
  }, [selectedEmployee, showToast]);

  return (
    <>
      <PageSection
        title="Gestion des employés"
        description="Liste de tous les employés enregistrés."
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label={showForm ? "Masquer le formulaire" : "Créer un employé"}
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
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Nom et Prénom</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Fonction</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Ordre</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Salaire Base</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Indemnités</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Autres Coûts</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date Début</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date Fin</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Restaurant payeur</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                    Chargement des employés...
                  </td>
                </tr>
              ) : personnel.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                    Aucun employé trouvé.
                  </td>
                </tr>
              ) : personnel.map((employee) => (
                <tr 
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedEmployee?.id === employee.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEdit(employee)}
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
                        onClick={() => handleDelete(employee)}
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
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>{employee.nom_prenom}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>{employee.fonction}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {employee.ordre_affichage || '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {employee.salaire_base.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {employee.indemnites_repas.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {employee.autres_couts.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {new Date(employee.date_debut).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {employee.date_fin ? new Date(employee.date_fin).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {employee.entite_payeur ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building size={16} style={{ color: theme.colors.primary }} />
                        <span>{employee.entite_payeur.code}</span>
                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.75rem' }}>
                          ({employee.entite_payeur.libelle})
                        </span>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageSection>

      {selectedEmployee && (
        <PageSection
          subtitle={`Affectations de ${selectedEmployee.nom_prenom}`}
          description="Liste des affectations aux différentes entités"
        >
          <div style={{ marginBottom: '1rem' }}>
            <Button
              label="Nouvelle affectation"
              icon="Plus"
              color={theme.colors.primary}
              onClick={() => setShowAffectationForm(true)}
            />
          </div>

          {affectations.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
              Aucune affectation trouvée pour cet employé.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Entité</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Taux présence</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Coût</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Rôle</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date début</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date fin</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {affectations.map((affectation) => (
                  <tr key={affectation.id}>
                    <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAffectation(affectation);
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
                          title="Modifier l'affectation"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAffectation(affectation);
                          }}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            borderRadius: '4px',
                            color: '#ef4444',
                            transition: 'all 0.2s'
                          }}
                          title="Supprimer l'affectation"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building size={16} style={{ color: theme.colors.primary }} />
                        <span>{affectation.entite.libelle}</span>
                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.75rem' }}>
                          ({affectation.entite.code})
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {(affectation.taux_presence * 100).toFixed(0)}%
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                      {affectation.cout_affectation.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {affectation.role_specifique || '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {new Date(affectation.date_debut).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {affectation.date_fin ? new Date(affectation.date_fin).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                      {affectation.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
            
            <FormField label="Taux de présence (%)" required>
              <FormInput
                type="number"
                name="taux_presence"
                value={affectationFormData.taux_presence}
                onChange={handleAffectationInputChange}
                min="0"
                max="100"
                step="1"
                placeholder="100"
              />
            </FormField>
            
            <FormField label="Coût d'affectation">
              <FormInput
                type="number"
                name="cout_affectation"
                value={affectationFormData.cout_affectation}
                onChange={handleAffectationInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </FormField>
            
            <FormField label="Rôle spécifique">
              <FormInput
                type="text"
                name="role_specifique"
                value={affectationFormData.role_specifique}
                onChange={handleAffectationInputChange}
                maxLength={30}
                placeholder="Rôle dans cette entité"
              />
            </FormField>
            
            <FormField label="Date de début" required>
              <FormInput
                type="date"
                name="date_debut"
                value={affectationFormData.date_debut}
                onChange={handleAffectationInputChange}
              />
            </FormField>
            
            <FormField label="Date de fin">
              <FormInput
                type="date"
                name="date_fin"
                value={affectationFormData.date_fin}
                onChange={handleAffectationInputChange}
              />
            </FormField>
            
            <FormField label="Notes">
              <FormInput
                type="text"
                name="notes"
                value={affectationFormData.notes}
                onChange={handleAffectationInputChange}
                placeholder="Notes additionnelles"
              />
            </FormField>
            
            <FormActions>
              <Button
                label="Annuler"
                type="button"
                icon="X"
                color={theme.colors.secondary}
                onClick={() => {
                  setShowAffectationForm(false);
                  setEditingAffectation(null);
                  setAffectationFormData({
                    entite_id: '',
                    taux_presence: '100',
                    date_debut: '',
                    date_fin: '',
                    cout_affectation: '0',
                    role_specifique: '',
                    notes: ''
                  });
                }}
              />
              <Button
                label={editingAffectation ? "Modifier" : "Créer"}
                type="submit"
                icon={editingAffectation ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}
      
      {(showForm || editingEmployee) && (
        <PageSection
          subtitle={editingEmployee ? "Modifier un employé" : "Nouvel employé"}
          description={editingEmployee ? "Modifier les informations de l'employé" : "Créer un nouvel employé"}
        >
          <Form size={50} onSubmit={handleSubmit}>
            <FormField label="Nom et Prénom" required>
              <FormInput
                type="text"
                name="nom_prenom"
                value={formData.nom_prenom}
                onChange={handleInputChange}
                maxLength={40}
                placeholder="Jean Dupont"
              />
            </FormField>
            
            <FormField label="Fonction" required>
              <FormInput
                type="text"
                name="fonction"
                value={formData.fonction}
                onChange={handleInputChange}
                maxLength={30}
                placeholder="Cuisinier"
              />
            </FormField>
            
            <FormField label="Ordre d'affichage">
              <FormInput
                type="number"
                name="ordre_affichage"
                value={formData.ordre_affichage}
                onChange={handleInputChange}
                min="0"
                placeholder="Ordre d'affichage (optionnel)"
              />
            </FormField>
            
            <FormField label="Salaire Base" required>
              <FormInput
                type="number"
                name="salaire_base"
                value={formData.salaire_base}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="2000.00"
              />
            </FormField>
            
            <FormField label="Indemnités Repas">
              <FormInput
                type="number"
                name="indemnites_repas"
                value={formData.indemnites_repas}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </FormField>
            
            <FormField label="Autres Coûts">
              <FormInput
                type="number"
                name="autres_couts"
                value={formData.autres_couts}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </FormField>
            
            <FormField label="Date de Début" required>
              <FormInput
                type="date"
                name="date_debut"
                value={formData.date_debut}
                onChange={handleInputChange}
              />
            </FormField>
            
            <FormField label="Date de Fin">
              <FormInput
                type="date"
                name="date_fin"
                value={formData.date_fin}
                onChange={handleInputChange}
              />
            </FormField>
            
            <FormField label="Restaurant payeur" required>
              <select
                name="entite_payeur_id"
                value={formData.entite_payeur_id}
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
                <option value="">Sélectionner un restaurant payeur</option>
                {entites.map(entite => (
                  <option key={entite.id} value={entite.id}>
                    {entite.code} - {entite.libelle}
                  </option>
                ))}
              </select>
            </FormField>
            
            <FormActions>
              {editingEmployee && (
                <Button
                  label="Annuler"
                  type="button"
                  icon="X"
                  color={theme.colors.secondary}
                  onClick={() => {
                    setEditingEmployee(null);
                    setFormData({
                      fonction: '',
                      salaire_base: '',
                      indemnites_repas: '0',
                      autres_couts: '0',
                      nom_prenom: '',
                      date_debut: '',
                      date_fin: '',
                      entite_payeur_id: ''
                    });
                  }}
                />
              )}
              <Button
                label={editingEmployee ? "Modifier" : "Créer"}
                type="submit"
                icon={editingEmployee ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}
    </>
  );
}

export default EmployeesList;