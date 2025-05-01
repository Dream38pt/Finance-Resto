import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { theme } from '../../theme';
import { BudgetCF, CategorieAchat } from '../../types/budget';

interface BudgetTableProps {
  budgets: BudgetCF[];
  categories: CategorieAchat[];
  onEdit: (budget: BudgetCF) => void;
  onDelete: (budget: BudgetCF) => void;
}

export function BudgetTable({
  budgets,
  categories,
  onEdit,
  onDelete
}: BudgetTableProps) {
  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Grouper les budgets par désignation
  const budgetsByDesignation = budgets.reduce((acc, budget) => {
    if (!acc[budget.designation]) {
      acc[budget.designation] = {
        designation: budget.designation,
        categorie_achat_id: budget.categorie_achat_id,
        ordre_affichage: budget.ordre_affichage,
        montants: Array(12).fill(0)
      };
    }
    acc[budget.designation].montants[budget.mois - 1] = budget.montant;
    return acc;
  }, {} as Record<string, { designation: string; categorie_achat_id: string | null; ordre_affichage: number; montants: number[] }>);

  // Convertir en tableau et trier par ordre d'affichage
  const groupedBudgets = Object.values(budgetsByDesignation)
    .sort((a, b) => a.ordre_affichage - b.ordre_affichage);

  // Calculer les totaux par mois
  const monthlyTotals = Array(12).fill(0);
  groupedBudgets.forEach(budget => {
    budget.montants.forEach((montant, index) => {
      monthlyTotals[index] += montant;
    });
  });

  // Calculer le total global
  const grandTotal = monthlyTotals.reduce((sum, montant) => sum + montant, 0);

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
      <thead>
        <tr>
          <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Désignation</th>
          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Catégorie</th>
          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem', width: '60px' }}>Ordre</th>
          {mois.map((moisNom, index) => (
            <th key={index} style={{ textAlign: 'right', padding: '4px', borderBottom: '2px solid #e5e7eb', fontSize: '0.75rem', width: '85px' }}>{moisNom}</th>
          ))}
          <th style={{ textAlign: 'right', padding: '4px', borderBottom: '2px solid #e5e7eb', fontSize: '0.75rem', width: '85px', backgroundColor: '#f3f4f6' }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {groupedBudgets.map((budget) => (
          <tr key={budget.designation}>
            <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={() => onEdit(budget as BudgetCF)}
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
                  onClick={() => onDelete(budget as BudgetCF)}
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
              {budget.designation}
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
              {categories.find(c => c.id === budget.categorie_achat_id)?.libelle || '-'}
            </td>
            <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right' }}>
              {budget.ordre_affichage}
            </td>
            {budget.montants.map((montant, index) => (
              <td key={index} style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right' }}>
                {montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </td>
            ))}
            <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', textAlign: 'right', backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
              {budget.montants.reduce((sum, montant) => sum + montant, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </td>
          </tr>
        ))}
        {groupedBudgets.length > 0 && (
          <tr>
            <td colSpan={4} style={{ 
              padding: '8px', 
              borderTop: '2px solid #e5e7eb',
              borderBottom: '2px solid #e5e7eb',
              fontSize: '0.875rem',
              fontWeight: 'bold', 
              textAlign: 'right'
            }}>
              Total :
            </td>
            {monthlyTotals.map((total, index) => (
              <td key={index} style={{ 
                padding: '4px', 
                borderTop: '2px solid #e5e7eb',
                borderBottom: '2px solid #e5e7eb',
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                textAlign: 'right' 
              }}>
                {total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </td>
            ))}
            <td style={{ 
              padding: '4px', 
              borderTop: '2px solid #e5e7eb',
              borderBottom: '2px solid #e5e7eb',
              fontSize: '0.75rem', 
              fontWeight: 'bold',
              textAlign: 'right',
              backgroundColor: '#f3f4f6'
            }}>
              {grandTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}