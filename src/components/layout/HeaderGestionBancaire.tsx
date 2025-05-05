import React from 'react';
import { CreditCard, ArrowUpDown, Upload, Settings, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from './Header';

export function HeaderGestionBancaire() {
  const navLinks = [
    {
      to: "/",
      label: "Accueil",
      icon: <Home size={18} />,
      separator: true
    },
    {
      to: "/bank/movements",
      label: "Mouvements bancaires",
      icon: <ArrowUpDown size={18} />
    },
    {
      to: "/bank/import",
      label: "Import relevés",
      icon: <Upload size={18} />,
      separator: true
    },
    {
      to: "/bank/cards",
      label: "Cartes bancaires",
      icon: <CreditCard size={18} />
    },
    {
      to: "/bankSettings",
      label: "Paramètres",
      icon: <Settings size={18} />,
      separator: true
    }
  ];

  return <Header title="Gestion Bancaire" navLinks={navLinks} showLogoutButton={false} />;
}