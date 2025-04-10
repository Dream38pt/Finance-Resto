import React, { ReactNode } from 'react';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { ToastContainer } from '../../ui/toast';
import { useToast } from '../../../contexts/ToastContext';
import { useMenu } from '../../../contexts/MenuContext';
import styles from './page-layout.module.css';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  const { isExpanded } = useMenu();
  const { toasts, closeToast } = useToast();

  return (
    <div className={`${styles.container} ${isExpanded ? styles.expanded : styles.collapsed} ${className}`}>
      <Header />
      <main className={`${styles.main}`}>
        {children}
      </main>
      <Footer />
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}