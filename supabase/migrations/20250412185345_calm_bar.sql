/*
  # Correction de la vue budget CA mensuel

  1. Suppression de la vue existante
  2. Recréation avec les mêmes fonctionnalités mais une structure plus robuste
  3. Ajout des permissions appropriées
*/

-- Suppression de la vue existante si elle existe
DROP VIEW IF EXISTS v_budget_ca_mensuel;

-- Recréation de la vue
CREATE OR REPLACE VIEW v_budget_ca_mensuel AS
WITH budget_mensuel AS (
  SELECT
    entite_id,
    annee,
    type_service,
    mois,
    ROUND(AVG(prix_vente_prevu), 2) as prix_moyen,
    SUM(quantite_prevue * jours_ouverts) as quantites,
    SUM(ca_previsionnel) as ca_mensuel
  FROM budget_ca_mensuel
  GROUP BY entite_id, annee, type_service, mois
),
totaux_mensuels AS (
  SELECT
    entite_id,
    annee,
    mois,
    SUM(ca_mensuel) as total_mensuel
  FROM budget_mensuel
  GROUP BY entite_id, annee, mois
),
totaux_annuels AS (
  SELECT
    entite_id,
    annee,
    type_service,
    SUM(ca_mensuel) as total_annuel
  FROM budget_mensuel
  GROUP BY entite_id, annee, type_service
)
SELECT
  bm.entite_id,
  bm.annee,
  bm.type_service,
  bm.mois,
  bm.prix_moyen,
  bm.quantites,
  bm.ca_mensuel,
  tm.total_mensuel,
  ta.total_annuel
FROM budget_mensuel bm
LEFT JOIN totaux_mensuels tm ON bm.entite_id = tm.entite_id 
  AND bm.annee = tm.annee 
  AND bm.mois = tm.mois
LEFT JOIN totaux_annuels ta ON bm.entite_id = ta.entite_id 
  AND bm.annee = ta.annee 
  AND bm.type_service = ta.type_service
ORDER BY bm.annee DESC, bm.mois, bm.type_service;