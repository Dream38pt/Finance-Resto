/*
  # Création de la vue pour le suivi des coûts du personnel

  1. Nouvelle Vue
    - `v_cout_personnel_mensuel`
      - Calcule les coûts mensuels du personnel par entité
      - Prend en compte les périodes d'affectation
      - Calcule le coût selon la formule :
        coût_mois = (salaire_base + indemnites_repas + autres_couts) × taux_presence + cout_affectation

  2. Description
    Cette vue permet de suivre les coûts mensuels du personnel affecté à chaque entité,
    en prenant en compte les dates d'affectation et les différents éléments de coût.
*/

CREATE OR REPLACE VIEW v_cout_personnel_mensuel AS
WITH RECURSIVE mois AS (
  SELECT generate_series(1, 12) AS numero_mois
),
personnel_couts AS (
  SELECT 
    p.id AS personnel_id,
    p.nom_prenom,
    p.salaire_base,
    p.indemnites_repas,
    p.autres_couts,
    p.ordre_affichage,
    ape.entite_id,
    ape.role_specifique,
    ape.taux_presence,
    ape.cout_affectation,
    ape.date_debut,
    COALESCE(ape.date_fin, '9999-12-31'::date) AS date_fin
  FROM personnel p
  JOIN affectation_personnel_entite ape ON p.id = ape.personnel_id
)
SELECT 
  pc.entite_id,
  EXTRACT(YEAR FROM pc.date_debut)::integer AS annee,
  m.numero_mois AS mois,
  pc.personnel_id,
  pc.nom_prenom,
  pc.role_specifique,
  pc.ordre_affichage,
  CASE 
    WHEN DATE_TRUNC('month', make_date(EXTRACT(YEAR FROM pc.date_debut)::integer, m.numero_mois, 1)) BETWEEN 
         DATE_TRUNC('month', pc.date_debut) AND 
         DATE_TRUNC('month', pc.date_fin)
    THEN (pc.salaire_base + pc.indemnites_repas + pc.autres_couts) * pc.taux_presence + pc.cout_affectation
    ELSE 0
  END AS cout_mensuel
FROM personnel_couts pc
CROSS JOIN mois m
WHERE pc.date_debut <= make_date(EXTRACT(YEAR FROM pc.date_debut)::integer, 12, 31)
  AND pc.date_fin >= make_date(EXTRACT(YEAR FROM pc.date_debut)::integer, 1, 1)
ORDER BY 
  pc.entite_id,
  COALESCE(pc.ordre_affichage, 999999),
  pc.nom_prenom,
  m.numero_mois;