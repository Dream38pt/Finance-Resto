export interface BudgetCF {
  id: string;
  entite_id: string;
  annee: number;
  mois: number;
  designation: string;
  montant: number;
  ordre_affichage: number;
  categorie_achat_id: string | null;
}

export interface Entite {
  id: string;
  code: string;
  libelle: string;
}

export interface CategorieAchat {
  id: string;
  libelle: string;
  fait_partie_cout_mp: boolean;
  ordre_affichage: number;
  actif: boolean;
}

export interface BudgetFormData {
  entite_id: string;
  annee: number;
  mois: number;
  designation: string;
  montants: string[];
  ordre_affichage: string;
  categorie_achat_id: string;
}