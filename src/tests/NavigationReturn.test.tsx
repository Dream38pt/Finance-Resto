import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AddCashClosing from '../pages/finance/AddCashClosing';
import { ToastProvider } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

// Composant simulant un retour de navigation
function MockReturnComponent() {
  const navigate = useNavigate();
  
  return (
    <div>
      <h1>Page de retour</h1>
      <button 
        onClick={() => navigate('/finance/add-cash-closing', { 
          state: { returnTo: '/finance/add-cash-closing' } 
        })}
      >
        Retourner à la fermeture de caisse
      </button>
    </div>
  );
}

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
    }
  }
}));

// Mock des données
const mockEntites = [
  { id: 'entity-1', code: 'PQ', libelle: 'Parce Que' },
  { id: 'entity-2', code: 'CDP', libelle: 'Casa Del Popolo' }
];

describe('Test de retour de navigation vers la page de fermeture de caisse', () => {
  beforeEach(() => {
    // Reset des mocks et du localStorage
    vi.clearAllMocks();
    localStorage.clear();
    
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
                data: [],
                error: null
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

  it('devrait restaurer les données du formulaire après un retour de navigation', async () => {
    // Préparer les données dans le localStorage
    const draftData = {
      formData: {
        entite_id: 'entity-1',
        date_fermeture: '2025-05-01',
        ca_ttc: '2000',
        ca_ht: '1800',
        commentaire: 'Données à restaurer après navigation',
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

    // Rendu du composant avec le routeur et les contextes nécessaires
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/mock-return']}>
          <Routes>
            <Route path="/finance/add-cash-closing" element={<AddCashClosing />} />
            <Route path="/mock-return" element={<MockReturnComponent />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    // Vérifier que nous sommes sur la page de retour
    expect(screen.getByText('Page de retour')).toBeInTheDocument();

    // Cliquer sur le bouton pour retourner à la fermeture de caisse
    fireEvent.click(screen.getByText('Retourner à la fermeture de caisse'));

    // Attendre que la page de fermeture de caisse se charge
    await waitFor(() => {
      expect(screen.getByText(/Ajouter une fermeture de caisse/i)).toBeInTheDocument();
    });

    // Vérifier que les données ont été restaurées
    await waitFor(() => {
      const commentaireInput = screen.getByLabelText(/Commentaire/i) as HTMLTextAreaElement;
      expect(commentaireInput.value).toBe('Données à restaurer après navigation');
      
      // Vérifier que les multibancs ont été restaurés
      expect(screen.getByText('Semaine 18')).toBeInTheDocument();
      expect(screen.getByText('480,00 €')).toBeInTheDocument();
    });
  });
});