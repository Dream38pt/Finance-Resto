import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { PageLayout } from '../../components/layout/page-layout';
import { HeaderGestionBancaireParam } from '../../components/layout/HeaderGestionBancaireParam';

function BankSettings() {
  const location = useLocation();
  const exactPath = location.pathname === '/bankSettings';
  
  return (
    <PageLayout header={<HeaderGestionBancaireParam />}>
      <Outlet />
      {/* Rediriger vers la page des formats d'importation si on est exactement sur /bankSettings */}
      {exactPath && (
        <Navigate to="/bankSettings/import-formats" replace />
      )}
    </PageLayout>
  );
}

export default BankSettings;