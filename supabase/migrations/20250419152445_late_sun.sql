/*
  # Ajout de l'option "aucun" au champ sens de la table fin_type_mouvement_bancaire

  1. Modifications
    - Modification de la contrainte CHECK sur le champ sens pour inclure la valeur 'aucun'
    - Permet d'avoir trois valeurs possibles: 'credit', 'debit', 'aucun'

  2. Description
    Cette modification permet d'ajouter une troisième option "aucun" pour les types de mouvements
    qui n'ont pas d'impact direct sur le solde (comme les virements internes ou les écritures de régularisation).
*/

-- Suppression de la contrainte existante
ALTER TABLE fin_type_mouvement_bancaire
DROP CONSTRAINT IF EXISTS fin_type_mouvement_bancaire_sens_check;

-- Ajout de la nouvelle contrainte avec l'option 'aucun'
ALTER TABLE fin_type_mouvement_bancaire
ADD CONSTRAINT fin_type_mouvement_bancaire_sens_check
CHECK (sens IN ('credit', 'debit', 'aucun'));