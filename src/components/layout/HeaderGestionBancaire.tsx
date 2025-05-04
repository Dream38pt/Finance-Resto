import React from 'react';
import { Menu, ChevronLeft, ChevronRight, Home, CreditCard, ArrowUpDown, Upload, Settings } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import { Link } from 'react-router-dom';
import styles from './HeaderGestionBancaire.module.css';

interface HeaderGestionBancaireProps {
  title?: string;
}

export function HeaderGestionBancaire({ title }: HeaderGestionBancaireProps) {
  const { isExpanded, toggleMenu } = useMenu();
  
  return (
    <header className={`${styles.header} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Menu size={24} className={styles.icon} />
          <h1 className={styles.title}>Gestion Bancaire</h1>
        </div>
        <nav className={styles.nav}>
          <Link to="/" className={styles.link}>
            <Home size={18} className={styles.icon} />
            <span className={styles.linkText}>Accueil</span>
          </Link>
          
          <div className={styles.separator} />
          
          <Link to="/bank/movements" className={styles.link}>
            <ArrowUpDown size={18} className={styles.icon} />
            <span className={styles.linkText}>Mouvements bancaires</span>
          </Link>
          
          <div className={styles.separator} />
          
          <Link to="/bank/import" className={styles.link}>
            <Upload size={18} className={styles.icon} />
            <span className={styles.linkText}>Import relevés</span>
          </Link>
          
          <Link to="/bank/cards" className={styles.link}>
            <CreditCard size={18} className={styles.icon} />
            <span className={styles.linkText}>Cartes bancaires</span>
          </Link>
          
          <div className={styles.separator} />
          
          <Link to="/bank/settings" className={styles.link}>
            <Settings 
              size={18} 
              className={styles.icon} 
            />
            <span 
              className={styles.linkText}
            >
              Paramètres
            </span>
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