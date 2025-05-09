import React, { useState, useEffect, useRef } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2, User, Calendar, Phone, Mail, MapPin, Search, Briefcase, Clock, CreditCard, ChevronDown, Upload, X, Image, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface Employee {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  date_naissance: string | null;
  sexe: string | null;
  numero_securite_sociale: string | null;
  adresse_postale: string | null;
  ville: string | null;
  code_postal: string | null;
  pays: string | null;
  photo_profil: string | null;
  statut: boolean;
}

interface TypeContrat {
  id: string;
  nom: string;
  description: string | null;
  ordre_affichage: number | null;
  active: boolean;
}

interface Fonction {
  id: string;
  nom: string;
  description: string | null;
  ordre_affichage: number | null;
  active: boolean;
}

interface HistoriqueContrat {
  id: string;
  personnel_id: string;
  fonction_id: string | null;
  type_contrat_id: string | null;
  salaire_base: number;
  indemnites_re: number;
  autres_couts: number;
  entite_payeur: string | null;
  date_debut: string;
  date_fin: string | null;
  active: boolean;
  fonction?: {
    nom: string;
  };
  type_contrat?: {
    nom: string;
  };
  entite?: {
    code: string;
    libelle: string;
  };
}

function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingContrats, setLoadingContrats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [entites, setEntites] = useState<{ id: string; code: string; libelle: string; }[]>([]);
  const [fonctions, setFonctions] = useState<Fonction[]>([]);
  const [typesContrat, setTypesContrat] = useState<TypeContrat[]>([]);
  const [historiqueContrats, setHistoriqueContrats] = useState<HistoriqueContrat[]>([]);
  const [showContratModal, setShowContratModal] = useState(false);
  const [editingContrat, setEditingContrat] = useState<HistoriqueContrat | null>(null);
  const [contratFormData, setContratFormData] = useState({
    fonction_id: '',
    type_contrat_id: '',
    salaire_base: '',
    indemnites_re: '0',
    autres_couts: '0',
    entite_payeur: '',
    date_debut: '',
    date_fin: '',
    active: true
  });
  const [formData, setFormData] = useState({
    photo_profil: '',
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    date_naissance: '',
    sexe: 'Non spécifié',
    numero_securite_sociale: '',
    adresse_postale: '',
    ville: '',
    code_postal: '',
    pays: '',
    statut: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleContratInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setContratFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        showToast({
          label: 'Veuillez sélectionner une image',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
        return;
      }
      
      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showToast({
          label: 'L\'image est trop volumineuse (max 2MB)',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Créer une URL pour la prévisualisation
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    
    // Si on est en mode édition, on conserve l'URL existante
    if (editingEmployee && editingEmployee.photo_profil) {
      setFormData(prev => ({
        ...prev,
        photo_profil: editingEmployee.photo_profil
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        photo_profil: ''
      }));
    }
    
    // Réinitialiser l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!selectedFile) {
      // Si pas de nouveau fichier sélectionné, retourner l'URL existante
      return formData.photo_profil || null;
    }
    
    try {
      // Générer un nom de fichier unique
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `profile_photos/${fileName}`;
      
      // Uploader le fichier
      const { error: uploadError } = await supabase.storage
        .from('employees')
        .upload(filePath, selectedFile);
      
      if (uploadError) throw uploadError;
      
      // Récupérer l'URL publique
      const { data } = supabase.storage
        .from('employees')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload de la photo:', error);
      showToast({
        label: 'Erreur lors de l\'upload de la photo',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Uploader la photo si nécessaire
      let photoUrl = await uploadPhoto();
      
      const employeeData = {
        ...formData,
        photo_profil: photoUrl,
        email: formData.email || null,
        telephone: formData.telephone || null,
        date_naissance: formData.date_naissance || null,
        numero_securite_sociale: formData.numero_securite_sociale || null,
        adresse_postale: formData.adresse_postale || null,
        ville: formData.ville || null,
        code_postal: formData.code_postal || null,
        pays: formData.pays || null
      };

      let data, error;

      if (editingEmployee) {
        ({ data, error } = await supabase
          .from('rh_personnel')
          .update(employeeData)
          .eq('id', editingEmployee.id)
          .select());
      } else {
        ({ data, error } = await supabase
          .from('rh_personnel')
          .insert([employeeData])
          .select());
      }

      if (error) throw error;

      fetchEmployees();

      setFormData({
        photo_profil: '',
        prenom: '',
        nom: '',
        email: '',
        telephone: '',
        date_naissance: '',
        sexe: 'Non spécifié',
        numero_securite_sociale: '',
        adresse_postale: '',
        ville: '',
        code_postal: '',
        pays: '',
        statut: true
      });
      
      setShowForm(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setEditingEmployee(null);

      showToast({
        label: editingEmployee 
          ? `L'employé ${formData.prenom} ${formData.nom} a été modifié avec succès` 
          : `L'employé ${formData.prenom} ${formData.nom} a été ajouté avec succès`,
        icon: 'Check',
        color: '#10b981'
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : 'Une erreur est survenue',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'employé "${employee.prenom} ${employee.nom}" ?`)) {
      try {
        const { error } = await supabase
          .from('rh_personnel')
          .delete()
          .eq('id', employee.id);

        if (error) throw error;

        fetchEmployees();
        
        if (selectedEmployee && selectedEmployee.id === employee.id) {
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

  const handleContratSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      showToast({
        label: 'Aucun employé sélectionné',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }
    
    try {
      const contratData = {
        personnel_id: selectedEmployee.id,
        fonction_id: contratFormData.fonction_id || null,
        type_contrat_id: contratFormData.type_contrat_id || null,
        salaire_base: parseFloat(contratFormData.salaire_base),
        indemnites_re: parseFloat(contratFormData.indemnites_re),
        autres_couts: parseFloat(contratFormData.autres_couts),
        entite_payeur: contratFormData.entite_payeur || null,
        date_debut: contratFormData.date_debut,
        date_fin: contratFormData.date_fin || null,
        active: contratFormData.active
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
            fonction:fonction_id (nom),
            type_contrat:type_contrat_id (nom),
            entite:entite_payeur (code, libelle)
          `)
          .single());
      } else {
        // Mode création
        ({ data, error } = await supabase
          .from('rh_historique_contrat')
          .insert([contratData])
          .select(`
            *,
            fonction:fonction_id (nom),
            type_contrat:type_contrat_id (nom),
            entite:entite_payeur (code, libelle)
          `)
          .single());
      }

      if (error) throw error;

      if (editingContrat) {
        setHistoriqueContrats(prev => prev.map(c => c.id === editingContrat.id ? data : c));
        setEditingContrat(null);
        showToast({
          label: 'Contrat modifié avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setHistoriqueContrats(prev => [data, ...prev]);
        showToast({
          label: 'Contrat créé avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setShowContratModal(false);
      setContratFormData({
        fonction_id: '',
        type_contrat_id: '',
        salaire_base: '',
        indemnites_re: '0',
        autres_couts: '0',
        entite_payeur: '',
        date_debut: '',
        date_fin: '',
        active: true
      });
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingContrat ? 'modification' : 'création'} du contrat`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDeleteContrat = async (contrat: HistoriqueContrat) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      try {
        const { error } = await supabase
          .from('rh_historique_contrat')
          .delete()
          .eq('id', contrat.id);

        if (error) throw error;

        setHistoriqueContrats(prev => prev.filter(c => c.id !== contrat.id));
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

  const handleEditContrat = (contrat: HistoriqueContrat) => {
    setEditingContrat(contrat);
    setContratFormData({
      fonction_id: contrat.fonction_id || '',
      type_contrat_id: contrat.type_contrat_id || '',
      salaire_base: contrat.salaire_base.toString(),
      indemnites_re: contrat.indemnites_re.toString(),
      autres_couts: contrat.autres_couts.toString(),
      entite_payeur: contrat.entite_payeur || '',
      date_debut: contrat.date_debut,
      date_fin: contrat.date_fin || '',
      active: contrat.active
    });
    setShowContratModal(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    // Ouvrir les détails lors de la modification
    setIsDetailsOpen(true); 
    setFormData({
      photo_profil: employee.photo_profil || '',
      prenom: employee.prenom,
      nom: employee.nom,
      email: employee.email || '',
      telephone: employee.telephone || '',
      date_naissance: employee.date_naissance || '',
      sexe: employee.sexe || 'Non spécifié',
      numero_securite_sociale: employee.numero_securite_sociale || '',
      adresse_postale: employee.adresse_postale || '',
      ville: employee.ville || '',
      code_postal: employee.code_postal || '',
      pays: employee.pays || '',
      statut: employee.statut
    });
    setShowForm(true);
    
    // Prévisualiser la photo existante
    if (employee.photo_profil) {
      setPreviewUrl(employee.photo_profil);
    }
    
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const fetchContrats = async (employeeId: string) => {
    if (!employeeId) return;
    
    setLoadingContrats(true);
    try {
      const { data, error } = await supabase
        .from('rh_historique_contrat')
        .select(`
          *,
          fonction:fonction_id (nom),
          type_contrat:type_contrat_id (nom),
          entite:entite_payeur (code, libelle)
        `)
        .eq('personnel_id', employeeId)
        .order('date_debut', { ascending: false });

      if (error) throw error;
      setHistoriqueContrats(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des contrats:', err);
      showToast({
        label: 'Erreur lors du chargement des contrats',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoadingContrats(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      // Charger les entités
      const { data: entitesData, error: entitesError } = await supabase
        .from('entite')
        .select('id, code, libelle')
        .order('code');

      if (entitesError) throw entitesError;
      setEntites(entitesData || []);

      // Charger les fonctions
      const { data: fonctionsData, error: fonctionsError } = await supabase
        .from('rh_fonction')
        .select('*')
        .eq('active', true)
        .order('ordre_affichage', { ascending: true, nullsLast: true });

      if (fonctionsError) throw fonctionsError;
      setFonctions(fonctionsData || []);

      // Charger les types de contrat
      const { data: typesContratData, error: typesContratError } = await supabase
        .from('rh_type_contrat')
        .select('*')
        .eq('active', true)
        .order('ordre_affichage', { ascending: true, nullsLast: true });

      if (typesContratError) throw typesContratError;
      setTypesContrat(typesContratData || []);
    } catch (err) {
      console.error('Erreur lors du chargement des données de référence:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rh_personnel')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
      
      if (!selectedEmployee && data && data.length > 0) {
        setSelectedEmployee(data[0]);
        // Garder les détails fermés par défaut
        setIsDetailsOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.prenom} ${employee.nom}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      localStorage.setItem('employeeDetailsOpen', isDetailsOpen.toString());
    }
  }, [isDetailsOpen, selectedEmployee]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchContrats(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  useEffect(() => {
    if (selectedEmployee) {
      const savedState = localStorage.getItem('employeeDetailsOpen');
      if (savedState !== null) {
        setIsDetailsOpen(savedState === 'true');
      }
    }
  }, [selectedEmployee]);

  return (
    <>
      <PageSection
        title="Gestion des employés"
        description="Consultez et gérez les informations du personnel de l'entreprise"
      >
        {error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ width: '30%' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <div style={{ 
                  position: 'relative', 
                  flex: 1,
                  marginBottom: '1rem'
                }}>
                  <input
                    type="text"
                    placeholder="Rechercher un employé..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                      border: '2px solid var(--color-secondary)',
                      borderRadius: '0.375rem',
                      backgroundColor: 'var(--color-white)',
                      color: 'var(--color-text)',
                      fontSize: '0.875rem'
                    }}
                  />
                  <Search 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-light)'
                    }} 
                  />
                </div>
                <Button
                  label="Ajouter"
                  icon="UserPlus"
                  color={theme.colors.primary}
                  size="sm"
                  onClick={() => setShowForm(!showForm)}
                />
              </div>
              
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '0.5rem', 
                boxShadow: 'var(--shadow-md)', 
                overflow: 'hidden',
                maxHeight: '600px',
                overflowY: 'auto'
              }}>
                {loading ? (
                  <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '50%', 
                        border: '2px solid var(--color-primary)', 
                        borderTopColor: 'transparent', 
                        animation: 'spin 1s linear infinite' 
                      }}></div>
                      Chargement...
                    </div>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                    Aucun employé trouvé
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                          Nom et Prénom
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((employee) => (
                        <tr 
                          key={employee.id} 
                          onClick={() => setSelectedEmployee(employee)}
                          style={{ 
                            cursor: 'pointer',
                            backgroundColor: selectedEmployee?.id === employee.id ? 'rgba(59, 130, 246, 0.1)' : 'white',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {employee.photo_profil ? (
                                <img 
                                  src={employee.photo_profil} 
                                  alt={`${employee.prenom} ${employee.nom}`} 
                                  style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%', 
                                    objectFit: 'cover',
                                    border: '2px solid #e5e7eb'
                                  }}
                                />
                              ) : (
                                <div style={{ 
                                  width: '32px', 
                                  height: '32px', 
                                  borderRadius: '50%', 
                                  backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  color: theme.colors.primary
                                }}>
                                  <User size={16} />
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 500 }}>{`${employee.prenom} ${employee.nom}`}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            
            <div style={{ width: '70%' }}>
              {selectedEmployee ? (
                <>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    marginBottom: '1rem',
                    gap: '0.5rem'
                  }}>
                    <Button
                      label="Modifier"
                      icon="Pencil"
                      color={theme.colors.primary}
                      size="sm"
                      onClick={() => handleEdit(selectedEmployee)}
                    />
                    <Button
                      label="Supprimer"
                      icon="Trash2"
                      color="#ef4444"
                      size="sm"
                      onClick={() => handleDelete(selectedEmployee)}
                    />
                  </div>
                  
                  <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '0.5rem', 
                    boxShadow: 'var(--shadow-md)', 
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      padding: '1.5rem', 
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      gap: '1.5rem'
                    }}>
                      <div>
                        {selectedEmployee.photo_profil ? (
                          <img 
                            src={selectedEmployee.photo_profil} 
                            alt={`${selectedEmployee.prenom} ${selectedEmployee.nom}`} 
                            style={{ 
                              width: '120px', 
                              height: '120px', 
                              borderRadius: '50%', 
                              objectFit: 'cover',
                              border: '3px solid #e5e7eb'
                            }}
                          />
                        ) : (
                          <div style={{ 
                            width: '120px', 
                            height: '120px', 
                            borderRadius: '50%', 
                            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: theme.colors.primary,
                            border: '3px solid rgba(59, 130, 246, 0.2)'
                          }}>
                            <User size={60} />
                          </div>
                        )}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <h2 style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: 600, 
                          margin: '0 0 0.5rem 0',
                          color: 'var(--color-text)'
                        }}>
                          {selectedEmployee.prenom} {selectedEmployee.nom}
                        </h2>
                        
                        <div style={{ 
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          backgroundColor: selectedEmployee.statut ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: selectedEmployee.statut ? '#10b981' : '#ef4444',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          marginBottom: '1rem'
                        }}>
                          {selectedEmployee.statut ? 'Actif' : 'Inactif'}
                        </div>
                        
                        <button
                          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: theme.colors.primary,
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            marginTop: '0.5rem'
                          }}
                          aria-expanded={isDetailsOpen}
                          aria-controls="employee-details"
                        >
                          <span>{isDetailsOpen ? "Masquer les détails" : "Voir les détails"}</span>
                          <ChevronDown 
                            size={16} 
                            style={{ 
                              transform: isDetailsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s ease'
                            }} 
                          />
                        </button>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                          {selectedEmployee.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Mail size={16} style={{ color: theme.colors.primary }} />
                              <span>{selectedEmployee.email}</span>
                            </div>
                          )}
                          
                          {selectedEmployee.telephone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Phone size={16} style={{ color: theme.colors.primary }} />
                              <span>{selectedEmployee.telephone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      id="employee-details"
                      style={{ 
                        padding: '1.5rem',
                        maxHeight: isDetailsOpen ? '1000px' : '0',
                        opacity: isDetailsOpen ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        visibility: isDetailsOpen ? 'visible' : 'hidden'
                      }}
                    >
                      <h3 style={{ 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        margin: '0 0 1rem 0',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <User size={18} style={{ color: theme.colors.primary }} />
                        Informations personnelles
                      </h3>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '1rem',
                        marginBottom: '2rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>
                            Sexe
                          </div>
                          <div>
                            {selectedEmployee.sexe === 'M' ? 'Homme' : 
                             selectedEmployee.sexe === 'F' ? 'Femme' : 
                             'Non spécifié'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>
                            Date de naissance
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {selectedEmployee.date_naissance ? (
                              <>
                                <Calendar size={14} style={{ color: theme.colors.primary, opacity: 0.7 }} />
                                {new Date(selectedEmployee.date_naissance).toLocaleDateString('fr-FR')}
                                {` (${calculateAge(selectedEmployee.date_naissance)} ans)`}
                              </>
                            ) : (
                              <span style={{ color: 'var(--color-text-light)', fontStyle: 'italic' }}>Non renseignée</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>
                            Numéro de sécurité sociale
                          </div>
                          <div>
                            {selectedEmployee.numero_securite_sociale || (
                              <span style={{ color: 'var(--color-text-light)', fontStyle: 'italic' }}>Non renseigné</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <h3 style={{ 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        margin: '0 0 1rem 0',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <MapPin size={18} style={{ color: theme.colors.primary }} />
                        Adresse
                      </h3>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '1rem',
                        marginBottom: '2rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>
                            Adresse postale
                          </div>
                          <div>
                            {selectedEmployee.adresse_postale || (
                              <span style={{ color: 'var(--color-text-light)', fontStyle: 'italic' }}>Non renseignée</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>
                            Ville et code postal
                          </div>
                          <div>
                            {selectedEmployee.code_postal || selectedEmployee.ville ? (
                              <>
                                {selectedEmployee.code_postal && `${selectedEmployee.code_postal} `}
                                {selectedEmployee.ville}
                              </>
                            ) : (
                              <span style={{ color: 'var(--color-text-light)', fontStyle: 'italic' }}>Non renseignés</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>
                            Pays
                          </div>
                          <div>
                            {selectedEmployee.pays || (
                              <span style={{ color: 'var(--color-text-light)', fontStyle: 'italic' }}>Non renseigné</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <h3 style={{ 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        margin: '0 0 1rem 0',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Briefcase size={18} style={{ color: theme.colors.primary }} />
                        Informations professionnelles
                      </h3>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '1rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>
                            Téléphone professionnel
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={14} style={{ color: theme.colors.primary, opacity: 0.7 }} />
                            <span>{selectedEmployee.telephone || (
                              <span style={{ color: 'var(--color-text-light)', fontStyle: 'italic' }}>Non renseigné</span>
                            )}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>
                            Email professionnel
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={14} style={{ color: theme.colors.primary, opacity: 0.7 }} />
                            <span>{selectedEmployee.email || (
                              <span style={{ color: 'var(--color-text-light)', fontStyle: 'italic' }}>Non renseigné</span>
                            )}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Section Gestion contrat */}
                  <PageSection
                    subtitle={`Gestion contrat`}
                    description="Historique des contrats de l'employé"
                    style={{ marginTop: '1.5rem' }}
                  >
                    <div style={{ marginBottom: '1rem' }}>
                      <Button
                        label="Ajouter un contrat"
                        icon="Plus"
                        color={theme.colors.primary}
                        onClick={() => {
                          setEditingContrat(null);
                          setContratFormData({
                            fonction_id: '',
                            type_contrat_id: '',
                            salaire_base: '',
                            indemnites_re: '0',
                            autres_couts: '0',
                            entite_payeur: '',
                            date_debut: '',
                            date_fin: '',
                            active: true
                          });
                          setShowContratModal(true);
                        }}
                      />
                    </div>

                    {loadingContrats ? (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            border: '2px solid var(--color-primary)', 
                            borderTopColor: 'transparent', 
                            animation: 'spin 1s linear infinite' 
                          }}></div>
                          Chargement des contrats...
                        </div>
                      </div>
                    ) : historiqueContrats.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>
                        Aucun contrat trouvé pour cet employé.
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Code entité payeur</th>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Type de contrat</th>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Fonction</th>
                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Salaire de base</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historiqueContrats.map((contrat) => (
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
                                {contrat.entite ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Building size={16} style={{ color: theme.colors.primary }} />
                                    <span>{contrat.entite.code}</span>
                                  </div>
                                ) : '-'}
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                                {contrat.type_contrat?.nom || '-'}
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                                {contrat.fonction?.nom || '-'}
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                                {contrat.salaire_base.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </PageSection>
                </>
              ) : (
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '0.5rem',
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--color-text-light)'
                }}>
                  <User size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Sélectionnez un employé pour voir ses détails</p>
                </div>
              )}
            </div>
          </div>
        )}
      </PageSection>
      {/* Modal pour ajouter/modifier un contrat */}
      {showContratModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setShowContratModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                color: 'var(--color-text-light)',
                transition: 'all 0.2s'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
              {editingContrat ? 'Modifier le contrat' : 'Ajouter un contrat'}
            </h2>

            <Form size={100} onSubmit={handleContratSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="Entité payeur" required>
                  <select
                    name="entite_payeur"
                    value={contratFormData.entite_payeur}
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
                    <option value="">Sélectionner une entité</option>
                    {entites.map(entite => (
                      <option key={entite.id} value={entite.id}>
                        {entite.code} - {entite.libelle}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Type de contrat">
                  <select
                    name="type_contrat_id"
                    value={contratFormData.type_contrat_id}
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
                  >
                    <option value="">Sélectionner un type de contrat</option>
                    {typesContrat.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.nom}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Fonction">
                  <select
                    name="fonction_id"
                    value={contratFormData.fonction_id}
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
                  >
                    <option value="">Sélectionner une fonction</option>
                    {fonctions.map(fonction => (
                      <option key={fonction.id} value={fonction.id}>
                        {fonction.nom}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Salaire de base" required>
                  <FormInput
                    type="number"
                    name="salaire_base"
                    value={contratFormData.salaire_base}
                    onChange={handleContratInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </FormField>

                <FormField label="Indemnités repas">
                  <FormInput
                    type="number"
                    name="indemnites_re"
                    value={contratFormData.indemnites_re}
                    onChange={handleContratInputChange}
                    step="0.01"
                    min="0"
                  />
                </FormField>

                <FormField label="Autres coûts">
                  <FormInput
                    type="number"
                    name="autres_couts"
                    value={contratFormData.autres_couts}
                    onChange={handleContratInputChange}
                    step="0.01"
                    min="0"
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

                <FormField>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <input
                      type="checkbox"
                      name="active"
                      checked={contratFormData.active}
                      onChange={handleContratInputChange}
                      style={{ cursor: 'pointer' }}
                    />
                    <label>Actif</label>
                  </div>
                </FormField>
              </div>

              <FormActions>
                <Button
                  label="Annuler"
                  type="button"
                  icon="X"
                  color={theme.colors.secondary}
                  onClick={() => setShowContratModal(false)}
                />
                <Button
                  label={editingContrat ? "Modifier" : "Ajouter"}
                  type="submit"
                  icon={editingContrat ? "Save" : "Plus"}
                  color={theme.colors.primary}
                />
              </FormActions>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}

function calculateAge(dateString: string): number {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default EmployeesList;