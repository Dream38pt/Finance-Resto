import React from 'react';
import { Menu, ChevronLeft, ChevronRight, Home, LogOut, FileType } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import styles from './HeaderGestionBancaireParam.module.css';

interface HeaderGestionBancaireParamProps {
  title?: string;
}

export function HeaderGestionBancaireParam({ title }: HeaderGestionBancaireParamProps) {
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
          <h1 className={styles.title}>Paramètres Bancaire</h1>
        </div>
        <nav className={styles.nav}>
          <Link to="/" className={styles.link}>
            <Home size={18} className={styles.icon} />
            <span className={styles.linkText}>Accueil</span>
          </Link>
          
          <div className={styles.separator} />
          
          <Link 
            to="/bank/settings/import-formats" 
            className={styles.link}
          >
            <FileType size={18} className={styles.icon} />
            <span className={styles.linkText}>Formats d'importation</span>
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