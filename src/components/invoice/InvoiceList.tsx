import React from 'react';
import { FileText, Image } from 'lucide-react';
import { theme } from '../../theme';
import { Invoice } from '../../types/invoice';

interface InvoiceListProps {
  invoices: Invoice[];
}

export function InvoiceList({
  invoices
}: InvoiceListProps) {
  const isImage = (url: string) => {
    return url.match(/\.(jpg|jpeg|png|gif)$/i) !== null;
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
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
            <td colSpan={7} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
              Aucune facture trouvée.
            </td>
          </tr>
        ) : invoices.map((invoice) => (
          <tr key={invoice.id}>
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
                <a
                  href={invoice.lien_piece_jointe}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: theme.colors.primary }}
                >
                  {isImage(invoice.lien_piece_jointe) ? (
                    <Image size={16} />
                  ) : (
                    <FileText size={16} />
                  )}
                </a>
              ) : '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}