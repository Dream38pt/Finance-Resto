import React from 'react';
import { Menu, ChevronLeft, ChevronRight, Home, FileType, Settings, CreditCard, FileOutput } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import { Link } from 'react-router-dom';
import styles from './HeaderGestionBancaireParam.module.css';

interface HeaderGestionBancaireParamProps {
  title?: string;
}

export function HeaderGestionBancaireParam({ title }: HeaderGestionBancaireParamProps) {
  const { isExpanded, toggleMenu } = useMenu();
  
  return (
    <header className={`${styles.header} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Menu size={24} className={styles.icon} />
          <h1 className={styles.title}>Paramétrage Bancaire</h1>
        </div>
        <nav className={styles.nav}>
          <Link to="/bank" className={styles.link}>
            <Home size={18} className={styles.icon} />
            <span className={styles.linkText}>Accueil</span>
          </Link>
          
          <div className={styles.separator} />
          
          <Link 
            to="/bank/settings/bank-accounts"
            className={styles.link}
          >
            <CreditCard size={18} className={styles.icon} />
            <span className={styles.linkText}>Comptes Bancaires</span>
          </Link>
          
          <Link 
            to="/bank/settings/import-formats"
            className={styles.link}
          >
            <FileType size={18} className={styles.icon} />
            <span className={styles.linkText}>Format d'importation</span>
          </Link>
          
          <Link 
            to="/bank/settings/import-processing"
            className={styles.link}
          >
            <FileOutput size={18} className={styles.icon} />
            <span className={styles.linkText}>Traitement Import</span>
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