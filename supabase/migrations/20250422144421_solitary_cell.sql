/*
  # Suppression du champ niveau_acces de la table param_habilitation

  1. Modifications
    - Suppression de la colonne niveau_acces de la table param_habilitation
    - Suppression de la contrainte CHECK associée

  2. Description
    Cette migration supprime le champ niveau_acces qui n'est plus nécessaire
    dans la table param_habilitation, simplifiant ainsi la structure de la table.
*/

-- Suppression de la colonne niveau_acces
ALTER TABLE param_habilitation
DROP COLUMN IF EXISTS niveau_acces;