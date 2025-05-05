import React, { useState, useEffect } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2, Building, Calendar, Clock, History, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

// Interface pour les données personnelles
interface Personnel {
  id: string;
  nom_prenom: string;
  date_debut: string;
  date_fin: string | null;
  ordre_affichage: number | null;
  created_at: string;
  updated_at: string;
}

// Interface pour les données contractuelles
interface ContratHistorique {
  id: string;
  personnel_id: string;
  date_debut: string;
  date_fin: string | null;
  fonction: string;
  salaire_base: number;
  indemnites_reel: number;
  autres_couts: number;
  entite_payeur_id: string | null;
  entite_payeur?: {
    code: string;
    libelle: string;
  };
  created_at: string;
  updated_at: string;
}

// Interface pour les affectations
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
  // États pour les données
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Personnel | null>(null);
  const [contratActuel, setContratActuel] = useState<ContratHistorique | null>(null);
  const [contratsHistorique, setContratsHistorique] = useState<ContratHistorique[]>([]);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [entites, setEntites] = useState<{ id: string; code: string; libelle: string; }[]>([]);
  
  // États pour les formulaires
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showContratForm, setShowContratForm] = useState(false);
  const [showAffectationForm, setShowAffectationForm] = useState(false);
  
  // États pour l'édition
  const [editingEmployee, setEditingEmployee] = useState<Personnel | null>(null);
  const [editingContrat, setEditingContrat] = useState<ContratHistorique | null>(null);
  const [editingAffectation, setEditingAffectation] = useState<Affectation | null>(null);
  
  // États pour le chargement et les erreurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Toast pour les notifications
  const { showToast } = useToast();
  
  // Formulaires
  const [employeeFormData, setEmployeeFormData] = useState({
    nom_prenom: '',
    date_debut: '',
    date_fin: '',
    ordre_affichage: ''
  });
  
  const [contratFormData, setContratFormData] = useState({
    date_debut: '',
    date_fin: '',
    fonction: '',
    salaire_base: '',
    indemnites_reel: '0',
    autres_couts: '0',
    entite_payeur_id: ''
  });
  
  const [affectationFormData, setAffectationFormData] = useState({
    entite_id: '',
    taux_presence: '100',
    date_debut: '',
    date_fin: '',
    cout_affectation: '0',
    role_specifique: '',
    notes: ''
  });

  // Chargement initial des données
  useEffect(() => {
    fetchEntites();
    fetchPersonnel();
  }, []);

  // Chargement des entités
  const fetchEntites = async () => {
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
  };

  // Chargement du personnel
  const fetchPersonnel = async () => {
    try {
      const { data, error } = await supabase
        .from('rh_personnel')
        .select('*')
        .order('ordre_affichage', { ascending: true, nullsLast: true })
        .order('nom_prenom');

      if (error) throw error;
      setPersonnel(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Chargement des contrats pour un employé
  const fetchContrats = async (personnelId: string) => {
    try {
      const { data, error } = await supabase
        .from('rh_historique_contrat')
        .select(`
          *,
          entite_payeur:entite_payeur_id (
            code,
            libelle
          )
        `)
        .eq('personnel_id', personnelId)
        .order('date_debut', { ascending: false });

      if (error) throw error;
      
      // Trier les contrats
      const today = new Date();
      const contrats = data || [];
      
      // Trouver le contrat actuel (date_debut <= aujourd'hui && (date_fin est null || date_fin >= aujourd'hui))
      const actuel = contrats.find(c => {
        const dateDebut = new Date(c.date_debut);
        const dateFin = c.date_fin ? new Date(c.date_fin) : null;
        return dateDebut <= today && (!dateFin || dateFin >= today);
      }) || null;
      
      setContratActuel(actuel);
      setContratsHistorique(contrats);
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors du chargement des contrats',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  // Chargement des affectations pour un employé
  const fetchAffectations = async (personnelId: string) => {
    try {
      const { data, error } = await supabase
        .from('rh_affectation_personnel_entite')
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
        .eq('personnel_id', personnelId)
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
  };

  // Mise à jour des données lorsqu'un employé est sélectionné
  useEffect(() => {
    if (selectedEmployee) {
      fetchContrats(selectedEmployee.id);
      fetchAffectations(selectedEmployee.id);
    } else {
      setContratActuel(null);
      setContratsHistorique([]);
      setAffectations([]);
    }
  }, [selectedEmployee]);

  // Gestion des changements dans le formulaire employé
  const handleEmployeeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEmployeeFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestion des changements dans le formulaire contrat
  const handleContratInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContratFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestion des changements dans le formulaire affectation
  const handleAffectationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAffectationFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumission du formulaire employé
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const employeeData = {
        nom_prenom: employeeFormData.nom_prenom,
        date_debut: employeeFormData.date_debut,
        date_fin: employeeFormData.date_fin || null,
        ordre_affichage: employeeFormData.ordre_affichage ? parseInt(employeeFormData.ordre_affichage) : null
      };

      let data, error;

      if (editingEmployee) {
        // Mode modification
        ({ data, error } = await supabase
          .from('rh_personnel')
          .update(employeeData)
          .eq('id', editingEmployee.id)
          .select()
          .single());
      } else {
        // Mode création
        ({ data, error } = await supabase
          .from('rh_personnel')
          .insert([employeeData])
          .select()
          .single());
        
        // Si la création de l'employé a réussi, créer également un contrat initial
        if (!error && data) {
          const contratData = {
            personnel_id: data.id,
            date_debut: employeeFormData.date_debut,
            date_fin: null,
            fonction: contratFormData.fonction,
            salaire_base: parseFloat(contratFormData.salaire_base),
            indemnites_reel: parseFloat(contratFormData.indemnites_reel),
            autres_couts: parseFloat(contratFormData.autres_couts),
            entite_payeur_id: contratFormData.entite_payeur_id
          };
          
          const { error: contratError } = await supabase
            .from('rh_historique_contrat')
            .insert([contratData]);
          
          if (contratError) {
            showToast({
              label: `Employé créé mais erreur lors de la création du contrat: ${contratError.message}`,
              icon: 'AlertTriangle',
              color: '#f59e0b'
            });
          }
        }
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
        setSelectedEmployee(data);
        showToast({
          label: 'Employé créé avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setShowEmployeeForm(false);
      resetEmployeeForm();
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingEmployee ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  // Soumission du formulaire contrat
  const handleContratSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    try {
      const contratData = {
        personnel_id: selectedEmployee.id,
        date_debut: contratFormData.date_debut,
        date_fin: contratFormData.date_fin || null,
        fonction: contratFormData.fonction,
        salaire_base: parseFloat(contratFormData.salaire_base),
        indemnites_reel: parseFloat(contratFormData.indemnites_reel),
        autres_couts: parseFloat(contratFormData.autres_couts),
        entite_payeur_id: contratFormData.entite_payeur_id
      };

      let data, error;

      if (editingContrat) {
        // Mode modification
        ({ data, error } = await supabase
          .from('rh_historique_contrat')
          .update(contratData)
          .eq('id', editingContrat.id)
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
        // Si un contrat actuel existe et n'a pas de date de fin, on lui en ajoute une
        if (contratActuel && !contratActuel.date_fin) {
          const dateDebutNouveau = new Date(contratFormData.date_debut);
          const dateFinAncien = new Date(dateDebutNouveau);
          dateFinAncien.setDate(dateFinAncien.getDate() - 1);
          
          // Mettre à jour l'ancien contrat
          const { error: updateError } = await supabase
            .from('rh_historique_contrat')
            .update({ date_fin: dateFinAncien.toISOString().split('T')[0] })
            .eq('id', contratActuel.id);
          
          if (updateError) {
            throw new Error(`Erreur lors de la mise à jour de l'ancien contrat: ${updateError.message}`);
          }
        }
        
        // Créer le nouveau contrat
        ({ data, error } = await supabase
          .from('rh_historique_contrat')
          .insert([contratData])
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

      // Rafraîchir les contrats
      fetchContrats(selectedEmployee.id);
      
      setShowContratForm(false);
      setEditingContrat(null);
      resetContratForm();
      
      showToast({
        label: `Contrat ${editingContrat ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#10b981'
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingContrat ? 'modification' : 'création'} du contrat`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  // Soumission du formulaire affectation
  const handleAffectationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    try {
      const affectationData = {
        personnel_id: selectedEmployee.id,
        entite_id: affectationFormData.entite_id,
        taux_presence: parseFloat(affectationFormData.taux_presence) / 100,
        date_debut: affectationFormData.date_debut,
        date_fin: affectationFormData.date_fin || null,
        cout_affectation: parseFloat(affectationFormData.cout_affectation),
        role_specifique: affectationFormData.role_specifique || null,
        notes: affectationFormData.notes || null
      };

      let data, error;

      if (editingAffectation) {
        // Mode modification
        ({ data, error } = await supabase
          .from('rh_affectation_personnel_entite')
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
          .from('rh_affectation_personnel_entite')
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
      } else {
        setAffectations(prev => [data, ...prev]);
      }

      setShowAffectationForm(false);
      resetAffectationForm();
      
      showToast({
        label: `Affectation ${editingAffectation ? 'modifiée' : 'créée'} avec succès`,
        icon: 'Check',
        color: '#10b981'
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingAffectation ? 'modification' : 'création'} de l'affectation`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  // Suppression d'un employé
  const handleDeleteEmployee = async (employee: Personnel) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'employé "${employee.nom_prenom}" ?`)) {
      try {
        const { error } = await supabase
          .from('rh_personnel')
          .delete()
          .eq('id', employee.id);

        if (error) throw error;

        setPersonnel(prev => prev.filter(e => e.id !== employee.id));
        
        if (selectedEmployee?.id === employee.id) {
          setSelectedEmployee(null);
        }
        
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

  // Suppression d'un contrat
  const handleDeleteContrat = async (contrat: ContratHistorique) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce contrat ?`)) {
      try {
        const { error } = await supabase
          .from('rh_historique_contrat')
          .delete()
          .eq('id', contrat.id);

        if (error) throw error;

        // Rafraîchir les contrats
        if (selectedEmployee) {
          fetchContrats(selectedEmployee.id);
        }
        
        showToast({
          label: 'Contrat supprimé avec succès',
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

  // Suppression d'une affectation
  const handleDeleteAffectation = async (affectation: Affectation) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) {
      try {
        const { error } = await supabase
          .from('rh_affectation_personnel_entite')
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

  // Édition d'un employé
  const handleEditEmployee = (employee: Personnel) => {
    setEditingEmployee(employee);
    setEmployeeFormData({
      nom_prenom: employee.nom_prenom,
      date_debut: employee.date_debut,
      date_fin: employee.date_fin || '',
      ordre_affichage: employee.ordre_affichage?.toString() || ''
    });
    setShowEmployeeForm(true);
  };

  // Édition d'un contrat
  const handleEditContrat = (contrat: ContratHistorique) => {
    setEditingContrat(contrat);
    setContratFormData({
      date_debut: contrat.date_debut,
      date_fin: contrat.date_fin || '',
      fonction: contrat.fonction || '',
      salaire_base: contrat.salaire_base?.toString() || '',
      indemnites_reel: contrat.indemnites_reel?.toString() || '0',
      autres_couts: contrat.autres_couts?.toString() || '0',
      entite_payeur_id: contrat.entite_payeur_id || ''
    });
    setShowContratForm(true);
  };

  // Édition d'une affectation
  const handleEditAffectation = (affectation: Affectation) => {
    setEditingAffectation(affectation);
    setAffectationFormData({
      entite_id: affectation.entite_id,
      taux_presence: (affectation.taux_presence * 100).toString(),
      date_debut: affectation.date_debut,
      date_fin: affectation.date_fin || '',
      cout_affectation: affectation.cout_affectation.toString(),
      role_specifique: affectation.role_specifique || '',
      notes: affectation.notes || ''
    });
    setShowAffectationForm(true);
  };

  // Réinitialisation des formulaires
  const resetEmployeeForm = () => {
    setEmployeeFormData({
      nom_prenom: '',
      date_debut: '',
      date_fin: '',
      ordre_affichage: ''
    });
  };

  const resetContratForm = () => {
    setContratFormData({
      date_debut: '',
      date_fin: '',
      fonction: '',
      salaire_base: '',
      indemnites_reel: '0',
      autres_couts: '0',
      entite_payeur_id: ''
    });
  };

  const resetAffectationForm = () => {
    setAffectationFormData({
      entite_id: '',
      taux_presence: '100',
      date_debut: '',
      date_fin: '',
      cout_affectation: '0',
      role_specifique: '',
      notes: ''
    });
  };

  // Création d'un nouvel employé
  const handleNewEmployee = () => {
    setEditingEmployee(null);
    resetEmployeeForm();
    resetContratForm();
    setShowEmployeeForm(true);
  };

  // Création d'un nouveau contrat
  const handleNewContrat = () => {
    if (!selectedEmployee) return;
    
    setEditingContrat(null);
    resetContratForm();
    
    // Préremplir la date de début avec la date du jour
    const today = new Date().toISOString().split('T')[0];
    setContratFormData(prev => ({
      ...prev,
      date_debut: today
    }));
    
    setShowContratForm(true);
  };

  // Création d'une nouvelle affectation
  const handleNewAffectation = () => {
    if (!selectedEmployee) return;
    
    setEditingAffectation(null);
    resetAffectationForm();
    
    // Préremplir la date de début avec la date du jour
    const today = new Date().toISOString().split('T')[0];
    setAffectationFormData(prev => ({
      ...prev,
      date_debut: today
    }));
    
    setShowAffectationForm(true);
  };

  // Détermine le statut d'un contrat
  const getContratStatus = (contrat: ContratHistorique) => {
    const today = new Date();
    const dateDebut = new Date(contrat.date_debut);
    const dateFin = contrat.date_fin ? new Date(contrat.date_fin) : null;
    
    if (dateDebut > today) {
      return { label: 'Futur', color: '#3b82f6' }; // Bleu
    } else if (!dateFin || dateFin >= today) {
      return { label: 'Actuel', color: '#10b981' }; // Vert
    } else {
      return { label: 'Terminé', color: '#6b7280' }; // Gris
    }
  };

  return (
    <>
      <PageSection
        title="Gestion des employés"
        description="Liste de tous les employés enregistrés."
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label="Créer un employé"
            icon="Plus"
            color={theme.colors.primary}
            onClick={handleNewEmployee}
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
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Ordre</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date Début</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date Fin</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Contrat Actuel</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                    Chargement des employés...
                  </td>
                </tr>
              ) : personnel.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEmployee(employee);
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEmployee(employee);
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
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {employee.nom_prenom}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {employee.ordre_affichage || '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {new Date(employee.date_debut).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {employee.date_fin ? new Date(employee.date_fin).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {employee.id === selectedEmployee?.id && contratActuel ? (
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#10b981'
                      }}>
                        <Check size={14} />
                        <span>Contrat actif</span>
                      </div>
                    ) : (
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#ef4444'
                      }}>
                        <Clock size={14} />
                        <span>Aucun contrat actif</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageSection>

      {selectedEmployee && (
        <>
          {/* Section Contrat Actuel */}
          <PageSection
            subtitle={`Contrat actuel de ${selectedEmployee.nom_prenom}`}
            description="Informations sur le contrat en cours"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                {contratActuel ? (
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: '#10b981'
                  }}>
                    <Check size={16} />
                    <span>Contrat actif</span>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: '#ef4444'
                  }}>
                    <Clock size={16} />
                    <span>Aucun contrat actif</span>
                  </div>
                )}
              </div>
              <Button
                label="Nouveau contrat"
                icon="Plus"
                color={theme.colors.primary}
                onClick={handleNewContrat}
              />
            </div>

            {contratActuel ? (
              <div style={{ 
                padding: '1.5rem', 
                backgroundColor: 'white', 
                borderRadius: '0.5rem',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: 0, marginBottom: '0.5rem' }}>Informations générales</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', margin: '0 0 0.25rem 0' }}>Fonction</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>{contratActuel.fonction || '-'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', margin: '0 0 0.25rem 0' }}>Entité payeuse</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>
                          {contratActuel.entite_payeur ? (
                            <span>{contratActuel.entite_payeur.code} - {contratActuel.entite_payeur.libelle}</span>
                          ) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: 0, marginBottom: '0.5rem' }}>Rémunération</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', margin: '0 0 0.25rem 0' }}>Salaire base</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>
                          {contratActuel.salaire_base?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '-'}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', margin: '0 0 0.25rem 0' }}>Indemnités</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>
                          {contratActuel.indemnites_reel?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '-'}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', margin: '0 0 0.25rem 0' }}>Autres coûts</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>
                          {contratActuel.autres_couts?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: 0, marginBottom: '0.5rem' }}>Période</h3>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', margin: '0 0 0.25rem 0' }}>Date de début</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} style={{ color: theme.colors.primary }} />
                        {new Date(contratActuel.date_debut).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', margin: '0 0 0.25rem 0' }}>Date de fin</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} style={{ color: contratActuel.date_fin ? theme.colors.primary : '#9ca3af' }} />
                        {contratActuel.date_fin ? new Date(contratActuel.date_fin).toLocaleDateString('fr-FR') : 'Indéterminée'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    label="Modifier ce contrat"
                    icon="Pencil"
                    color={theme.colors.primary}
                    onClick={() => handleEditContrat(contratActuel)}
                  />
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: '2rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.5rem',
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--color-text-light)' }}>
                  Aucun contrat actif pour cet employé.
                </p>
                <Button
                  label="Créer un contrat"
                  icon="Plus"
                  color={theme.colors.primary}
                  onClick={handleNewContrat}
                />
              </div>
            )}
          </PageSection>

          {/* Section Historique des Contrats */}
          <PageSection
            subtitle="Historique des contrats"
            description="Liste de tous les contrats de l'employé"
          >
            {contratsHistorique.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
                Aucun historique de contrat trouvé pour cet employé.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Statut</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Fonction</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Entité payeuse</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Salaire base</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Indemnités</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Autres coûts</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date début</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date fin</th>
                  </tr>
                </thead>
                <tbody>
                  {contratsHistorique.map((contrat) => {
                    const status = getContratStatus(contrat);
                    return (
                      <tr key={contrat.id}>
                        <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEditContrat(contrat)}
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
                              onClick={() => handleDeleteContrat(contrat)}
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
                          <div style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: `${status.color}10`,
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            color: status.color
                          }}>
                            {status.label === 'Actuel' && <Check size={14} />}
                            {status.label === 'Futur' && <Clock size={14} />}
                            {status.label === 'Terminé' && <History size={14} />}
                            <span>{status.label}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                          {contrat.fonction || '-'}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                          {contrat.entite_payeur ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Building size={16} style={{ color: theme.colors.primary }} />
                              <span>{contrat.entite_payeur.code}</span>
                              <span style={{ color: 'var(--color-text-light)', fontSize: '0.75rem' }}>
                                ({contrat.entite_payeur.libelle})
                              </span>
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                          {contrat.salaire_base?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '-'}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                          {contrat.indemnites_reel?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '-'}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                          {contrat.autres_couts?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '-'}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                          {new Date(contrat.date_debut).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                          {contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString('fr-FR') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </PageSection>

          {/* Section Affectations */}
          <PageSection
            subtitle={`Affectations de ${selectedEmployee.nom_prenom}`}
            description="Liste des affectations aux différentes entités"
          >
            <div style={{ marginBottom: '1rem' }}>
              <Button
                label="Nouvelle affectation"
                icon="Plus"
                color={theme.colors.primary}
                onClick={handleNewAffectation}
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
        </>
      )}

      {/* Formulaire de création/modification d'employé */}
      {showEmployeeForm && (
        <PageSection
          subtitle={editingEmployee ? "Modifier un employé" : "Nouvel employé"}
          description={editingEmployee ? "Modifier les informations de l'employé" : "Créer un nouvel employé"}
        >
          <Form size={50} onSubmit={handleEmployeeSubmit}>
            <FormField label="Nom et Prénom" required>
              <FormInput
                type="text"
                name="nom_prenom"
                value={employeeFormData.nom_prenom}
                onChange={handleEmployeeInputChange}
                maxLength={40}
                placeholder="Jean Dupont"
                required
              />
            </FormField>
            
            <FormField label="Date de Début" required>
              <FormInput
                type="date"
                name="date_debut"
                value={employeeFormData.date_debut}
                onChange={handleEmployeeInputChange}
                required
              />
            </FormField>
            
            <FormField label="Date de Fin">
              <FormInput
                type="date"
                name="date_fin"
                value={employeeFormData.date_fin}
                onChange={handleEmployeeInputChange}
              />
            </FormField>
            
            <FormField label="Ordre d'affichage">
              <FormInput
                type="number"
                name="ordre_affichage"
                value={employeeFormData.ordre_affichage}
                onChange={handleEmployeeInputChange}
                min="0"
                placeholder="Ordre d'affichage (optionnel)"
              />
            </FormField>

            {!editingEmployee && (
              <>
                <div style={{ 
                  margin: '1.5rem 0', 
                  padding: '0.75rem', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '0.375rem',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                    Informations contractuelles initiales
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', margin: '0 0 0.75rem 0' }}>
                    Ces informations seront utilisées pour créer le premier contrat de l'employé.
                  </p>
                </div>

                <FormField label="Fonction" required>
                  <FormInput
                    type="text"
                    name="fonction"
                    value={contratFormData.fonction}
                    onChange={handleContratInputChange}
                    maxLength={30}
                    placeholder="Cuisinier"
                    required
                  />
                </FormField>
                
                <FormField label="Salaire Base" required>
                  <FormInput
                    type="number"
                    name="salaire_base"
                    value={contratFormData.salaire_base}
                    onChange={handleContratInputChange}
                    step="0.01"
                    min="0"
                    placeholder="2000.00"
                    required
                  />
                </FormField>
                
                <FormField label="Indemnités">
                  <FormInput
                    type="number"
                    name="indemnites_reel"
                    value={contratFormData.indemnites_reel}
                    onChange={handleContratInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </FormField>
                
                <FormField label="Autres Coûts">
                  <FormInput
                    type="number"
                    name="autres_couts"
                    value={contratFormData.autres_couts}
                    onChange={handleContratInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </FormField>
                
                <FormField label="Restaurant payeur" required>
                  <select
                    name="entite_payeur_id"
                    value={contratFormData.entite_payeur_id}
                    onChange={handleContratInputChange}
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
              </>
            )}
            
            <FormActions>
              <Button
                label="Annuler"
                type="button"
                icon="X"
                color={theme.colors.secondary}
                onClick={() => {
                  setShowEmployeeForm(false);
                  setEditingEmployee(null);
                  resetEmployeeForm();
                  resetContratForm();
                }}
              />
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

      {/* Formulaire de création/modification de contrat */}
      {showContratForm && selectedEmployee && (
        <PageSection
          subtitle={editingContrat ? "Modifier un contrat" : "Nouveau contrat"}
          description={editingContrat ? "Modifier les informations du contrat" : `Créer un nouveau contrat pour ${selectedEmployee.nom_prenom}`}
        >
          <Form size={50} onSubmit={handleContratSubmit}>
            <FormField label="Fonction" required>
              <FormInput
                type="text"
                name="fonction"
                value={contratFormData.fonction}
                onChange={handleContratInputChange}
                maxLength={30}
                placeholder="Cuisinier"
                required
              />
            </FormField>
            
            <FormField label="Date de début" required>
              <FormInput
                type="date"
                name="date_debut"
                value={contratFormData.date_debut}
                onChange={handleContratInputChange}
                required
              />
            </FormField>
            
            <FormField label="Date de fin">
              <FormInput
                type="date"
                name="date_fin"
                value={contratFormData.date_fin}
                onChange={handleContratInputChange}
              />
            </FormField>
            
            <FormField label="Salaire Base" required>
              <FormInput
                type="number"
                name="salaire_base"
                value={contratFormData.salaire_base}
                onChange={handleContratInputChange}
                step="0.01"
                min="0"
                placeholder="2000.00"
                required
              />
            </FormField>
            
            <FormField label="Indemnités">
              <FormInput
                type="number"
                name="indemnites_reel"
                value={contratFormData.indemnites_reel}
                onChange={handleContratInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </FormField>
            
            <FormField label="Autres Coûts">
              <FormInput
                type="number"
                name="autres_couts"
                value={contratFormData.autres_couts}
                onChange={handleContratInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </FormField>
            
            <FormField label="Restaurant payeur" required>
              <select
                name="entite_payeur_id"
                value={contratFormData.entite_payeur_id}
                onChange={handleContratInputChange}
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
              <Button
                label="Annuler"
                type="button"
                icon="X"
                color={theme.colors.secondary}
                onClick={() => {
                  setShowContratForm(false);
                  setEditingContrat(null);
                  resetContratForm();
                }}
              />
              <Button
                label={editingContrat ? "Modifier" : "Créer"}
                type="submit"
                icon={editingContrat ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}

      {/* Formulaire de création/modification d'affectation */}
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
                onChange={handleAffectationInputChange}
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
                required
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
                required
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
                  resetAffectationForm();
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
    </>
  );
}

export default EmployeesList;