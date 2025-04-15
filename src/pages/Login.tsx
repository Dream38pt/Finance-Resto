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
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    } catch (error) {
      showToast({
        label: error instanceof Error ? error.message : 'Erreur de connexion',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Finance-Resto"
      description="Connectez-vous pour accéder à l'application"
    >
      <Form onSubmit={handleSubmit}>
        <FormField label="Email" required>
          <FormInput
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="votre@email.com"
          />
        </FormField>
          
        <FormField label="Mot de passe" required>
          <FormInput
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
          />
        </FormField>
          
        <FormActions>
          <Button
            label={loading ? "Connexion en cours..." : "Se connecter"}
            type="submit"
            icon="LogIn"
            color={theme.colors.primary}
            disabled={loading}
          />
        </FormActions>
      </Form>
    </AuthLayout>
  );
}

export default Login