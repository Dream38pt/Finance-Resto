import React, { ReactNode } from 'react';
import { Card } from '../../ui/card';
import styles from './page-layout.module.css';

interface PageSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function PageSection({
  title,
  subtitle,
  description,
  children,
  className = ''
}: PageSectionProps) {
  return (
    <Card className={`${styles.section} ${className}`}>
      {title && <h1 className={styles.title}>{title}</h1>}
      {subtitle && <h2 className={styles.subtitle}>{subtitle}</h2>}
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </Card>
  );
}