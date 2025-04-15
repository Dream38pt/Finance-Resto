import React from 'react';
import { Menu, Home, Info, Settings, Mail, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string; 
}

export function Header({ title }: HeaderProps) {
  const { isExpanded, toggleMenu } = useMenu();
  const location = useLocation();
  
  const getTitle = () => {
    switch (location.pathname) {
      case '/settings':
        return 'Paramètrages';
      default:
        return 'Finance-Resto';
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
          <Link to="/about" className={styles.link}>
            <Info size={20} className={styles.icon} />
            <span className={styles.linkText}>À propos</span>
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