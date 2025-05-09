import React from 'react';
import { Outlet } from 'react-router-dom';
import { BankLayout } from '../components/layout/bank-layout';

function Bank() {
  return (
    <BankLayout>
      <Outlet />
    </BankLayout>
  );
}

export default Bank;