import React from 'react';
import { Toast } from './toast';
import { useMenu } from '../../../contexts/MenuContext';
import styles from './toast.module.css';

export interface ToastData {
  id: string;
  color?: string;
  icon?: any;
  label: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  const { isExpanded } = useMenu();

  return (
    <div className={`${styles.toastContainer} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}