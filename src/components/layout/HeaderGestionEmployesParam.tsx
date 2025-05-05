import React from 'react';
import { Home, Users } from 'lucide-react';
import { Header } from './Header';

export function HeaderGestionEmployesParam() {
  const navLinks = [
    {
      to: "/",
      label: "Accueil",
      icon: <Home size={18} />,
      separator: true
    },
    {
      to: "/employees",
      label: "Gestion Employés",
      icon: <Users size={18} />
    }
  ];

  return <Header title="Paramétrages RH" navLinks={navLinks} showLogoutButton={false} />;
}