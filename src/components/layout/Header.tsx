import React from 'react';
import { Menu, Home, Info, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string; 
}

export function Header({ title = 'Finance-Resto' }: HeaderProps) {
  const { isExpanded, toggleMenu } = useMenu();

  return (
    <header className={`${styles.header} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Menu size={24} className={styles.icon} />
          <h1 className={styles.title}>{title}</h1>
        </div>
        <nav className={styles.nav}>
          <a href="/" className={styles.link}>
            <Home size={20} className={styles.icon} />
            <span className={styles.linkText}>Accueil</span>
          </a>
          <a href="/about" className={styles.link}>
            <Info size={20} className={styles.icon} />
            <span className={styles.linkText}>À propos</span>
          </a>
          <a href="/contact" className={styles.link}>
            <Mail size={20} className={styles.icon} />
            <span className={styles.linkText}>Contact</span>
          </a>
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