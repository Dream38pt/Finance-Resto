import React from 'react';
import { Outlet } from 'react-router-dom';
import { SettingsLayout } from '../components/layout/settings-layout/settings-layout';

function Settings() {
  return (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  );
}

export default Settings;