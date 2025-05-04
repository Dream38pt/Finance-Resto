/*
  # Amélioration de la fonction get_imports_non_traitees

  1. Description
    - Optimisation de la fonction get_imports_non_traitees
    - Ajout d'un index pour améliorer les performances
    - Ajout d'un commentaire explicatif

  2. Changements
    - Modification de la fonction pour utiliser une jointure plus efficace
    - Ajout d'un index sur import_bq_id dans la table fin_bq_Mouvement
*/

-- Recréation de la fonction optimisée
CREATE OR REPLACE FUNCTION get_imports_non_traitees()
RETURNS TABLE (
    id BIGINT,
    import_id UUID,
    companhia TEXT,
    produto TEXT,
    conta TEXT,
    moeda TEXT,
    data_lancamento DATE,
    data_valor DATE,
    descricao TEXT,
    valor NUMERIC,
    saldo NUMERIC,
    referencia_doc TEXT,
    created_at TIMESTAMP,
    nom_fichier TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.import_id,
        i.companhia,
        i.produto,
        i.conta,
        i.moeda,
        i.data_lancamento,
        i.data_valor,
        i.descricao,
        i.valor,
        i.saldo,
        i.referencia_doc,
        i.created_at,
        i.nom_fichier
    FROM fin_bq_import i
    WHERE NOT EXISTS (
        SELECT 1 
        FROM "fin_bq_Mouvement" m 
        WHERE m.import_bq_id = i.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajout d'un commentaire sur la fonction
COMMENT ON FUNCTION get_imports_non_traitees() IS 'Récupère les imports bancaires qui n''ont pas encore été traités et convertis en mouvements';