import React from 'react';
import { Menu, Building, Wallet, ChevronLeft, ChevronRight, Home, Coffee, Receipt, Calendar, Truck, Tags, CreditCard, ArrowLeftRight, Upload, LogOut } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import styles from './HeaderParametres.module.css';

interface HeaderParametresProps {
  title?: string;
}

export function HeaderParametres({ title }: HeaderParametresProps) {
  const { isExpanded, toggleMenu } = useMenu();
  const { showToast } = useToast();
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      showToast({
        label: 'Déconnexion réussie',
        icon: 'Check',
        color: '#10b981'
      });
    } catch (error) {
      showToast({
        label: 'Erreur lors de la déconnexion',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };
  
  return (
    <header className={`${styles.header} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Menu size={24} className={styles.icon} />
          <h1 className={styles.title}>Paramètrages</h1>
        </div>
        <nav className={styles.nav}>
          <Link to="/" className={styles.link}>
            <Home size={18} className={styles.icon} />
            <span className={styles.linkText}>Accueil</span>
          </Link>
          <Link to="/settings/entity" className={styles.link}>
            <Building size={18} className={styles.icon} />
            <span className={styles.linkText}>Entité</span>
          </Link>
          <Link to="/settings/bank-accounts" className={styles.link}>
            <Wallet size={18} className={styles.icon} />
            <span className={styles.linkText}>Comptes Bancaires</span>
          </Link>
          <Link to="/settings/bank-movement-types" className={styles.link}>
            <ArrowLeftRight size={18} className={styles.icon} />
            <span className={styles.linkText}>Types mouvement Bancaire</span>
          </Link>
          <Link to="/settings/service-types" className={styles.link}>
            <Coffee size={18} className={styles.icon} />
            <span className={styles.linkText}>Type de service CA</span>
          </Link>
          <Link to="/settings/tva" className={styles.link}>
            <Receipt size={18} className={styles.icon} />
            <span className={styles.linkText}>Paramètres TVA</span>
          </Link>
          <Link to="/settings/payment-methods" className={styles.link}>
            <CreditCard size={18} className={styles.icon} />
            <span className={styles.linkText}>Modes de paiement</span>
          </Link>
          <Link to="/settings/purchase-categories" className={styles.link}>
            <Tags size={18} className={styles.icon} />
            <span className={styles.linkText}>Catégories de dépenses</span>
          </Link>
          <Link to="/settings/suppliers" className={styles.link}>
            <Truck size={18} className={styles.icon} />
            <span className={styles.linkText}>Tiers</span>
          </Link>
          <Link to="/settings/days" className={styles.link}>
            <Calendar size={18} className={styles.icon} />
            <span className={styles.linkText}>Paramètres jours</span>
          </Link>
          <Link to="/settings/import" className={styles.link}>
            <Upload size={18} className={styles.icon} />
            <span className={styles.linkText}>Import</span>
          </Link>
        </nav>
        <button 
          className={styles.logoutButton}
          onClick={handleLogout}
          aria-label="Déconnexion"
        >
          <LogOut size={18} className={styles.icon} />
          <span className={styles.linkText}>Déconnexion</span>
        </button>
        <button 
          className={styles.toggleButton}
          onClick={toggleMenu}
          aria-label={isExpanded ? "Réduire le menu" : "Étendre le menu"}
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </header>
  );
}