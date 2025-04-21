import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { theme } from '../../theme';
import { Invoice } from '../../types/invoice';
import { PieceJointeViewer } from './PieceJointeViewer';

interface InvoiceListProps {
  invoices: Invoice[];
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
}

export function InvoiceList({
  invoices,
  onEdit,
  onDelete
}: InvoiceListProps) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
      <thead>
        <tr>
          <td style={{ 
            textAlign: 'left', 
            padding: '4px 8px', 
            fontSize: '0.7rem', 
            color: 'var(--color-text-light)',
            fontStyle: 'italic'
          }}>
            {invoices.length} facture(s)
          </td>
          <td colSpan={7}></td>
        </tr>
        <tr>
          <th style={{ width: '60px', padding: '6px', borderBottom: '2px solid #e5e7eb' }}></th>
          <th style={{ textAlign: 'left', padding: '6px', borderBottom: '2px solid #e5e7eb', fontSize: '0.8rem' }}>Restaurant</th>
          <th style={{ textAlign: 'left', padding: '6px', borderBottom: '2px solid #e5e7eb', fontSize: '0.8rem' }}>Fournisseur</th>
          <th style={{ textAlign: 'left', padding: '6px', borderBottom: '2px solid #e5e7eb', fontSize: '0.8rem' }}>Date</th>
          <th style={{ textAlign: 'left', padding: '6px', borderBottom: '2px solid #e5e7eb', fontSize: '0.8rem' }}>N° Document</th>
          <th style={{ textAlign: 'right', padding: '6px', borderBottom: '2px solid #e5e7eb', fontSize: '0.8rem' }}>Montant TTC</th>
          <th style={{ textAlign: 'left', padding: '6px', borderBottom: '2px solid #e5e7eb', fontSize: '0.8rem' }}>Mode paiement</th>
          <th style={{ textAlign: 'center', padding: '6px', borderBottom: '2px solid #e5e7eb', fontSize: '0.8rem' }}>Pièce</th>
        </tr>
      </thead>
      <tbody>
        {invoices.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ padding: '6px', textAlign: 'center', fontSize: '0.8rem' }}>
              Aucune facture trouvée.
            </td>
          </tr>
        ) : invoices.map((invoice) => (
          <tr key={invoice.id}>
            <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {onEdit && (
                  <button
                    onClick={() => onEdit(invoice)}
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
                    onClick={() => onDelete(invoice)}
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
            <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{invoice.entite?.libelle}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>
                  {invoice.entite?.code}
                </span>
              </div>
            </td>
            <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{invoice.tiers?.nom}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>
                  {invoice.tiers?.code}
                </span>
              </div>
            </td>
            <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem' }}>
              {new Date(invoice.date_facture).toLocaleDateString('fr-FR')}
            </td>
            <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem' }}>
              {invoice.numero_document || '-'}
            </td>
            <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem', textAlign: 'right' }}>
              {invoice.montant_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </td>
            <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{invoice.mode_paiement?.libelle}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>
                  {invoice.mode_paiement?.code}
                </span>
              </div>
            </td>
            <td style={{ padding: '4px', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem', textAlign: 'center' }}>
              {invoice.lien_piece_jointe ? (
                <PieceJointeViewer 
                  url={invoice.lien_piece_jointe} 
                  size={30}
                />
              ) : '-'}
            </td>
          </tr>
        ))}
      </tbody>
      {invoices.length > 0 && (
        <tfoot>
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
              {invoices.reduce((sum, invoice) => sum + invoice.montant_ttc, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </td>
            <td colSpan={2} style={{ padding: '8px', borderTop: '2px solid #e5e7eb' }}></td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}