import React from 'react';
import { Home, Users, UserPlus, Settings } from 'lucide-react';
import { Header } from './Header';

export function HeaderGestionEmployes() {
  const navLinks = [
    {
      to: "/",
      label: "Accueil",
      icon: <Home size={18} />,
      separator: true
    },
    {
      to: "/employees/list",
      label: "Liste des employés",
      icon: <Users size={18} />
    },
    {
      to: "/employees/affectation",
      label: "Affectation",
      icon: <UserPlus size={18} />,
      separator: true
    },
    {
      to: "/employeesSettings",
      label: "Paramètres RH",
      icon: <Settings size={18} />
    }
  ];

  return <Header title="Gestion Employés" navLinks={navLinks} showLogoutButton={false} />;
}