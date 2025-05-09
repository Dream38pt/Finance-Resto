import React, { ReactNode } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';

function BankSettings() {
  const location = useLocation();
  const exactPath = location.pathname === '/bank/settings';
  
  return (
    <>
      <Outlet />
      {/* Rediriger vers la page des formats d'importation si on est exactement sur /bank/settings */}
      {exactPath && (
        <Navigate to="/bank/settings/import-formats" replace />
      )}
    </>
  );
}

export default BankSettings;