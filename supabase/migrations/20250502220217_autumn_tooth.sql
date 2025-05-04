/*
  # Création de la fonction get_imports_non_traitees

  1. Description
    - Crée une fonction qui récupère les lignes de fin_bq_import non encore traitées
    - Une ligne est considérée comme non traitée si elle n'a pas d'entrée correspondante dans fin_bq_Mouvement
    - Utilisée pour le traitement post-import des écritures bancaires

  2. Retour
    - Retourne toutes les colonnes de fin_bq_import pour les lignes non traitées
*/

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
        fin_bq_import.id,
        fin_bq_import.import_id,
        fin_bq_import.companhia,
        fin_bq_import.produto,
        fin_bq_import.conta,
        fin_bq_import.moeda,
        fin_bq_import.data_lancamento,
        fin_bq_import.data_valor,
        fin_bq_import.descricao,
        fin_bq_import.valor,
        fin_bq_import.saldo,
        fin_bq_import.referencia_doc,
        fin_bq_import.created_at,
        fin_bq_import.nom_fichier
    FROM fin_bq_import
    LEFT JOIN "fin_bq_Mouvement" ON fin_bq_import.id = "fin_bq_Mouvement".import_bq_id
    WHERE "fin_bq_Mouvement".import_bq_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;