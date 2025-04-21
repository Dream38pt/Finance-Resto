import React, { useState } from 'react';
import { PageSection } from '../../components/layout/page-layout';
import { Button } from '../../components/ui/button';
import { theme } from '../../theme';
import { ImportFacturesUploader } from '../../components/invoice/ImportFacturesUploader';

function Import() {
  const [showImportDialog, setShowImportDialog] = useState(false);

  return (
    <PageSection
      title="Import de données"
      description="Importez des données dans le système"
    >
      <div style={{ marginBottom: '1rem' }}>
        <Button
          label="Import Historique des facures achats"
          icon="Upload"
          color={theme.colors.primary}
          onClick={() => {
            setShowImportDialog(true);
          }}
        />
      </div>

      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
        <p>Cette page vous permet d'importer des données dans le système.</p>
        <p>Sélectionnez le type de données à importer et suivez les instructions.</p>
      </div>
      
      {/* Boîte de dialogue d'importation de factures */}
      <ImportFacturesUploader 
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImportComplete={() => {
          setShowImportDialog(false);
        }}
      />
    </PageSection>
  );
}

export default Import;