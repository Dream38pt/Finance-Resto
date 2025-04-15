/*
  # Création de la vue budget CA mensuel

  1. Nouvelle Vue
    - `v_budget_ca_mensuel`
      - Agrégation des données de budget par mois et type de service
      - Calcul des totaux mensuels et annuels
      - Inclut prix moyen, quantités et CA

  2. Sécurité
    - La vue est accessible aux utilisateurs authentifiés via RLS
*/

-- Création de la vue pour le budget CA
CREATE VIEW v_budget_ca_mensuel AS
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
ORDER BY bm.type_service, bm.mois;

-- Accorder les permissions nécessaires
GRANT SELECT ON v_budget_ca_mensuel TO authenticated;