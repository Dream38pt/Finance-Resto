import React from 'react';
import { Menu, Home, Settings, Mail, ChevronLeft, ChevronRight, Wallet, LogOut, UserCircle } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string; 
}

export function Header({ title }: HeaderProps) {
  const { isExpanded, toggleMenu } = useMenu();
  const location = useLocation();
  const { showToast } = useToast();
  
  const getTitle = () => {
    switch (location.pathname) {
      case '/settings':
        return 'Paramètrages';
      default:
        return 'Finance-Resto';
    }
  };
  
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
          <h1 className={styles.title}>{title || getTitle()}</h1>
        </div>
        <nav className={styles.nav}>
          <Link to="/" className={styles.link}>
            <Home size={20} className={styles.icon} />
            <span className={styles.linkText}>Accueil</span>
          </Link>
          <Link to="/profile" className={styles.link}>
            <UserCircle size={20} className={styles.icon} />
            <span className={styles.linkText}>Mon Profil</span>
          </Link>
          <Link to="/settings" className={styles.link}>
            <Settings size={20} className={styles.icon} />
            <span className={styles.linkText}>Paramètres</span>
          </Link>
          <Link to="/finance" className={styles.link}>
            <Wallet size={20} className={styles.icon} />
            <span className={styles.linkText}>Gestion Financière</span>
          </Link>
          <Link to="/contact" className={styles.link}>
            <Mail size={20} className={styles.icon} />
            <span className={styles.linkText}>Contact</span>
          </Link>
        </nav>
        <button 
          className={styles.logoutButton}
          onClick={handleLogout}
          aria-label="Déconnexion"
        >
          <LogOut size={20} />
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