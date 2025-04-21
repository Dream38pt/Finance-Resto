import React, { useEffect, useState } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

interface ServiceCA {
  id: string;
  entite_id: string;
  entite: {
    code: string;
    libelle: string;
  };
  code_service_ca: string;
  libelle_service_ca: string;
  date_debut: string;
  date_fin: string | null;
  ordre_affich: number | null;
  heure_debut: string | null;
  heure_fin: string | null;
  created_at: string;
  updated_at: string;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

function ServiceTypes() {
  const [services, setServices] = useState<ServiceCA[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [editingService, setEditingService] = useState<ServiceCA | null>(null);
  const [formData, setFormData] = useState({
    entite_id: '',
    code_service_ca: '',
    libelle_service_ca: '',
    date_debut: '',
    date_fin: '',
    ordre_affichage: '',
    heure_debut: '',
    heure_fin: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Conversion du nom du champ ordre_affichage vers ordre_affich pour la base de données
      const serviceData: any = {
        entite_id: formData.entite_id,
        code_service_ca: formData.code_service_ca,
        libelle_service_ca: formData.libelle_service_ca,
        heure_debut: formData.heure_debut || null,
        heure_fin: formData.heure_fin || null,
        date_fin: formData.date_fin || null,
        date_debut: formData.date_debut,
        ordre_affich: formData.ordre_affichage ? parseInt(formData.ordre_affichage) : null
      };

      console.log('Données à envoyer:', serviceData);

      let data, error;

      if (editingService) {
        // Mode modification
        ({ data, error } = await supabase
          .from('ca_type_service')
          .update(serviceData)
          .eq('id', editingService.id)
          .select(`
            *,
            entite:entite_id (
              code,
              libelle
            )
          `)
          .single());
      } else {
        // Mode création
        ({ data, error } = await supabase
          .from('ca_type_service')
          .insert([serviceData])
          .select(`
            *,
            entite:entite_id (
              code,
              libelle
            )
          `)
          .single());
      }

      if (error) throw error;

      if (editingService) {
        setServices(prev => prev.map(s => s.id === editingService.id ? data : s));
        setEditingService(null);
        showToast({
          label: 'Service modifié avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      } else {
        setServices(prev => [...prev, data]);
        setShowForm(false);
        showToast({
          label: 'Service créé avec succès',
          icon: 'Check',
          color: '#10b981'
        });
      }

      setFormData({
        entite_id: '',
        code_service_ca: '',
        libelle_service_ca: '',
        date_debut: '',
        date_fin: '',
        ordre_affichage: '',
        heure_debut: '',
        heure_fin: ''
      });
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editingService ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const handleDelete = async (service: ServiceCA) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.libelle_service_ca}" ?`)) {
      try {
        const { error } = await supabase
          .from('ca_type_service')
          .delete()
          .eq('id', service.id);

        if (error) throw error;

        setServices(prev => prev.filter(s => s.id !== service.id));
        showToast({
          label: 'Service supprimé avec succès',
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

  const handleEdit = (service: ServiceCA) => {
    setEditingService(service);
    setFormData({
      entite_id: service.entite_id,
      code_service_ca: service.code_service_ca,
      libelle_service_ca: service.libelle_service_ca,
      date_debut: service.date_debut,
      date_fin: service.date_fin || '',
      ordre_affichage: service.ordre_affich !== null ? service.ordre_affich.toString() : '',
      heure_debut: service.heure_debut || '',
      heure_fin: service.heure_fin || ''
    });
    setShowForm(true);
    window.scrollTo(0, document.body.scrollHeight);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Chargement des services...');
        // Charger les entités
        const { data: entitesData, error: entitesError } = await supabase
          .from('entite')
          .select('id, code, libelle')
          .order('code');

        if (entitesError) throw entitesError;
        setEntites(entitesData);

        console.log('Chargement des types de service...');
        // Charger les services
        const { data: servicesData, error: servicesError } = await supabase
          .from('ca_type_service')
          .select(`
            *,
            entite:entite_id (
              code,
              libelle
            )
          `)
          .order('entite(code)', { ascending: true })
          .order('ordre_affich', { ascending: true, nullsLast: true })
          .order('code_service_ca', { ascending: true });

        if (servicesError) throw servicesError;
        console.log('Services chargés:', servicesData);
        setServices(servicesData);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
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
        title="Types de service CA"
        description="Chargement des données..."
      />
    );
  }

  if (error) {
    return (
      <PageSection
        title="Types de service CA"
        description={`Erreur: ${error}`}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Types de service CA"
        description="Liste des types de service pour le chiffre d'affaires"
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label={showForm ? "Masquer le formulaire" : "Créer un type de service"}
            icon={showForm ? "ChevronUp" : "Plus"}
            color={theme.colors.primary}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Entité</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Code</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Libellé</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date début</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date fin</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Heure début</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Heure fin</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Ordre</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Aucun type de service trouvé.
                </td>
              </tr>
            ) : services.map((service) => (
              <tr key={service.id}>
                <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEdit(service)}
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
                      onClick={() => handleDelete(service)}
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
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{service.entite.libelle}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                      {service.entite.code}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {service.code_service_ca}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {service.libelle_service_ca}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {new Date(service.date_debut).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {service.date_fin ? new Date(service.date_fin).toLocaleDateString('fr-FR') : '-'}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {service.heure_debut ? service.heure_debut.substring(0, 5).replace(':', 'h') : '-'}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                  {service.heure_fin ? service.heure_fin.substring(0, 5).replace(':', 'h') : '-'}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                  {service.ordre_affich || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageSection>

      {showForm && (
        <PageSection
          subtitle={editingService ? "Modifier un type de service" : "Nouveau type de service"}
          description={editingService ? "Modifier les informations du type de service" : "Créer un nouveau type de service"}
        >
          <Form size={50} onSubmit={handleSubmit}>
            <FormField label="Entité" required>
              <select
                name="entite_id"
                value={formData.entite_id}
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
                <option value="">Sélectionner une entité</option>
                {entites.map(entite => (
                  <option key={entite.id} value={entite.id}>
                    {entite.code} - {entite.libelle}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Code" required>
              <FormInput
                type="text"
                name="code_service_ca"
                value={formData.code_service_ca}
                onChange={handleInputChange}
                maxLength={12}
                placeholder="CODE123"
              />
            </FormField>

            <FormField label="Libellé" required>
              <FormInput
                type="text"
                name="libelle_service_ca"
                value={formData.libelle_service_ca}
                onChange={handleInputChange}
                maxLength={30}
                placeholder="Nom du service"
              />
            </FormField>

            <FormField label="Date de début" required>
              <FormInput
                type="date"
                name="date_debut"
                value={formData.date_debut}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField label="Date de fin">
              <FormInput
                type="date"
                name="date_fin"
                value={formData.date_fin}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField label="Heure de début">
              <FormInput
                type="time"
                name="heure_debut"
                value={formData.heure_debut}
                onChange={handleInputChange}
                placeholder="11:30"
              />
            </FormField>

            <FormField label="Heure de fin">
              <FormInput
                type="time"
                name="heure_fin"
                value={formData.heure_fin}
                onChange={handleInputChange}
                placeholder="14:30"
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

            <FormActions>
              <Button
                label="Annuler"
                type="button"
                icon="X"
                color={theme.colors.secondary}
                onClick={() => {
                  setShowForm(false);
                  setEditingService(null);
                  setFormData({
                    entite_id: '',
                    code_service_ca: '',
                    libelle_service_ca: '',
                    date_debut: '',
                    date_fin: '',
                    ordre_affichage: '',
                    heure_debut: '',
                    heure_fin: ''
                  });
                }}
              />
              <Button
                label={editingService ? "Modifier" : "Créer"}
                type="submit"
                icon={editingService ? "Save" : "Plus"}
                color={theme.colors.primary}
              />
            </FormActions>
          </Form>
        </PageSection>
      )}
    </>
  );
}

export default ServiceTypes;