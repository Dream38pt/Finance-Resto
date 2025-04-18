import React from 'react';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme';

interface PieceJointeViewerProps {
  url: string;
  filename?: string;
  style?: React.CSSProperties;
  size?: number;
}

export function PieceJointeViewer({
  url,
  filename,
  style,
  size = 60
}: PieceJointeViewerProps) {
  if (!url) return null;

  const isImage = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
  };

  const isPdf = (url: string) => {
    return url.toLowerCase().endsWith('.pdf');
  };

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage
      .from('factures-achat')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const displayName = filename || url.split('/').pop();
  const fileUrl = getFileUrl(url);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', ...style }}>
      {isImage(url) ? (
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          title="Voir l'image"
        >
          <img
            src={fileUrl}
            alt={displayName}
            style={{
              height: size,
              maxWidth: size * 2,
              objectFit: 'cover',
              borderRadius: 6,
              boxShadow: '0 0 4px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
          />
        </a>
      ) : (
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          title="Voir ou télécharger la pièce jointe"
          style={{ color: theme.colors.primary }}
        >
          {isPdf(url) ? (
            <FileText size={size * 0.8} />
          ) : (
            <FileText size={size * 0.8} />
          )}
        </a>
      )}
    </div>
  );
}