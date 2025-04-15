import React, { ReactNode } from 'react';
import { HeaderGestionFinanciere } from '../HeaderGestionFinanciere';
import { useMenu } from '../../../contexts/MenuContext';
import styles from './finance-layout.module.css';

interface FinanceLayoutProps {
  children: ReactNode;
  className?: string;
}

export function FinanceLayout({ children, className = '' }: FinanceLayoutProps) {
  const { isExpanded } = useMenu();

  return (
    <div className={`${styles.container} ${isExpanded ? styles.expanded : styles.collapsed} ${className}`}>
      <HeaderGestionFinanciere />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}