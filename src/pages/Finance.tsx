import React from 'react';
import { Outlet } from 'react-router-dom';
import { FinanceLayout } from '../components/layout/finance-layout/finance-layout';

function Finance() {
  return (
    <FinanceLayout>
      <Outlet />
    </FinanceLayout>
  );
}

export default Finance;