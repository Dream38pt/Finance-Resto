import React from 'react';
import { Menu, Building, Wallet, ChevronLeft, ChevronRight, Home, Users, Coffee, Receipt, Calendar, Truck, Tags } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import { Link, useLocation } from 'react-router-dom';
import styles from './HeaderParametres.module.css';

interface HeaderParametresProps {
  title?: string;
}

export function HeaderParametres({ title }: HeaderParametresProps) {
  const { isExpanded, toggleMenu } = useMenu();
  
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
          <Link to="/settings/service-types" className={styles.link}>
            <Coffee size={18} className={styles.icon} />
            <span className={styles.linkText}>Type de service CA</span>
          </Link>
          <Link to="/settings/employees" className={styles.link}>
            <Users size={18} className={styles.icon} />
            <span className={styles.linkText}>Employés</span>
          </Link>
          <Link to="/settings/tva" className={styles.link}>
            <Receipt size={18} className={styles.icon} />
            <span className={styles.linkText}>Paramètres TVA</span>
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