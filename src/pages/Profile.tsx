import React, { useState, useEffect } from 'react';
import { PageLayout, PageSection } from '../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../components/ui/form';
import { Button } from '../components/ui/button';
import { User, UserCircle, Mail, Phone, Calendar, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { theme } from '../theme';

interface UserProfile {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  created_at: string;
}

function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: ''
  });
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setLoading(true);
        
        // Récupérer l'utilisateur actuellement connecté
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Récupérer les informations du collaborateur
          const { data, error } = await supabase
            .from('param_collaborateur')
            .select('*')
            .eq('auth_id', user.id)
            .single();
          
          if (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            return;
          }
          
          if (data) {
            setProfile({
              id: data.id,
              nom: data.nom,
              prenom: data.prenom,
              email: user.email || '',
              created_at: data.created_at
            });
            
            setFormData({
              nom: data.nom,
              prenom: data.prenom
            });
          }
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('param_collaborateur')
        .update({
          nom: formData.nom,
          prenom: formData.prenom
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      // Mettre à jour le profil local
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          nom: formData.nom,
          prenom: formData.prenom
        };
      });
      
      setEditing(false);
      showToast({
        label: 'Profil mis à jour avec succès',
        icon: 'Check',
        color: '#10b981'
      });
    } catch (error) {
      showToast({
        label: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <PageSection
          title="Mon Profil"
          description="Chargement de vos informations..."
        />
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout>
        <PageSection
          title="Mon Profil"
          description="Impossible de charger votre profil. Veuillez vous reconnecter."
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageSection
        title="Mon Profil"
        description="Consultez et modifiez vos informations personnelles"
      >
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ 
            flex: '0 0 250px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ 
              width: '150px', 
              height: '150px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <UserCircle size={100} color="white" />
            </div>
            
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 600, 
              margin: '0 0 0.5rem 0',
              textAlign: 'center'
            }}>
              {profile.prenom} {profile.nom}
            </h2>
            
            <p style={{ 
              color: 'var(--color-text-light)', 
              margin: '0 0 1.5rem 0',
              textAlign: 'center'
            }}>
              Utilisateur
            </p>
            
            <Button
              label={editing ? "Annuler" : "Modifier le profil"}
              icon={editing ? "X" : "Edit"}
              color={editing ? theme.colors.secondary : theme.colors.primary}
              onClick={() => setEditing(!editing)}
            />
          </div>
          
          <div style={{ flex: '1 1 500px' }}>
            {editing ? (
              <Form size={100} onSubmit={handleSubmit}>
                <FormField label="Prénom" required>
                  <FormInput
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    placeholder="Votre prénom"
                  />
                </FormField>
                
                <FormField label="Nom" required>
                  <FormInput
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    placeholder="Votre nom"
                  />
                </FormField>
                
                <FormField label="Email" description="L'email ne peut pas être modifié">
                  <FormInput
                    type="email"
                    value={profile.email}
                    disabled
                  />
                </FormField>
                
                <FormActions>
                  <Button
                    label="Annuler"
                    type="button"
                    icon="X"
                    color={theme.colors.secondary}
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        nom: profile.nom,
                        prenom: profile.prenom
                      });
                    }}
                  />
                  <Button
                    label="Enregistrer"
                    type="submit"
                    icon="Save"
                    color={theme.colors.primary}
                  />
                </FormActions>
              </Form>
            ) : (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '0.5rem', 
                padding: '1.5rem',
                boxShadow: 'var(--shadow-md)'
              }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 600, 
                  marginTop: 0,
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <User size={20} color={theme.colors.primary} />
                  Informations personnelles
                </h3>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <User size={18} color={theme.colors.primary} />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                        Nom complet
                      </p>
                      <p style={{ margin: 0, fontWeight: 500 }}>
                        {profile.prenom} {profile.nom}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Mail size={18} color={theme.colors.primary} />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                        Email
                      </p>
                      <p style={{ margin: 0, fontWeight: 500 }}>
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Calendar size={18} color={theme.colors.primary} />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                        Membre depuis
                      </p>
                      <p style={{ margin: 0, fontWeight: 500 }}>
                        {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    label="Modifier"
                    icon="Edit"
                    color={theme.colors.primary}
                    onClick={() => setEditing(true)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </PageSection>
    </PageLayout>
  );
}

export default Profile;