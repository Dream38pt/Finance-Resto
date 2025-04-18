import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { theme } from '../../theme';
import { InvoiceLine } from '../../types/invoice';

interface InvoiceLinesListProps {
  lines: InvoiceLine[];
  onEdit?: (line: InvoiceLine) => void;
  onDelete?: (line: InvoiceLine) => void;
}

export function InvoiceLinesList({
  lines,
  onEdit,
  onDelete
}: InvoiceLinesListProps) {  
  // Calculer les totaux
  const totals = lines.reduce((acc, line) => ({
    montant_ht: acc.montant_ht + line.montant_ht,
    montant_tva: acc.montant_tva + line.montant_tva
  }), { montant_ht: 0, montant_tva: 0 });

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem' }}>
      <thead>
        <tr>
          <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Catégorie</th>
          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Désignation</th>
          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Quantité</th>
          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Prix unitaire HT</th>
          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Montant HT</th>
          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Montant TVA</th>
          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Commentaire</th>
        </tr>
      </thead>
      <tbody>
        {lines.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
              Aucune ligne trouvée.
            </td>
          </tr>
        ) : lines.map((line) => (
          <tr key={line.id}>
            <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {onEdit && (
                  <button
                    onClick={() => onEdit(line)}
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
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(line)}
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
                )}
              </div>
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
              {line.categorie?.libelle}
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
              {line.designation}
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
              {line.quantite.toLocaleString('fr-FR')}
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
              {line.prix_unitaire_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
              {line.montant_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
              {line.montant_tva.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
              {line.commentaire || '-'}
            </td>
          </tr>
        ))}
        {lines.length > 0 && (
          <tr>
            <td colSpan={5} style={{ 
              padding: '8px', 
              borderTop: '2px solid #e5e7eb',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              textAlign: 'right' 
            }}>
              Total :
            </td>
            <td style={{ 
              padding: '8px', 
              borderTop: '2px solid #e5e7eb',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              textAlign: 'right' 
            }}>
              {totals.montant_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </td>
            <td style={{ 
              padding: '8px', 
              borderTop: '2px solid #e5e7eb',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              textAlign: 'right' 
            }}>
              {totals.montant_tva.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </td>
            <td style={{ padding: '8px', borderTop: '2px solid #e5e7eb' }}></td>
          </tr>
        )}
      </tbody>
    </table>
  );
}