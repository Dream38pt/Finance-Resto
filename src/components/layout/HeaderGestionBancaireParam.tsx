import React from 'react';
import { Home, FileType, CreditCard, FileOutput } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from './Header';

export function HeaderGestionBancaireParam() {
  const navLinks = [
    {
      to: "/bank",
      label: "Accueil",
      icon: <Home size={18} />,
      separator: true
    },
    {
      to: "/bankSettings/bank-accounts",
      label: "Comptes Bancaires",
      icon: <CreditCard size={18} />
    },
    {
      to: "/bankSettings/import-formats",
      label: "Format d'importation",
      icon: <FileType size={18} />
    },
    {
      to: "/bankSettings/import-processing",
      label: "Traitement Import",
      icon: <FileOutput size={18} />
    }
  ];

  return <Header title="Paramétrage Bancaire" navLinks={navLinks} showLogoutButton={false} />;
}