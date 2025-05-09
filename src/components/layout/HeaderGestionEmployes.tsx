import React from 'react';
import { Menu, ChevronLeft, ChevronRight, Home, Users, UserPlus } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './HeaderGestionEmployes.module.css';

interface HeaderGestionEmployesProps {
  title?: string;
}

export function HeaderGestionEmployes({ title }: HeaderGestionEmployesProps) {
  const { isExpanded, toggleMenu } = useMenu();
  const location = useLocation();
  const [activeLink, setActiveLink] = useState<string>('');
  
  useEffect(() => {
    if (location.pathname === '/') {
      setActiveLink('home');
    } else if (location.pathname.includes('/employees/list')) {
      setActiveLink('list');
    } else if (location.pathname.includes('/employees/affectation')) {
      setActiveLink('affectation');
    } else {
      setActiveLink('');
    }
  }, [location.pathname]);
  
  return (
    <header className={`${styles.header} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Menu size={24} className={styles.icon} />
          <h1 className={styles.title}>Gestion Employés</h1>
        </div>
        <nav className={styles.nav}>
          <Link to="/" className={`${styles.link} ${activeLink === 'home' ? styles.activeLink : ''}`}>
            <Home size={18} className={styles.icon} />
            <span className={styles.linkText}>Accueil</span>
          </Link>
          
          <div className={styles.separator} />
          
          <Link to="/employees/list" className={`${styles.link} ${activeLink === 'list' ? styles.activeLink : ''}`}>
            <Users size={18} className={styles.icon} />
            <span className={styles.linkText}>Liste des employés</span>
          </Link>
          
          <Link to="/employees/affectation" className={`${styles.link} ${activeLink === 'affectation' ? styles.activeLink : ''}`}>
            <UserPlus size={18} className={styles.icon} />
            <span className={styles.linkText}>Affectation</span>
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