import React from 'react';
import { Heart } from 'lucide-react';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <span>Fait avec</span>
          <Heart size={16} color="#ef4444" />
          <span>en France</span>
        </div>
      </div>
    </footer>
  );
}