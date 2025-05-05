import React from 'react';
import { Menu, Home, Settings, Mail, ChevronLeft, ChevronRight, Wallet, LogOut, UserCircle, Users, Landmark } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import styles from './Header.module.css';

interface NavLink {
  to: string;
  label: string;
  icon: React.ReactNode;
  separator?: boolean;
}

interface HeaderProps {
  title?: string; 
  navLinks?: NavLink[];
  rightSlot?: React.ReactNode;
  showLogoutButton?: boolean;
}

export function Header({ title, navLinks, rightSlot, showLogoutButton = true }: HeaderProps) {
  const { isExpanded, toggleMenu } = useMenu();
  const location = useLocation();
  const { showToast } = useToast();
  
  // Liens de navigation par défaut
  const defaultNavLinks: NavLink[] = [
    {
      to: "/",
      label: "Accueil",
      icon: <Home size={20} className={styles.icon} />,
      separator: true
    },
    {
      to: "/profile",
      label: "Mon Profil",
      icon: <UserCircle size={20} className={styles.icon} />
    },
    {
      to: "/settings",
      label: "Paramètres",
      icon: <Settings size={20} className={styles.icon} />
    },
    {
      to: "/finance",
      label: "Gestion Financière",
      icon: <Wallet size={20} className={styles.icon} />
    },
    {
      to: "/bank",
      label: "Gestion Bancaire",
      icon: <Landmark size={20} className={styles.icon} />
    },
    {
      to: "/employees",
      label: "Gestion Employés",
      icon: <Users size={20} className={styles.icon} />
    },
    {
      to: "/contact",
      label: "Contact",
      icon: <Mail size={20} className={styles.icon} />
    }
  ];
  
  // Utiliser les liens personnalisés s'ils sont fournis, sinon utiliser les liens par défaut
  const links = navLinks || defaultNavLinks;
  
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
          {links.map((link, index) => (
            <React.Fragment key={index}>
              <Link to={link.to} className={styles.link}>
                {link.icon}
                <span className={styles.linkText}>{link.label}</span>
              </Link>
              {link.separator && <div className={styles.separator}></div>}
            </React.Fragment>
          ))}
        </nav>
        {showLogoutButton && (
          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
            aria-label="Déconnexion"
          >
            <LogOut size={20} />
            <span className={styles.linkText}>Déconnexion</span>
          </button>
        )}
        
        {rightSlot && (
          <div className={styles.rightSlot}>
            {rightSlot}
          </div>
        )}
        
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