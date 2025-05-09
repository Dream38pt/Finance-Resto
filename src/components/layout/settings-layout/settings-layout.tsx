import React, { ReactNode } from 'react';
import { HeaderParametres } from '../HeaderParametres';
import { useMenu } from '../../../contexts/MenuContext';
import { ToastContainer } from '../../ui/toast';
import { useToast } from '../../../contexts/ToastContext';
import styles from './settings-layout.module.css';

interface SettingsLayoutProps {
  children: ReactNode;
  className?: string;
}

export function SettingsLayout({ children, className = '' }: SettingsLayoutProps) {
  const { isExpanded } = useMenu();
  const { toasts, closeToast } = useToast();

  return (
    <div className={`${styles.container} ${isExpanded ? styles.expanded : styles.collapsed} ${className}`}>
      <HeaderParametres />
      <main className={styles.main}>
        {children}
      </main>
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}