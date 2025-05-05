import React from 'react';
import { Home, Calculator, Eye, FileText, Receipt, BarChart2, DollarSign, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from './Header';

export function HeaderGestionFinanciere() {
  const navLinks = [
    {
      to: "/",
      label: "Accueil",
      icon: <Home size={18} />,
      separator: true
    },
    {
      to: "/finance/invoice",
      label: "Saisie Factures",
      icon: <Receipt size={18} />
    },
    {
      to: "/finance/revenue",
      label: "Suivi CA Réel",
      icon: <BarChart2 size={18} />
    },
    {
      to: "/finance/cash-closing",
      label: "Fermeture Caisse Jour",
      icon: <DollarSign size={18} />,
      separator: true
    },
    {
      to: "/finance/budget",
      label: "Budget CA",
      icon: <Calculator size={18} />
    },
    {
      to: "/finance/budget-cf",
      label: "Budget CF",
      icon: <FileText size={18} />
    },
    {
      to: "/finance/budget-view",
      label: "Visu du Budget CA",
      icon: <Eye size={18} />,
      separator: true
    },
    {
      to: "/financeSettings",
      label: "Paramètres GF",
      icon: <Settings size={18} />
    }
  ];

  return <Header title="Gestion Financière" navLinks={navLinks} showLogoutButton={false} />;
}