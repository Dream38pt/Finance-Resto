import React, { InputHTMLAttributes } from 'react';
import styles from './form.module.css';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function FormInput({ error, className = '', ...props }: FormInputProps) {
  return (
    <input
      className={`${styles.input} ${error ? styles.hasError : ''} ${className}`}
      {...props}
    />
  );
}