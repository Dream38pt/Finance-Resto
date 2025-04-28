/*
  # Ajout du champ paiement_par_espece à la table fin_mode_paiement

  1. Modifications
    - Ajout du champ `paiement_par_espece` (boolean) à la table fin_mode_paiement
    - Valeur par défaut à false
    - Contrainte NOT NULL pour garantir une valeur

  2. Description
    Ce champ permet d'identifier les modes de paiement qui sont effectués en espèces,
    ce qui est important pour le suivi des fermetures de caisse et la gestion des liquidités.
*/

-- Ajout du champ paiement_par_espece
ALTER TABLE fin_mode_paiement
ADD COLUMN paiement_par_espece boolean NOT NULL DEFAULT false;

-- Mise à jour des enregistrements existants qui pourraient être des paiements en espèces
UPDATE fin_mode_paiement
SET paiement_par_espece = true
WHERE code = 'ESPECES' OR code = 'CAISSE' OR libelle ILIKE '%espèce%' OR libelle ILIKE '%cash%';