import React from 'react';
import { Building, Wallet, Home, Coffee, Receipt, Calendar, Truck, Tags, CreditCard, ArrowLeftRight, Upload } from 'lucide-react';
import { Header } from './Header';

export function HeaderParametres() {
  const navLinks = [
    {
      to: "/",
      label: "Accueil",
      icon: <Home size={18} />,
      separator: true
    },
    {
      to: "/settings/entity",
      label: "Entité",
      icon: <Building size={18} />
    },
    {
      to: "/settings/bank-accounts",
      label: "Comptes Bancaires",
      icon: <Wallet size={18} />
    },
    {
      to: "/settings/bank-movement-types",
      label: "Types mouvement Bancaire",
      icon: <ArrowLeftRight size={18} />,
      separator: true
    },
    {
      to: "/settings/service-types",
      label: "Type de service CA",
      icon: <Coffee size={18} />
    },
    {
      to: "/settings/tva",
      label: "Paramètres TVA",
      icon: <Receipt size={18} />
    },
    {
      to: "/settings/payment-methods",
      label: "Modes de paiement",
      icon: <CreditCard size={18} />,
      separator: true
    },
    {
      to: "/settings/purchase-categories",
      label: "Catégories de dépenses",
      icon: <Tags size={18} />
    },
    {
      to: "/settings/suppliers",
      label: "Tiers",
      icon: <Truck size={18} />
    },
    {
      to: "/settings/days",
      label: "Paramètres jours",
      icon: <Calendar size={18} />,
      separator: true
    },
    {
      to: "/settings/import",
      label: "Import",
      icon: <Upload size={18} />
    }
  ];

  return <Header title="Paramètrages" navLinks={navLinks} showLogoutButton={false} />;
}