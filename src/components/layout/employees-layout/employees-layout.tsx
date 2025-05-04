import React, { ReactNode } from 'react';
import { HeaderGestionEmployes } from '../HeaderGestionEmployes';
import { useMenu } from '../../../contexts/MenuContext';
import { ToastContainer } from '../../ui/toast';
import { useToast } from '../../../contexts/ToastContext';
import styles from './employees-layout.module.css';

interface EmployeesLayoutProps {
  children: ReactNode;
  className?: string;
}

export function EmployeesLayout({ children, className = '' }: EmployeesLayoutProps) {
  const { isExpanded } = useMenu();
  const { toasts, closeToast } = useToast();

  return (
    <div className={`${styles.container} ${isExpanded ? styles.expanded : styles.collapsed} ${className}`}>
      <HeaderGestionEmployes />
      <main className={styles.main}>
        {children}
      </main>
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}