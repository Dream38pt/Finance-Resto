import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

const mockModesPaiement = [
  { id: 'mode-1', code: 'ESP', libelle: 'Espèces', paiement_par_espece: true },
  { id: 'mode-2', code: 'CB', libelle: 'Carte Bancaire', paiement_par_espece: false }
];

const mockTiers = [
  { id: 'tiers-1', code: 'FRS1', nom: 'Fournisseur 1' },
  { id: 'tiers-2', code: 'FRS2', nom: 'Fournisseur 2' }
];

const mockCategories = [
  { id: 'cat-1', libelle: 'Alimentation' },
  { id: 'cat-2', libelle: 'Boissons' }
];

describe('Test de persistance du formulaire de fermeture de caisse', () => {
  // Nettoyer le localStorage avant et après chaque test
  beforeEach(() => {
    localStorage.clear();
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
        case 'fin_facture_achat':
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  in: () => ({
                    data: [],
                    error: null
                  })
                })
              }),
              in: () => ({
                data: [],
                error: null
              })
            }),
            insert: () => ({
              select: () => ({
                single: () => ({
                  data: { id: 'new-facture-id' },
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

  afterEach(() => {
    localStorage.clear();
  });

  it('devrait sauvegarder les données du formulaire dans le localStorage', async () => {
    // Rendu du composant
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/finance/add-cash-closing']}>
          <Routes>
            <Route path="/finance/add-cash-closing" element={<AddCashClosing />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    // Attendre que la page se charge
    await waitFor(() => {
      expect(screen.getByText(/Ajouter une fermeture de caisse/i)).toBeInTheDocument();
    });

    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText(/Restaurant/i), { target: { value: 'entity-1' } });
    fireEvent.change(screen.getByLabelText(/CA TTC/i), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText(/CA HT/i), { target: { value: '1250' } });
    fireEvent.change(screen.getByLabelText(/Commentaire/i), { target: { value: 'Test commentaire' } });

    // Vérifier que les données sont sauvegardées dans le localStorage
    await waitFor(() => {
      const savedData = localStorage.getItem('draftFermetureCaisse');
      expect(savedData).not.toBeNull();
      
      const parsedData = JSON.parse(savedData!);
      expect(parsedData.formData.entite_id).toBe('entity-1');
      expect(parsedData.formData.ca_ttc).toBe('1500');
      expect(parsedData.formData.ca_ht).toBe('1250');
      expect(parsedData.formData.commentaire).toBe('Test commentaire');
    });
  });

  it('devrait restaurer les données du formulaire depuis le localStorage', async () => {
    // Préparer les données dans le localStorage
    const draftData = {
      formData: {
        entite_id: 'entity-1',
        date_fermeture: '2025-05-01',
        ca_ttc: '2000',
        ca_ht: '1800',
        commentaire: 'Brouillon sauvegardé',
        depot_banque_theorique: '1500',
        depot_banque_reel: '1450'
      },
      multibancs: [
        {
          periode: 'Semaine 18',
          montant_brut: '500',
          montant_reel: '480',
          commentaire: 'Test multibanc'
        }
      ],
      editMode: false
    };
    
    localStorage.setItem('draftFermetureCaisse', JSON.stringify(draftData));

    // Rendu du composant
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/finance/add-cash-closing']}>
          <Routes>
            <Route path="/finance/add-cash-closing" element={<AddCashClosing />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    // Attendre que la page se charge et que les données soient restaurées
    await waitFor(() => {
      expect(screen.getByText(/Ajouter une fermeture de caisse/i)).toBeInTheDocument();
    });

    // Vérifier que les champs du formulaire sont pré-remplis avec les données du localStorage
    await waitFor(() => {
      const caTtcInput = screen.getByLabelText(/CA TTC/i) as HTMLInputElement;
      expect(caTtcInput.value).toBe('2000');
      
      const caHtInput = screen.getByLabelText(/CA HT/i) as HTMLInputElement;
      expect(caHtInput.value).toBe('1800');
      
      const commentaireInput = screen.getByLabelText(/Commentaire/i) as HTMLTextAreaElement;
      expect(commentaireInput.value).toBe('Brouillon sauvegardé');
    });

    // Vérifier que les multibancs sont restaurés
    await waitFor(() => {
      expect(screen.getByText('Semaine 18')).toBeInTheDocument();
      expect(screen.getByText('480,00 €')).toBeInTheDocument();
    });
  });

  it('devrait supprimer le brouillon du localStorage après enregistrement', async () => {
    // Préparer les données dans le localStorage
    const draftData = {
      formData: {
        entite_id: 'entity-1',
        date_fermeture: '2025-05-01',
        ca_ttc: '2000',
        ca_ht: '1800',
        commentaire: 'Brouillon à supprimer',
        depot_banque_theorique: '1500',
        depot_banque_reel: '1450'
      },
      multibancs: [],
      editMode: false
    };
    
    localStorage.setItem('draftFermetureCaisse', JSON.stringify(draftData));

    // Mock de la réponse de Supabase pour l'insertion
    supabase.from.mockImplementation((table) => {
      if (table === 'fin_ferm_caisse') {
        return {
          select: () => ({
            eq: () => ({
              single: () => ({
                data: null,
                error: null
              })
            }),
            order: () => ({
              data: [],
              error: null
            })
          }),
          insert: () => ({
            select: () => ({
              single: () => ({
                data: { id: 'new-fermeture-id' },
                error: null
              })
            })
          })
        };
      }
      return {
        select: () => ({
          data: [],
          error: null
        })
      };
    });

    // Rendu du composant
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/finance/add-cash-closing']}>
          <Routes>
            <Route path="/finance/add-cash-closing" element={<AddCashClosing />} />
            <Route path="/finance/cash-closing" element={<div>Page de liste des fermetures</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    // Attendre que la page se charge
    await waitFor(() => {
      expect(screen.getByText(/Ajouter une fermeture de caisse/i)).toBeInTheDocument();
    });

    // Soumettre le formulaire
    const submitButton = screen.getByText('Enregistrer');
    fireEvent.click(submitButton);

    // Vérifier que le brouillon est supprimé après enregistrement
    await waitFor(() => {
      expect(localStorage.getItem('draftFermetureCaisse')).toBeNull();
    });
  });

  it('devrait sauvegarder l\'état avant de naviguer vers la page d\'ajout de dépense', async () => {
    // Rendu du composant
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
      expect(screen.getByText(/Ajouter une fermeture de caisse/i)).toBeInTheDocument();
    });

    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText(/Restaurant/i), { target: { value: 'entity-1' } });
    fireEvent.change(screen.getByLabelText(/CA TTC/i), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText(/CA HT/i), { target: { value: '1250' } });

    // Cliquer sur le bouton "Ajouter une dépense"
    const addButton = screen.getByText('Ajouter une dépense');
    fireEvent.click(addButton);

    // Vérifier que les données sont sauvegardées dans le localStorage
    await waitFor(() => {
      const savedData = localStorage.getItem('draftFermetureCaisse');
      expect(savedData).not.toBeNull();
      
      const parsedData = JSON.parse(savedData!);
      expect(parsedData.formData.entite_id).toBe('entity-1');
      expect(parsedData.formData.ca_ttc).toBe('1500');
      expect(parsedData.formData.ca_ht).toBe('1250');
    });
  });
});