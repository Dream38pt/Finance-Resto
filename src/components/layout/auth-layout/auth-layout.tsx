import React, { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { ToastContainer } from '../../ui/toast';
import { useToast } from '../../../contexts/ToastContext';
import styles from './auth-layout.module.css';

interface AuthLayoutProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  const { toasts, closeToast } = useToast();

  return (
    <div className={styles.container}>
      <main className={styles.card}>
        <div className={styles.logo}>
          <Menu size={32} color="var(--color-primary)" />
          <h1 className={styles.title}>{title}</h1>
        </div>
        {description && <p className={styles.description}>{description}</p>}
        {children}
      </main>
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}