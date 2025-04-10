import React from 'react';
import { PageLayout, PageSection } from '../components/layout/page-layout';
import { theme } from '../theme';
import styles from './About.module.css';

function About() {
  const stats = [
    { value: '10K+', label: 'Utilisateurs actifs', color: theme.colors.primary },
    { value: '50+', label: 'Pays', color: theme.colors.secondary },
    { value: '99.9%', label: 'Disponibilité', color: '#10b981' },
    { value: '24/7', label: 'Support client', color: theme.colors.warning }
  ];

  const team = [
    {
      name: 'Sarah Martin',
      role: 'CEO & Fondatrice',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
    },
    {
      name: 'Marc Dubois',
      role: 'CTO',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
    },
    {
      name: 'Julie Chen',
      role: 'Directrice Design',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'
    }
  ];

  const timeline = [
    {
      date: 'Janvier 2023',
      event: 'Lancement de la version 2.0'
    },
    {
      date: 'Mars 2022',
      event: 'Expansion internationale'
    },
    {
      date: 'Juin 2021',
      event: 'Premier investissement majeur'
    },
    {
      date: 'Décembre 2020',
      event: 'Création de l\'entreprise'
    }
  ];

  return (
    <PageLayout>
      {/* Section Hero avec image de fond */}
      <PageSection
        title="Notre Histoire"
        description="Découvrez l'équipe passionnée derrière notre succès et notre vision pour l'avenir."
        className="bg-gradient"
      >
        <div className={styles.stats}>
          {stats.map((stat, index) => (
            <div
              key={index}
              className={styles.statCard}
              style={{ '--stat-color': stat.color } as React.CSSProperties}
            >
              <p className={styles.statValue}>{stat.value}</p>
              <p className={styles.statLabel}>{stat.label}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Section Équipe */}
      <PageSection
        subtitle="Notre Équipe"
        description="Des experts passionnés qui travaillent ensemble pour créer des solutions innovantes."
      >
        <div className={styles.team}>
          {team.map((member, index) => (
            <div key={index} className={styles.member}>
              <img
                src={member.image}
                alt={member.name}
                className={styles.avatar}
              />
              <h3 className={styles.name}>{member.name}</h3>
              <p className={styles.role}>{member.role}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Section Timeline */}
      <PageSection
        subtitle="Notre Parcours"
        description="Les moments clés qui ont façonné notre histoire."
      >
        <div className={styles.timeline}>
          {timeline.map((item, index) => (
            <div key={index} className={styles.timelineItem}>
              <p className={styles.date}>{item.date}</p>
              <p className={styles.event}>{item.event}</p>
            </div>
          ))}
        </div>
      </PageSection>
    </PageLayout>
  );
}

export default About;