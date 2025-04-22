import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthLayout } from '../components/layout/auth-layout';
import { Form, FormField, FormInput, FormActions } from '../components/ui/form';
import { Button } from '../components/ui/button';
import { useToast } from '../contexts/ToastContext';
import { theme } from '../theme';

function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Inscription
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        });

        if (signUpError) throw signUpError;
        
        if (authData.user) {
          // Créer l'entrée dans param_collaborateur
          const { error: collaborateurError } = await supabase
            .from('param_collaborateur')
            .insert([{
              auth_id: authData.user.id,
              nom: formData.nom,
              prenom: formData.prenom
            }]);
          
          if (collaborateurError) throw collaborateurError;
          
          showToast({
            label: 'Compte créé avec succès',
            icon: 'Check',
            color: '#10b981'
          });
          
          // Rediriger vers la page d'accueil
          navigate('/');
        }
      } else {
        // Connexion
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        navigate('/');
        showToast({
          label: 'Connexion réussie',
          icon: 'Check',
          color: '#10b981'
        });
      }
    } catch (error) {
      showToast({
        label: error instanceof Error ? error.message : `Erreur de ${isSignUp ? 'création de compte' : 'connexion'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    // Réinitialiser le formulaire lors du changement de mode
    setFormData({
      email: '',
      password: '',
      nom: '',
      prenom: ''
    });
  };

  return (
    <AuthLayout
      title="Finance-Resto"
      description={isSignUp ? "Créez un compte pour accéder à l'application" : "Connectez-vous pour accéder à l'application"}
    >
      <Form onSubmit={handleSubmit}>
        {isSignUp && (
          <>
            <FormField label="Nom" required>
              <FormInput
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                placeholder="Votre nom"
                required
              />
            </FormField>
            
            <FormField label="Prénom" required>
              <FormInput
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleInputChange}
                placeholder="Votre prénom"
                required
              />
            </FormField>
          </>
        )}
        
        <FormField label="Email" required>
          <FormInput
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="votre@email.com"
            required
          />
        </FormField>
          
        <FormField label="Mot de passe" required>
          <FormInput
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            required
          />
        </FormField>
          
        <FormActions>
          <Button
            label={loading ? (isSignUp ? "Création en cours..." : "Connexion en cours...") : (isSignUp ? "Créer un compte" : "Se connecter")}
            type="submit"
            icon={isSignUp ? "UserPlus" : "LogIn"}
            color={theme.colors.primary}
            disabled={loading}
          />
        </FormActions>
        
        <div style={{ 
          marginTop: '1.5rem', 
          textAlign: 'center', 
          fontSize: '0.875rem',
          color: 'var(--color-text-light)'
        }}>
          {isSignUp ? "Vous avez déjà un compte ?" : "Vous n'avez pas de compte ?"}{' '}
          <button
            type="button"
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.primary,
              cursor: 'pointer',
              fontWeight: 500,
              padding: 0
            }}
          >
            {isSignUp ? "Se connecter" : "Créer un compte"}
          </button>
        </div>
      </Form>
    </AuthLayout>
  );
}

export default Login