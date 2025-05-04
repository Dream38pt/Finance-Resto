import React, { ReactNode } from 'react';
import { HeaderGestionBancaireParam } from '../HeaderGestionBancaireParam';
import { useMenu } from '../../../contexts/MenuContext';
import { ToastContainer } from '../../ui/toast';
import { useToast } from '../../../contexts/ToastContext';
import styles from './bank-settings-layout.module.css';

interface BankSettingsLayoutProps {
  children: ReactNode;
  className?: string;
}

export function BankSettingsLayout({ children, className = '' }: BankSettingsLayoutProps) {
  const { isExpanded } = useMenu();
  const { toasts, closeToast } = useToast();

  return (
    <div className={`${styles.container} ${isExpanded ? styles.expanded : styles.collapsed} ${className}`}>
      <HeaderGestionBancaireParam />
      <div className={styles.main}>
        {children}
      </div>
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}