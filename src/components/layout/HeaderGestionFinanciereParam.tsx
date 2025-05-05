import React from 'react';
import { Home, Calculator, FileText, Receipt, BarChart2, Settings } from 'lucide-react';
import { Header } from './Header';

export function HeaderGestionFinanciereParam() {
  const navLinks = [
    {
      to: "/",
      label: "Accueil",
      icon: <Home size={18} />,
      separator: true
    }
  ];

  return <Header title="Paramètres Gestion Financière" navLinks={navLinks} showLogoutButton={false} />;
}