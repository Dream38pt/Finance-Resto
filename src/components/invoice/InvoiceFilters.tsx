import React, { useEffect, useState } from 'react';
import { Form, FormField } from '../ui/form';
import { Button } from '../ui/button';
import { theme } from '../../theme';
import { Entite } from '../../types/budget';
import { supabase } from '../../lib/supabase';

interface InvoiceFiltersProps {
  entites: Entite[];
  filters: {
    entite_id: string;
    annee: number;
    mois: string;
  };
  setFilters: (filters: any) => void;
  onSearch: () => void;
}

interface UserEntiteAccess {
  entite_id: string;
}

export function InvoiceFilters({
  entites,
  filters,
  setFilters,
  onSearch
}: InvoiceFiltersProps) {
  const [userEntites, setUserEntites] = useState<UserEntiteAccess[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUserEntiteAccess() {
      try {
        setLoading(true);
        
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        // Vérifier si l'utilisateur est un administrateur (a le rôle admin)
        const { data: collaborateur } = await supabase
          .from('param_collaborateur')
          .select('id, role_id, param_role:role_id(libelle)')
          .eq('auth_id', user.id)
          .single();
        
        if (collaborateur?.param_role?.libelle === 'Administrateur') {
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        // Récupérer les entités auxquelles l'utilisateur a accès
        if (collaborateur) {
          const { data: habilitations } = await supabase
            .from('param_habilitation')
            .select('entite_id')
            .eq('collaborateur_id', collaborateur.id)
            .eq('est_actif', true)
            .gte('date_debut', new Date().toISOString())
            .or(`date_fin.is.null,date_fin.gte.${new Date().toISOString()}`);
          
          if (habilitations) {
            setUserEntites(habilitations);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des habilitations:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserEntiteAccess();
  }, []);

  // Filtrer les entités selon les habilitations de l'utilisateur
  const filteredEntites = isAdmin 
    ? entites 
    : entites.filter(entite => userEntites.some(access => access.entite_id === entite.id));

  const mois = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  return (
    <Form size={100} style={{ margin: 0 }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
        <FormField label="Restaurant">
          <select
            value={filters.entite_id}
            onChange={(e) => setFilters({ ...filters, entite_id: e.target.value })}
            disabled={loading}
            style={{
              width: '180px',
              padding: '0.625rem 0.75rem',
              border: '2px solid var(--color-secondary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-text)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Tous les restaurants</option>
            {filteredEntites.map(entite => (
              <option key={entite.id} value={entite.id}>
                {entite.code} - {entite.libelle}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Année">
          <input
            type="number"
            value={filters.annee}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value >= 1900 && value <= 9999) {
                setFilters({ ...filters, annee: value });
              }
            }}
            min="1900"
            max="9999"
            style={{
              width: '100px',
              padding: '0.625rem 0.75rem',
              border: '2px solid var(--color-secondary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-text)',
              fontSize: '0.875rem'
            }}
          />
        </FormField>

        <FormField label="Mois">
          <select
            value={filters.mois}
            onChange={(e) => setFilters({ ...filters, mois: e.target.value })}
            style={{
              width: '120px',
              padding: '0.625rem 0.75rem',
              border: '2px solid var(--color-secondary)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-text)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Tous les mois</option>
            {mois.map(m => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </FormField>

        <Button
          label="Rechercher"
          icon="Search"
          color={theme.colors.primary}
          onClick={onSearch}
          size="sm"
        />
      </div>
    </Form>
  );
}