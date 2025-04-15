import React, { ReactNode } from 'react';
import { HeaderParametres } from '../HeaderParametres';
import { useMenu } from '../../../contexts/MenuContext';
import styles from './settings-layout.module.css';

interface SettingsLayoutProps {
  children: ReactNode;
  className?: string;
}

export function SettingsLayout({ children, className = '' }: SettingsLayoutProps) {
  const { isExpanded } = useMenu();

  return (
    <div className={`${styles.container} ${isExpanded ? styles.expanded : styles.collapsed} ${className}`}>
      <HeaderParametres />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}