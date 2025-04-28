/*
  # Ajout du champ entite_id à la table fin_ferm_caisse
  
  1. Nouvelle colonne
    - `entite_id` (uuid, clé étrangère vers entite)
    - Contrainte NOT NULL
    - Référence à la table entite avec suppression en CASCADE
    
  2. Description
    Cette migration ajoute un champ de liaison avec la table entite à la table fin_ferm_caisse,
    permettant d'associer chaque fermeture de caisse à un restaurant spécifique.
*/

-- Ajout de la colonne entite_id
ALTER TABLE fin_ferm_caisse
ADD COLUMN entite_id uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE;

-- Création d'un index pour améliorer les performances des jointures
CREATE INDEX idx_fin_ferm_caisse_entite_id ON fin_ferm_caisse(entite_id);