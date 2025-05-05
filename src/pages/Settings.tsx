import React from 'react';
import { Outlet } from 'react-router-dom';
import { PageLayout } from '../components/layout/page-layout';
import { HeaderParametres } from '../components/layout/HeaderParametres';

function Settings() {
  return (
    <PageLayout header={<HeaderParametres />}>
      <Outlet />
    </PageLayout>
  );
}

export default Settings;