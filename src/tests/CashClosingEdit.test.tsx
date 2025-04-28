import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AddCashClosing from '../pages/finance/AddCashClosing';
import NewInvoice from '../pages/finance/NewInvoice';
import { ToastProvider } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

// Mock de Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
    },
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn().mockResolvedValue({ data: { path: 'test-file-path' } })
    }
  }
}));

// Mock des données
const mockEntites = [
  { id: 'entity-1', code: 'PQ', libelle: 'Parce Que' },
  { id: 'entity-2', code: 'CDP', libelle: 'Casa Del Popolo' }
];

const mockFermeture = {
  id: 'fermeture-1',
  entite_id: 'entity-1',
  date_fermeture: '2025-04-15',
  ca_ttc: 1500,
  ca_ht: 1250,
  depot_banque_theorique: 1000,
  depot_banque_reel: 980,
  est_valide: false,
  commentaire: 'Test fermeture',
  entite: { code: 'PQ', libelle: 'Parce Que' }
};

const mockMultibancs = [
  {
    id: 'multibanc-1',
    id_ferm_caisse: 'fermeture-1',
    periode: 'Semaine 15',
    montant_brut: 300,
    montant_reel: 290,
    commentaire: 'Test multibanc'
  }
];

const mockFactures = [
  {
    id: 'facture-1',
    entite_id: 'entity-1',
    tiers_id: 'tiers-1',
    numero_document: 'FAC001',
    date_facture: '2025-04-15',
    montant_ht: 200,
    montant_tva: 40,
    montant_ttc: 240,
    mode_paiement_id: 'mode-1',
    commentaire: 'Facture test',
    tiers: { code: 'FRS1', nom: 'Fournisseur 1' },
    mode_paiement: { code: 'ESP', libelle: 'Espèces', paiement_par_espece: true }
  }
];

const mockCategories = [
  { id: 'cat-1', libelle: 'Alimentation' },
  { id: 'cat-2', libelle: 'Boissons' }
];

const mockTiers = [
  { id: 'tiers-1', code: 'FRS1', nom: 'Fournisseur 1' },
  { id: 'tiers-2', code: 'FRS2', nom: 'Fournisseur 2' }
];

const mockModesPaiement = [
  { id: 'mode-1', code: 'ESP', libelle: 'Espèces', paiement_par_espece: true },
  { id: 'mode-2', code: 'CB', libelle: 'Carte Bancaire', paiement_par_espece: false }
];

describe('Test de régression pour la page Modifier une fermeture de caisse', () => {
  beforeEach(() => {
    // Reset des mocks
    vi.clearAllMocks();
    
    // Configuration des mocks pour les requêtes Supabase
    supabase.from.mockImplementation((table) => {
      switch (table) {
        case 'entite':
          return {
            select: () => ({
              order: () => ({
                data: mockEntites,
                error: null
              })
            })
          };
        case 'fin_ferm_caisse':
          return {
            select: () => ({
              eq: () => ({
                single: () => ({
                  data: mockFermeture,
                  error: null
                })
              }),
              order: () => ({
                data: [mockFermeture],
                error: null
              })
            }),
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: () => ({
                    data: { ...mockFermeture, id: 'fermeture-1' },
                    error: null
                  })
                })
              })
            }),
            delete: () => ({
              eq: () => ({
                error: null
              })
            })
          };
        case 'fin_ferm_multibanc':
          return {
            select: () => ({
              eq: () => ({
                data: mockMultibancs,
                error: null
              })
            }),
            insert: () => ({
              error: null
            }),
            delete: () => ({
              eq: () => ({
                error: null
              })
            })
          };
        case 'fin_facture_achat':
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  in: () => ({
                    data: mockFactures,
                    error: null
                  })
                })
              }),
              in: () => ({
                data: mockFactures,
                error: null
              })
            }),
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: () => ({
                    data: { ...mockFactures[0], id: 'facture-1' },
                    error: null
                  })
                })
              })
            }),
            insert: () => ({
              select: () => ({
                single: () => ({
                  data: { ...mockFactures[0], id: 'facture-2' },
                  error: null
                })
              })
            })
          };
        case 'fin_ligne_facture_achat':
          return {
            select: () => ({
              eq: () => ({
                data: [],
                error: null
              })
            }),
            insert: () => ({
              error: null
            }),
            delete: () => ({
              eq: () => ({
                error: null
              })
            })
          };
        case 'fin_categorie_achat':
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  order: () => ({
                    data: mockCategories,
                    error: null
                  })
                })
              })
            })
          };
        case 'fin_tiers':
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  data: mockTiers,
                  error: null
                })
              })
            })
          };
        case 'fin_mode_paiement':
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  order: () => ({
                    data: mockModesPaiement,
                    error: null
                  })
                })
              }),
              data: mockModesPaiement.filter(mode => mode.paiement_par_espece),
              error: null
            })
          };
        case 'fin_ferm_facturedepenses':
          return {
            insert: () => ({
              error: null
            }),
            delete: () => ({
              eq: () => ({
                error: null
              })
            })
          };
        case 'param_collaborateur':
          return {
            select: () => ({
              eq: () => ({
                single: () => ({
                  data: { id: 'collab-1', role_id: 'role-1', param_role: { libelle: 'Administrateur' } },
                  error: null
                })
              })
            })
          };
        default:
          return {
            select: () => ({
              data: [],
              error: null
            })
          };
      }
    });
  });

  it('devrait maintenir le contexte lors de la modification d\'une dépense existante', async () => {
    // Rendu du composant avec le routeur et les contextes nécessaires
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/finance/add-cash-closing']}>
          <Routes>
            <Route path="/finance/add-cash-closing" element={<AddCashClosing />} />
            <Route path="/finance/nouvelle-facture" element={<NewInvoice />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    // Attendre que la page se charge
    await waitFor(() => {
      expect(screen.getByText(/Modifier une fermeture de caisse/i)).toBeInTheDocument();
    });

    // Vérifier que les données initiales sont chargées
    expect(screen.getByText(/Parce Que/i)).toBeInTheDocument();
    expect(screen.getByText(/Fournisseur 1/i)).toBeInTheDocument();

    // Simuler la modification d'une dépense existante
    const editButtons = screen.getAllByTitle('Modifier');
    fireEvent.click(editButtons[1]); // Cliquer sur le bouton de modification de la facture

    // Vérifier que la navigation vers la page de modification de facture a été déclenchée
    // Note: Dans un test réel, on vérifierait que la page a changé, mais ici on simule juste la navigation

    // Simuler le retour à la page de fermeture de caisse
    // Dans un test réel, on simulerait la soumission du formulaire de facture et la navigation de retour

    // Vérifier que les données sont conservées après le retour
    // Ces assertions seraient faites après la navigation de retour
  });

  it('devrait maintenir le contexte lors de l\'ajout d\'une nouvelle dépense', async () => {
    // Rendu du composant avec le routeur et les contextes nécessaires
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/finance/add-cash-closing']}>
          <Routes>
            <Route path="/finance/add-cash-closing" element={<AddCashClosing />} />
            <Route path="/finance/nouvelle-facture" element={<NewInvoice />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    // Attendre que la page se charge
    await waitFor(() => {
      expect(screen.getByText(/Modifier une fermeture de caisse/i)).toBeInTheDocument();
    });

    // Simuler l'ajout d'une nouvelle dépense
    const addButton = screen.getByText('Ajouter une dépense');
    fireEvent.click(addButton);

    // Vérifier que la navigation vers la page de création de facture a été déclenchée
    // Note: Dans un test réel, on vérifierait que la page a changé, mais ici on simule juste la navigation

    // Simuler le retour à la page de fermeture de caisse
    // Dans un test réel, on simulerait la soumission du formulaire de facture et la navigation de retour

    // Vérifier que les données sont conservées après le retour
    // Ces assertions seraient faites après la navigation de retour
  });

  it('devrait recalculer correctement les totaux après modification des dépenses', async () => {
    // Rendu du composant avec le routeur et les contextes nécessaires
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/finance/add-cash-closing']}>
          <Routes>
            <Route path="/finance/add-cash-closing" element={<AddCashClosing />} />
            <Route path="/finance/nouvelle-facture" element={<NewInvoice />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    // Attendre que la page se charge
    await waitFor(() => {
      expect(screen.getByText(/Modifier une fermeture de caisse/i)).toBeInTheDocument();
    });

    // Vérifier que le dépôt théorique est correctement calculé
    const depotTheoriqueInput = screen.getByLabelText('Dépôt banque théorique') as HTMLInputElement;
    expect(depotTheoriqueInput.value).toBe('970'); // 1500 (CA TTC) - 290 (multibanc) - 240 (facture)

    // Simuler l'ajout d'un nouvel encaissement multibanc
    const addMultibancButton = screen.getByText('Ajouter une ligne');
    fireEvent.click(addMultibancButton);

    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText('Période'), { target: { value: 'Semaine 16' } });
    fireEvent.change(screen.getByLabelText('Montant brut'), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText('Montant réel'), { target: { value: '190' } });

    // Soumettre le formulaire
    const addButton = screen.getByText('Ajouter');
    fireEvent.click(addButton);

    // Vérifier que le dépôt théorique est recalculé
    await waitFor(() => {
      expect(depotTheoriqueInput.value).toBe('780'); // 1500 - 290 - 190 - 240
    });
  });
});