import React from 'react';
import { Outlet } from 'react-router-dom';
import { PageLayout } from '../components/layout/page-layout';
import { HeaderGestionBancaire } from '../components/layout/HeaderGestionBancaire';

function Bank() {
  return (
    <PageLayout header={<HeaderGestionBancaire />}>
      <Outlet />
    </PageLayout>
  );
}

export default Bank;