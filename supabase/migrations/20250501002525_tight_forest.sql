/*
  # Ajout d'un index d'unicité pour les mouvements bancaires

  1. Nouvelle Contrainte
    - Création d'un index unique sur la table `fin_bq_Mouvement`
    - Combinaison de colonnes: id_compte, data_valor, valor, saldo, descricao
    - Permet d'éviter les doublons lors des importations répétées

  2. Description
    Cet index garantit qu'un mouvement bancaire ne peut être inséré qu'une seule fois
    dans la base de données, même si le fichier source est importé plusieurs fois.
    Un mouvement est considéré comme unique s'il a la même combinaison de:
    - compte bancaire
    - date de valeur
    - montant
    - solde
    - libellé
*/

-- Création de l'index d'unicité
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bq_mouvement
ON "fin_bq_Mouvement" (
  id_compte,
  data_valor,
  valor,
  saldo,
  descricao
);

-- Ajout d'un commentaire sur l'index
COMMENT ON INDEX uniq_bq_mouvement IS 'Empêche les doublons de mouvements bancaires lors des importations répétées';