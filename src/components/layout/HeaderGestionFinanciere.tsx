import React from 'react';
import { Menu, ChevronLeft, ChevronRight, Home, Calculator, Eye, FileText, Receipt, BarChart2, LogOut } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import styles from './HeaderGestionFinanciere.module.css';

interface HeaderGestionFinanciereProps {
  title?: string;
}

export function HeaderGestionFinanciere({ title }: HeaderGestionFinanciereProps) {
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
          <h1 className={styles.title}>Gestion Financière</h1>
        </div>
        <nav className={styles.nav}>
          <Link to="/" className={styles.link}>
            <Home size={18} className={styles.icon} />
            <span className={styles.linkText}>Accueil</span>
          </Link>
          <div className={styles.separator} />
          <Link to="/finance/invoice" className={styles.link}>
            <Receipt size={18} className={styles.icon} />
            <span className={styles.linkText}>Saisie Factures</span>
          </Link>
          <Link to="/finance/revenue" className={styles.link}>
            <BarChart2 size={18} className={styles.icon} />
            <span className={styles.linkText}>Suivi CA Réel</span>
          </Link>
          <div className={styles.separator} />
          <Link to="/finance/budget" className={styles.link}>
            <Calculator size={18} className={styles.icon} />
            <span className={styles.linkText}>Budget CA</span>
          </Link>
          <Link to="/finance/budget-cf" className={styles.link}>
            <FileText size={18} className={styles.icon} />
            <span className={styles.linkText}>Budget CF</span>
          </Link>
          <Link to="/finance/budget-view" className={styles.link}>
            <Eye size={18} className={styles.icon} />
            <span className={styles.linkText}>Visu du Budget CA</span>
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