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
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Restaurant</th>
          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Fournisseur</th>
          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Date</th>
          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>N° Document</th>
          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Montant TTC</th>
          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Mode paiement</th>
          <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Pièce jointe</th>
        </tr>
      </thead>
      <tbody>
        {invoices.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
              Aucune facture trouvée.
            </td>
          </tr>
        ) : invoices.map((invoice) => (
          <tr key={invoice.id}>
            <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
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
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{invoice.entite?.libelle}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                  {invoice.entite?.code}
                </span>
              </div>
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{invoice.tiers?.nom}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                  {invoice.tiers?.code}
                </span>
              </div>
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
              {new Date(invoice.date_facture).toLocaleDateString('fr-FR')}
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
              {invoice.numero_document || '-'}
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
              {invoice.montant_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{invoice.mode_paiement?.libelle}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                  {invoice.mode_paiement?.code}
                </span>
              </div>
            </td>
            <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'center' }}>
              {invoice.lien_piece_jointe ? (
                <PieceJointeViewer 
                  url={invoice.lien_piece_jointe} 
                  size={40}
                />
              ) : '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}