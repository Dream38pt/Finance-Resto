export interface Invoice {
  id: string;
  entite_id: string;
  entite?: {
    code: string;
    libelle: string;
  };
  tiers_id: string;
  tiers?: {
    code: string;
    nom: string;
  };
  numero_document: string | null;
  date_facture: string;
  mode_paiement_id: string;
  mode_paiement?: {
    code: string;
    libelle: string;
  };
  montant_ttc: number;
  lien_piece_jointe: string | null;
}

export interface InvoiceFormData {
  entite_id: string;
  tiers_id: string;
  numero_document: string;
  date_facture: string;
  montant_ht: string;
  montant_tva: string;
  montant_ttc: string;
  mode_paiement_id: string;
  commentaire: string;
  file: File | null;
}

export interface InvoiceLine {
  id: string;
  facture_id: string;
  categorie_id: string;
  categorie?: {
    libelle: string;
  };
  designation: string;
  quantite: number;
  prix_unitaire_ht: number;
  montant_ht: number;
  montant_tva: number;
  commentaire: string | null;
}

export interface InvoiceLineFormData {
  designation: string;
  quantite: string;
  prix_unitaire_ht: string;
  categorie_id: string;
  montant_ht: string;
  montant_tva: string;
  commentaire: string;
}