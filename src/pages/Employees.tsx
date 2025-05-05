import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PageLayout } from '../components/layout/page-layout';
import { PageSection } from '../components/layout/page-layout';
import { HeaderGestionEmployes } from '../components/layout/HeaderGestionEmployes';

function Employees() {
  const location = useLocation();
  const isRootPath = location.pathname === '/employees';
  
  return (
    <PageLayout header={<HeaderGestionEmployes />}>
      {isRootPath ? (
        <PageSection
          title="Gestion des employés"
          description="Utilisez le menu de gauche pour accéder aux différentes fonctionnalités."
        />
      ) : (
        <Outlet />
      )}
    </PageLayout>
  );
}

export default Employees;