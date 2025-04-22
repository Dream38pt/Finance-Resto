import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Finance from './pages/Finance';
import Profile from './pages/Profile';
import { BudgetView, BudgetCF, Invoice, NewInvoice } from './pages/finance';
import RevenueTracking from './pages/finance/RevenueTracking';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Budget from './pages/finance/Budget';
import Entity from './pages/settings/Entity';
import BankAccounts from './pages/settings/BankAccounts';
import BankMovementTypes from './pages/settings/BankMovementTypes';
import Employees from './pages/settings/Employees';
import Days from './pages/settings/Days';
import Import from './pages/settings/Import';
import TVA from './pages/settings/TVA';
import ServiceTypes from './pages/settings/ServiceTypes';
import PaymentMethods from './pages/settings/PaymentMethods';
import PurchaseCategories from './pages/settings/PurchaseCategories';
import Suppliers from './pages/settings/Suppliers';
import { MenuProvider } from './contexts/MenuContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MenuProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              <Route path="/finance" element={
                <ProtectedRoute>
                  <Finance />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<div>Tableau de bord</div>} />
                <Route path="invoice" element={<Invoice />} />
                <Route path="revenue" element={<RevenueTracking />} />
                <Route path="expenses" element={<div>Dépenses</div>} />
                <Route path="costs" element={<div>Coûts</div>} />
                <Route path="analytics" element={<div>Analyses</div>} />
                <Route path="budget" element={<Budget />} />
                <Route path="budget-cf" element={<BudgetCF />} />
                <Route path="budget-view" element={<BudgetView />} />
                <Route path="nouvelle-facture" element={<NewInvoice />} />
                <Route path="forecasts" element={<div>Prévisions</div>} />
              </Route>
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }>
                <Route path="entity" element={<Entity />} />
                <Route path="bank-accounts" element={<BankAccounts />} />
                <Route path="bank-movement-types" element={<BankMovementTypes />} />
                <Route path="employees" element={<Employees />} />
                <Route path="tva" element={<TVA />} />
                <Route path="service-types" element={<ServiceTypes />} />
                <Route path="payment-methods" element={<PaymentMethods />} />
                <Route path="purchase-categories" element={<PurchaseCategories />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="import" element={<Import />} />
                <Route path="days" element={<Days />} />
              </Route>
            </Routes>
          </Router>
        </MenuProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App