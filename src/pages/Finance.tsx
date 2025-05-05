import React from 'react';
import { Outlet } from 'react-router-dom';
import { PageLayout } from '../components/layout/page-layout';
import { HeaderGestionFinanciere } from '../components/layout/HeaderGestionFinanciere';

function Finance() {
  return (
    <PageLayout header={<HeaderGestionFinanciere />}>
      <Outlet />
    </PageLayout>
  );
}

export default Finance;