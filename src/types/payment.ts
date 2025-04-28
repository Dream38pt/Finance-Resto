export interface PaymentMethod {
  id: string;
  code: string;
  libelle: string;
  ordre_affichage: number;
  actif: boolean;
  paiement_par_espece: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodFormData {
  code: string;
  libelle: string;
  ordre_affichage: string;
  actif: boolean;
  paiement_par_espece: boolean;
}