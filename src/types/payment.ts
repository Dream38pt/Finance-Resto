export interface PaymentMethod {
  id: string;
  code: string;
  libelle: string;
  ordre_affichage: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodFormData {
  code: string;
  libelle: string;
  ordre_affichage: string;
  actif: boolean;
}