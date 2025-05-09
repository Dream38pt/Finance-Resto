import React, { ReactNode } from 'react';
import { HeaderGestionFinanciere } from '../HeaderGestionFinanciere';
import { useMenu } from '../../../contexts/MenuContext';
import { ToastContainer } from '../../ui/toast';
import { useToast } from '../../../contexts/ToastContext';
import styles from './finance-layout.module.css';

interface FinanceLayoutProps {
  children: ReactNode;
  className?: string;
}

export function FinanceLayout({ children, className = '' }: FinanceLayoutProps) {
  const { isExpanded } = useMenu();
  const { toasts, closeToast } = useToast();

  return (
    <div className={`${styles.container} ${isExpanded ? styles.expanded : styles.collapsed} ${className}`}>
      <HeaderGestionFinanciere />
      <main className={styles.main}>
        {children}
      </main>
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}