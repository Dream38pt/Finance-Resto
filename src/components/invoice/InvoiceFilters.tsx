import React from 'react';
import { Form, FormField } from '../ui/form';
import { Button } from '../ui/button';
import { theme } from '../../theme';
import { Entite } from '../../types/budget';

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

export function InvoiceFilters({
  entites,
  filters,
  setFilters,
  onSearch
}: InvoiceFiltersProps) {
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
            {entites?.map(entite => (
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