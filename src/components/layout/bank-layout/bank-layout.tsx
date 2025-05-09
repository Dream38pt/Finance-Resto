import React, { ReactNode } from 'react';
import { HeaderGestionBancaire } from '../HeaderGestionBancaire';
import { useMenu } from '../../../contexts/MenuContext';
import { ToastContainer } from '../../ui/toast';
import { useToast } from '../../../contexts/ToastContext';
import styles from './bank-layout.module.css';

interface BankLayoutProps {
  children: ReactNode;
  className?: string;
}

export function BankLayout({ children, className = '' }: BankLayoutProps) {
  const { isExpanded } = useMenu();
  const { toasts, closeToast } = useToast();

  return (
    <div className={`${styles.container} ${isExpanded ? styles.expanded : styles.collapsed} ${className}`}>
      <HeaderGestionBancaire />
      <main className={styles.main}>
        {children}
      </main>
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}