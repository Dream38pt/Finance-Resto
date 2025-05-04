import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { EmployeesLayout } from '../components/layout/employees-layout';
import { PageSection } from '../components/layout/page-layout';

function Employees() {
  const location = useLocation();
  const isRootPath = location.pathname === '/employees';
  
  return (
    <EmployeesLayout>
      {isRootPath ? (
        <PageSection
          title="Gestion des employés"
          description="Utilisez le menu de gauche pour accéder aux différentes fonctionnalités."
        />
      ) : (
        <Outlet />
      )}
    </EmployeesLayout>
  );
}

export default Employees;