import React, { useState } from 'react';
import { FileText, Image, X } from 'lucide-react';
import { Button } from '../ui/button';
import { theme } from '../../theme';
import { useToast } from '../../contexts/ToastContext';

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  currentFileName?: string;
}

export function FileUploadDialog({
  isOpen,
  onClose,
  onUpload,
  currentFileName
}: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { showToast } = useToast();

  const validateFile = (file: File): boolean => {
    // Vérification de l'extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'xls', 'xlsx'];
    
    if (!fileExt || !allowedExts.includes(fileExt)) {
      showToast({
        label: 'Type de fichier non autorisé. Formats acceptés : PDF, JPEG, PNG, DOC, XLS',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return false;
    }

    // Vérification de la taille
    const maxSize = 10 * 1024 * 1024; // 10 Mo
    if (file.size > maxSize) {
      showToast({
        label: 'Le fichier est trop volumineux (maximum 10 Mo)',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return false;
    }

    return true;
  };

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      if (validateFile(selectedFile)) {
        onUpload(selectedFile);
      }
    }
  };

  const isImage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext === 'jpg' || ext === 'jpeg' || ext === 'png';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            color: 'var(--color-text-light)',
            transition: 'all 0.2s'
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
          Ajouter une pièce jointe
        </h2>

        {currentFileName && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Fichier actuel : {currentFileName}
            </p>
          </div>
        )}

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? theme.colors.primary : '#e5e7eb'}`,
            borderRadius: '0.5rem',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
            transition: 'all 0.2s',
            marginBottom: '1rem'
          }}
        >
          <label
            style={{
              cursor: 'pointer',
              display: 'block',
              marginBottom: '0.5rem'
            }}
          >
            {selectedFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {isImage(selectedFile.name) ? (
                  <Image size={24} style={{ color: theme.colors.primary }} />
                ) : (
                  <FileText size={24} style={{ color: theme.colors.primary }} />
                )}
                <span>{selectedFile.name}</span>
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  Glissez et déposez un fichier ici, ou
                </p>
                <div style={{ position: 'relative' }}>
                  <Button
                    label="Parcourir"
                    color={theme.colors.primary}
                    type="button"
                  />
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.xls,.xlsx"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </>
            )}
          </label>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
            PDF, JPEG, PNG, DOC, XLS • Max 10 Mo
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Button
            label="Annuler"
            color={theme.colors.secondary}
            onClick={onClose}
          />
          <Button
            label="Ajouter"
            color={theme.colors.primary}
            onClick={handleSubmit}
            disabled={!selectedFile}
          />
        </div>
      </div>
    </div>
  );
}