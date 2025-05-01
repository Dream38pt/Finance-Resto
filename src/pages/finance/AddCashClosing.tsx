import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { theme } from '../../theme';

// Clé pour le localStorage
const DRAFT_FERMETURE_KEY = 'draftFermetureCaisse';
// Version du format de données pour la compatibilité future
const DRAFT_VERSION = '1.0';

interface FermCaisse {
  id: string;
  date_fermeture: string;
  ca_ttc: number;
  ca_ht: number;
  depot_banque_theorique: number | null;
  depot_banque_reel: number | null;
  est_valide: boolean;
  commentaire: string | null;
  entite_id: string;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface Multibanc {
  id?: string;
  periode: string;
  montant_brut: string;
  montant_reel: string;
  commentaire: string;
}

interface FactureDepense {
  id: string;
  entite_id: string;
  tiers_id: string;
  numero_document: string | null;
  date_facture: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  mode_paiement_id: string;
  commentaire: string | null;
  tiers?: {
    code: string;
    nom: string;
  };
  mode_paiement?: {
    code: string;
    libelle: string;
  };
}

interface DraftFermeture {
  formData: {
    entite_id: string;
    date_fermeture: string;
    ca_ttc: string;
    ca_ht: string;
    commentaire: string;
    depot_banque_theorique: string;
    depot_banque_reel: string;
  };
  multibancs: Multibanc[];
  factures?: FactureDepense[];
  editMode: boolean;
  editingFermetureId?: string;
  version?: string;
  timestamp?: number;
}

function AddCashClosing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  // Utiliser une fonction d'initialisation pour editMode qui prend en compte tous les cas
  const [editMode, setEditMode] = useState(() => {
    console.log('Initialisation de editMode avec location.state:', location.state);
    
    // Cas 1: Retour de la page de facture
    if (location.state?.returnTo === '/finance/add-cash-closing') {
      console.log('Retour de facture, editMode:', location.state.editMode);
      return location.state.editMode ?? false;
    }
    
    // Cas 2: Navigation directe avec state
    if (location.state?.editMode !== undefined) {
      console.log('Navigation directe avec editMode:', location.state.editMode);
      return location.state.editMode;
    }
    
    // Cas 3: Vérifier le localStorage
    try {
      const savedDraft = localStorage.getItem(DRAFT_FERMETURE_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        console.log('Brouillon trouvé dans localStorage, editMode:', parsedDraft.editMode);
        return parsedDraft.editMode || false;
      }
    } catch (e) {
      console.error('Erreur lors de la lecture du brouillon:', e);
    }
    
    // Cas par défaut
    console.log('Valeur par défaut pour editMode: false');
    return false;
  });
  
  // Utiliser une fonction d'initialisation pour editingFermeture qui prend en compte tous les cas
  const [editingFermeture, setEditingFermeture] = useState<FermCaisse | undefined>(() => {
    console.log('Initialisation de editingFermeture avec location.state:', location.state);
    
    // Cas 1: Retour de la page de facture
    if (location.state?.returnTo === '/finance/add-cash-closing') {
      console.log('Retour de facture, editingFermeture:', location.state.editingFermeture);
      return location.state.editingFermeture || undefined;
    }
    
    // Cas 2: Navigation directe avec fermeture
    if (location.state?.fermeture) {
      console.log('Navigation directe avec fermeture:', location.state.fermeture);
      return location.state.fermeture;
    }
    
    // Cas 3: Vérifier le localStorage
    try {
      const savedDraft = localStorage.getItem(DRAFT_FERMETURE_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        if (parsedDraft.editMode && parsedDraft.editingFermetureId) {
          console.log('Brouillon avec editingFermetureId trouvé:', parsedDraft.editingFermetureId);
          // Ici, on ne peut pas restaurer l'objet complet, mais on peut stocker l'ID
          // et charger les détails plus tard
          return { id: parsedDraft.editingFermetureId } as FermCaisse;
        }
      }
    } catch (e) {
      console.error('Erreur lors de la lecture du brouillon:', e);
    }
    
    // Cas par défaut
    console.log('Aucune fermeture trouvée, retourne undefined');
    return undefined;
  });
  
  const [draftLoaded, setDraftLoaded] = useState(false);
  
  const [revenirDepuisFacture, setRevenirDepuisFacture] = useState(false);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(false);
  const [multibancs, setMultibancs] = useState<Multibanc[]>([]);
  const [factures, setFactures] = useState<FactureDepense[]>([]);
  const [showMultibancForm, setShowMultibancForm] = useState(false);
  const [editingMultibanc, setEditingMultibanc] = useState<Multibanc | null>(null);
  const [multibancFormData, setMultibancFormData] = useState<Multibanc>({
    periode: '',
    montant_brut: '',
    montant_reel: '',
    commentaire: ''
  });
  const [initialFormState, setInitialFormState] = useState<DraftFermeture | null>(null);
  
  // Initialisation du formData à partir du localStorage ou des valeurs par défaut
  const [formData, setFormData] = useState(() => {
    console.log('Initialisation de formData avec editingFermeture:', editingFermeture);
    
    // Si c'est une nouvelle entrée explicite, utiliser des valeurs vides
    if (location.state?.isNewEntry) {
      console.log('Nouvelle entrée détectée, initialisation avec des valeurs vides');
      return {
        entite_id: '',
        date_fermeture: new Date().toISOString().split('T')[0],
        ca_ttc: '',
        ca_ht: '',
        commentaire: '',
        depot_banque_theorique: '0',
        depot_banque_reel: '0'
      };
    }
    
    // Essayer de charger depuis le localStorage d'abord
    try {
      const savedDraft = localStorage.getItem(DRAFT_FERMETURE_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        console.log('Brouillon trouvé dans localStorage, formData:', parsedDraft.formData);
        return parsedDraft.formData;
      }
    } catch (e) {
      console.error('Erreur lors de la lecture du brouillon:', e);
    }
    
    // Sinon, utiliser les valeurs de editingFermeture ou les valeurs par défaut
    return {
      entite_id: editingFermeture?.entite_id || '',
      date_fermeture: editingFermeture?.date_fermeture || new Date().toISOString().split('T')[0],
      ca_ttc: editingFermeture?.ca_ttc?.toString() || '',
      ca_ht: editingFermeture?.ca_ht?.toString() || '',
      commentaire: editingFermeture?.commentaire || '',
      depot_banque_theorique: editingFermeture?.depot_banque_theorique?.toString() || '0',
      depot_banque_reel: editingFermeture?.depot_banque_reel?.toString() || '0'
    };
  });
  
  // Fonction pour charger le brouillon depuis le localStorage
  const loadDraftFromStorage = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_FERMETURE_KEY);
      if (!savedDraft) return null;

      const parsedDraft: DraftFermeture = JSON.parse(savedDraft);

      // Vérifier la version du format de données
      if (!parsedDraft.version || parsedDraft.version !== DRAFT_VERSION) {
        localStorage.removeItem(DRAFT_FERMETURE_KEY);
        return null;
      }

      // Ne pas vérifier la compatibilité ici, car on veut restaurer le brouillon
      // même si le mode a changé (par exemple, après un retour de navigation)
      console.log('Brouillon chargé:', parsedDraft);

      return parsedDraft;
    } catch (e) {
      console.error('Erreur lors de la récupération du brouillon:', e);
      localStorage.removeItem(DRAFT_FERMETURE_KEY);
      return null;
    }
  };
  
  // Fonction pour sauvegarder le brouillon dans le localStorage
  const saveDraftToStorage = () => {
    // Ne pas sauvegarder si les champs obligatoires ne sont pas remplis
    if (!formData.entite_id) return;
    
    const draftData: DraftFermeture = {
      formData,
      multibancs,
      factures,
      editMode,
      editingFermetureId: editingFermeture?.id,
      version: DRAFT_VERSION,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(DRAFT_FERMETURE_KEY, JSON.stringify(draftData));
      console.log('Brouillon sauvegardé:', draftData);
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du brouillon:', e);
      showToast({
        label: 'Erreur lors de la sauvegarde du brouillon',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  // Effet pour charger le brouillon au chargement initial du composant
  useEffect(() => {
    if (draftLoaded) return;
    
    // Si c'est une nouvelle entrée explicite, ne pas charger de brouillon
    if (location.state?.isNewEntry) {
      console.log('Nouvelle entrée, pas de chargement de brouillon');
      setDraftLoaded(true);
      return;
    }
    
    // Charger le brouillon depuis le localStorage
    const draft = loadDraftFromStorage();
    if (draft) {
      console.log('Brouillon chargé au démarrage');
      setFormData(draft.formData);
      setMultibancs(draft.multibancs);
      if (draft.factures) {
        setFactures(draft.factures);
      }
      setInitialFormState(draft);
      
      // Mettre à jour le mode d'édition et la fermeture en cours d'édition
      if (draft.editMode !== undefined) {
        setEditMode(draft.editMode);
      }
      
      // Si on a un ID de fermeture mais pas l'objet complet, il faudra le charger
      if (draft.editingFermetureId && (!editingFermeture || editingFermeture.id !== draft.editingFermetureId)) {
        // Charger les détails de la fermeture depuis la base de données
        const fetchFermeture = async () => {
          try {
            const { data, error } = await supabase
              .from('fin_ferm_caisse')
              .select('*')
              .eq('id', draft.editingFermetureId)
              .single();
            
            if (error) throw error;
            if (data) {
              setEditingFermeture(data);
            }
          } catch (err) {
            console.error('Erreur lors du chargement de la fermeture:', err);
          }
        };
        
        fetchFermeture();
      }
    }
    
    setDraftLoaded(true);
  }, [editMode, editingFermeture]);

  // Effet spécifique pour gérer le retour de navigation depuis la page d'ajout de dépense
  useEffect(() => {
    if (location.state?.returnTo === '/finance/add-cash-closing') {
      console.log('Retour depuis facture avec state:', location.state);
      setRevenirDepuisFacture(true);

      // Préserver le mode d'édition lors du retour
      if (location.state.editMode !== undefined) {
        setEditMode(location.state.editMode);
        console.log('Mode édition restauré:', location.state.editMode);
      }

      if (location.state.editingFermeture) {
        setEditingFermeture(location.state.editingFermeture);
        console.log('Fermeture restaurée:', location.state.editingFermeture);
      }

      const draft = loadDraftFromStorage();
      
      if (draft) {
        setFormData(draft.formData);
        setMultibancs(draft.multibancs);
        if (draft.factures) {
          setFactures(draft.factures);
        } else {
          // Si pas de factures dans le brouillon, recharger depuis la base
          fetchFactures();
        }
      }
      
      const timeoutId = setTimeout(() => {
        setRevenirDepuisFacture(false);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [location.state]);

  // Effet pour gérer les événements de navigation du navigateur (F5, retour arrière, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Sauvegarder le brouillon avant de quitter la page
      saveDraftToStorage();
      
      // Afficher une confirmation si des modifications non sauvegardées
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, multibancs, factures]);

  // Vérifier s'il y a des modifications non sauvegardées
  const hasUnsavedChanges = () => {
    if (!initialFormState) return false;
    
    // Comparer l'état actuel avec l'état initial
    return JSON.stringify(formData) !== JSON.stringify(initialFormState.formData) ||
           JSON.stringify(multibancs) !== JSON.stringify(initialFormState.multibancs);
  };

  useEffect(() => {
    fetchEntites();
    if (editMode && editingFermeture) {
      fetchMultibancs(editingFermeture.id);
      fetchFacturesForFermeture(editingFermeture.id);
    }
  }, [editMode, editingFermeture]);

  useEffect(() => {
    // Calculer le dépôt théorique
    if (formData.entite_id && formData.date_fermeture) {
      calculateDepotTheorique();
    }
  }, [formData.ca_ttc, multibancs, factures]);

  // Effet pour charger les factures quand l'entité ou la date change
  useEffect(() => {
    if (formData.entite_id && formData.date_fermeture && !revenirDepuisFacture) {
      fetchFactures();
    }
  }, [formData.entite_id, formData.date_fermeture]);

  // Effet pour sauvegarder le brouillon dans le localStorage
  useEffect(() => {
    // Sauvegarder le brouillon à chaque changement significatif
    if (draftLoaded) {
      saveDraftToStorage();
    }
  }, [formData, multibancs, draftLoaded]);

  const fetchEntites = async () => {
    try {
      const { data, error } = await supabase
        .from('entite')
        .select('id, code, libelle')
        .order('code');

      if (error) throw error;
      setEntites(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des entités:', err);
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors du chargement des entités',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const fetchMultibancs = async (fermCaisseId: string) => {
    try {
      const { data, error } = await supabase
        .from('fin_ferm_multibanc')
        .select('*')
        .eq('id_ferm_caisse', fermCaisseId);

      if (error) throw error;
      
      setMultibancs(data.map(item => ({
        id: item.id,
        periode: item.periode,
        montant_brut: item.montant_brut.toString(),
        montant_reel: item.montant_reel.toString(),
        commentaire: item.commentaire || ''
      })) || []);
    } catch (err) {
      console.error('Erreur lors du chargement des multibancs:', err);
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors du chargement des multibancs',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const fetchFacturesForFermeture = async (fermCaisseId: string) => {
    try {
      // Récupérer les IDs des factures liées à cette fermeture
      const { data: factureLinks, error: linksError } = await supabase
        .from('fin_ferm_facturedepenses')
        .select('id_facture')
        .eq('id_ferm_caisse', fermCaisseId);

      if (linksError) throw linksError;
      
      if (!factureLinks || factureLinks.length === 0) {
        console.log('Aucune facture liée à cette fermeture');
        return;
      }

      const factureIds = factureLinks.map(link => link.id_facture);
      
      // Récupérer les factures
      const { data, error } = await supabase
        .from('fin_facture_achat')
        .select(`
          *,
          tiers:tiers_id (
            code,
            nom
          ),
          mode_paiement:mode_paiement_id (
            code,
            libelle
          )
        `)
        .in('id', factureIds);

      if (error) throw error;
      console.log('Factures liées à la fermeture:', data?.length || 0);
      setFactures(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des factures liées:', err);
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors du chargement des factures liées',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const fetchFactures = async () => {
    if (!formData.entite_id || !formData.date_fermeture) return;

    try {
      console.log('Chargement des factures pour:', formData.entite_id, formData.date_fermeture);
      
      // Récupérer les modes de paiement en espèces
      const { data: modesPaiement, error: modesError } = await supabase
        .from('fin_mode_paiement')
        .select('id')
        .eq('paiement_par_espece', true);

      if (modesError) throw modesError;
      
      if (!modesPaiement || modesPaiement.length === 0) {
        console.warn('Aucun mode de paiement en espèces trouvé');
        setFactures([]);
        return;
      }

      const modeIds = modesPaiement.map(mode => mode.id);
      console.log('Modes de paiement en espèces:', modeIds);

      // Récupérer les factures
      const { data, error } = await supabase
        .from('fin_facture_achat')
        .select(`
          *,
          tiers:tiers_id (
            code,
            nom
          ),
          mode_paiement:mode_paiement_id (
            code,
            libelle
          )
        `)
        .eq('entite_id', formData.entite_id)
        .eq('date_facture', formData.date_fermeture)
        .in('mode_paiement_id', modeIds);

      if (error) throw error;
      console.log('Factures trouvées:', data?.length || 0);
      setFactures(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des factures:', err);
      showToast({
        label: err instanceof Error ? err.message : 'Erreur lors du chargement des factures',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  const calculateDepotTheorique = () => {
    // Calculer le total des multibancs
    const totalMultibancs = multibancs.reduce((sum, item) => {
      return sum + (parseFloat(item.montant_reel) || 0);
    }, 0);

    // Calculer le total des factures
    const totalFactures = factures.reduce((sum, facture) => {
      return sum + facture.montant_ttc;
    }, 0);

    // Calculer le dépôt théorique
    const caTtc = parseFloat(formData.ca_ttc) || 0;
    const depotTheorique = caTtc - totalMultibancs - totalFactures;

    // Mettre à jour le formulaire
    setFormData(prev => ({
      ...prev,
      depot_banque_theorique: depotTheorique.toFixed(2)
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultibancInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setMultibancFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMultibanc = () => {
    if (!multibancFormData.periode || !multibancFormData.montant_brut || !multibancFormData.montant_reel) {
      showToast({
        label: 'Veuillez remplir tous les champs obligatoires',
        icon: 'AlertTriangle',
        color: theme.colors.warning
      });
      return;
    }

    if (editingMultibanc) {
      // Mode édition
      setMultibancs(prev => prev.map(item => 
        item === editingMultibanc ? { ...multibancFormData, id: editingMultibanc.id } : item
      ));
      setEditingMultibanc(null);
    } else {
      // Mode ajout
      setMultibancs(prev => [...prev, multibancFormData]);
    }

    // Réinitialiser le formulaire
    setMultibancFormData({
      periode: '',
      montant_brut: '',
      montant_reel: '',
      commentaire: ''
    });
    setShowMultibancForm(false);
  };

  const handleEditMultibanc = (multibanc: Multibanc) => {
    setEditingMultibanc(multibanc);
    setMultibancFormData(multibanc);
    setShowMultibancForm(true);
  };

  const handleDeleteMultibanc = (multibanc: Multibanc) => {
    setMultibancs(prev => prev.filter(item => item !== multibanc));
  };

  const handleSubmit = async (eOrValidate: React.FormEvent | boolean) => {
    // Détermine si on valide la fermeture ou si on l'enregistre simplement
    const validate = typeof eOrValidate === 'boolean' ? eOrValidate : false;
    
    // Si c'est un événement de formulaire, empêcher le comportement par défaut
    if (typeof eOrValidate !== 'boolean') {
      eOrValidate.preventDefault();
    }
    
    setLoading(true);

    try {
      const fermCaisseData = {
        entite_id: formData.entite_id,
        date_fermeture: formData.date_fermeture,
        ca_ttc: parseFloat(formData.ca_ttc),
        ca_ht: parseFloat(formData.ca_ht),
        commentaire: formData.commentaire || null,
        depot_banque_theorique: parseFloat(formData.depot_banque_theorique) || null,
        depot_banque_reel: parseFloat(formData.depot_banque_reel) || null,
        est_valide: validate
      };

      let fermCaisseId: string;

      if (editMode && editingFermeture) {
        // Mode modification
        const { data, error } = await supabase
          .from('fin_ferm_caisse')
          .update(fermCaisseData)
          .eq('id', editingFermeture.id)
          .select()
          .single();

        if (error) throw error;
        fermCaisseId = data.id;

        // Supprimer les multibancs existants
        const { error: deleteError } = await supabase
          .from('fin_ferm_multibanc')
          .delete()
          .eq('id_ferm_caisse', fermCaisseId);

        if (deleteError) throw deleteError;

        // Supprimer les factures de dépenses existantes
        const { error: deleteFacturesError } = await supabase
          .from('fin_ferm_facturedepenses')
          .delete()
          .eq('id_ferm_caisse', fermCaisseId);

        if (deleteFacturesError) throw deleteFacturesError;
      } else {
        // Mode création
        const { data, error } = await supabase
          .from('fin_ferm_caisse')
          .insert([fermCaisseData])
          .select()
          .single();

        if (error) throw error;
        fermCaisseId = data.id;
      }

      // Insérer les multibancs
      if (multibancs.length > 0) {
        const multibancsData = multibancs.map(item => ({
          id_ferm_caisse: fermCaisseId,
          periode: item.periode,
          montant_brut: parseFloat(item.montant_brut),
          montant_reel: parseFloat(item.montant_reel),
          commentaire: item.commentaire || null
        }));

        const { error: multibancError } = await supabase
          .from('fin_ferm_multibanc')
          .insert(multibancsData);

        if (multibancError) throw multibancError;
      }

      // Insérer les factures de dépenses
      if (factures.length > 0) {
        const facturesData = factures.map(facture => ({
          id_ferm_caisse: fermCaisseId,
          id_facture: facture.id
        }));

        const { error: facturesError } = await supabase
          .from('fin_ferm_facturedepenses')
          .insert(facturesData);

        if (facturesError) throw facturesError;
      }

      // Supprimer le brouillon du localStorage après enregistrement réussi
      localStorage.removeItem(DRAFT_FERMETURE_KEY);

      // Mettre à jour l'état initial pour éviter l'avertissement de modifications non sauvegardées
      setInitialFormState(null);

      showToast({
        label: `Fermeture de caisse ${editMode ? 'modifiée' : 'créée'} avec succès`,
        icon: 'Check',
        color: '#10b981'
      });

      navigate('/finance/cash-closing');
    } catch (err) {
      showToast({
        label: err instanceof Error ? err.message : `Erreur lors de la ${editMode ? 'modification' : 'création'}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour naviguer vers la page d'ajout de dépense
  const handleAddDepense = () => {
    // Reconstituer manuellement le brouillon avant de partir
    const currentEditingFermeture = editingFermeture;

    const draftData: DraftFermeture = {
      formData,
      multibancs,
      factures,
      editMode,
      editingFermetureId: currentEditingFermeture?.id,
      version: DRAFT_VERSION,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(DRAFT_FERMETURE_KEY, JSON.stringify(draftData));
      console.log('Brouillon sauvegardé avant ajout dépense:', draftData);
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du brouillon:', e);
      showToast({
        label: 'Erreur lors de la sauvegarde du brouillon',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
    
    // Naviguer vers la page d'ajout de facture
    navigate('/finance/nouvelle-facture', { 
      state: {
        selectedEntiteId: formData.entite_id,
        selectedDate: formData.date_fermeture,
        returnTo: '/finance/add-cash-closing',
        editMode,
        editingFermeture: currentEditingFermeture
      } 
    });
  };

  return (
    <>
      <PageSection
        title={editMode ? `Modifier une fermeture de caisse` : "Ajouter une fermeture de caisse"}
        description={editMode ? `Modification d'une fermeture de caisse existante` :  "Création d'une nouvelle fermeture de caisse"}
      >        
        <Form size={70} onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Restaurant" required>
              <select
                name="entite_id"
                value={formData.entite_id}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '2px solid var(--color-secondary)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem'
                }}
                required
              >
                <option value="">Sélectionner un restaurant</option>
                {entites.map(entite => (
                  <option key={entite.id} value={entite.id}>
                    {entite.code} - {entite.libelle}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Date de fermeture" required>
              <FormInput
                type="date"
                name="date_fermeture"
                value={formData.date_fermeture}
                onChange={handleInputChange}
                required
              />
            </FormField>

            <FormField label="CA TTC" required>
              <FormInput
                type="number"
                name="ca_ttc"
                value={formData.ca_ttc}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
              />
            </FormField>

            <FormField label="CA HT" required>
              <FormInput
                type="number"
                name="ca_ht"
                value={formData.ca_ht}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
              />
            </FormField>

            <FormField label="Commentaire" style={{ gridColumn: 'span 2' }}>
              <textarea
                name="commentaire"
                value={formData.commentaire}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '2px solid var(--color-secondary)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </FormField>
          </div>
        </Form>
      </PageSection>

      <PageSection
        subtitle="Saisie encaissements"
        description="Saisie des encaissements multibanc"
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label="Ajouter une ligne"
            icon="Plus"
            color={theme.colors.primary}
            onClick={() => {
              setEditingMultibanc(null);
              setMultibancFormData({
                periode: '',
                montant_brut: '',
                montant_reel: '',
                commentaire: ''
              });
              setShowMultibancForm(true);
            }}
          />
        </div>

        {showMultibancForm && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
              {editingMultibanc ? 'Modifier un encaissement' : 'Nouvel encaissement'}
            </h3>
            <Form size={100}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '1rem', alignItems: 'end' }}>
                <FormField label="Période" required>
                  <FormInput
                    type="text"
                    name="periode"
                    value={multibancFormData.periode}
                    onChange={handleMultibancInputChange}
                    placeholder="Ex: Semaine 12"
                    required
                  />
                </FormField>

                <FormField label="Montant brut" required>
                  <FormInput
                    type="number"
                    name="montant_brut"
                    value={multibancFormData.montant_brut}
                    onChange={handleMultibancInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </FormField>

                <FormField label="Montant réel" required>
                  <FormInput
                    type="number"
                    name="montant_reel"
                    value={multibancFormData.montant_reel}
                    onChange={handleMultibancInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </FormField>

                <FormField label="Commentaire">
                  <FormInput
                    type="text"
                    name="commentaire"
                    value={multibancFormData.commentaire}
                    onChange={handleMultibancInputChange}
                    placeholder="Commentaire optionnel"
                  />
                </FormField>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                
                <Button
                  label="Annuler"
                  type="button"
                  icon="X"
                  color={theme.colors.secondary}
                  onClick={() => {
                    setShowMultibancForm(false);
                    setEditingMultibanc(null);
                  }}
                />
                <Button
                  label={editingMultibanc ? "Modifier" : "Ajouter"}
                  type="button"
                  icon={editingMultibanc ? "Save" : "Plus"}
                  color={theme.colors.primary}
                  onClick={handleAddMultibanc}
                />
              </div>
            </Form>
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Période</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Montant brut</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Montant réel</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {multibancs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Aucun encaissement multibanc trouvé.
                </td>
              </tr>
            ) : (
              multibancs.map((multibanc, index) => (
                <tr key={index}>
                  <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEditMultibanc(multibanc)}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          borderRadius: '4px',
                          color: theme.colors.primary,
                          transition: 'all 0.2s'
                        }}
                        title="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMultibanc(multibanc)}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          borderRadius: '4px',
                          color: '#ef4444',
                          transition: 'all 0.2s'
                        }}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {multibanc.periode}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {parseFloat(multibanc.montant_brut).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {parseFloat(multibanc.montant_reel).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {multibanc.commentaire || '-'}
                  </td>
                </tr>
              ))
            )}
            {multibancs.length > 0 && (
              <tr>
                <td colSpan={2} style={{ 
                  padding: '8px', 
                  borderTop: '2px solid #e5e7eb',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '0.875rem',
                  fontWeight: 'bold', 
                  textAlign: 'right'
                }}>
                  Total :
                </td>
                <td style={{ 
                  padding: '8px', 
                  borderTop: '2px solid #e5e7eb',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>
                  {multibancs.reduce((sum, item) => sum + (parseFloat(item.montant_brut) || 0), 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </td>
                <td style={{ 
                  padding: '8px', 
                  borderTop: '2px solid #e5e7eb',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>
                  {multibancs.reduce((sum, item) => sum + (parseFloat(item.montant_reel) || 0), 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </td>
                <td style={{ padding: '8px', borderTop: '2px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}></td>
              </tr>
            )}
          </tbody>
        </table>
      </PageSection>

      <PageSection
        subtitle="Liste Dépenses"
        description="Liste des factures payées en espèces à la date de fermeture"
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label="Ajouter une dépense"
            icon="Plus"
            color={theme.colors.primary}
            onClick={handleAddDepense}
            disabled={!formData.entite_id || !formData.date_fermeture}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', padding: '8px', borderBottom: '2px solid #e5e7eb' }}></th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Fournisseur</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>N° Document</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Mode paiement</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Montant HT</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Montant TVA</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #e5e7eb', fontSize: '0.875rem' }}>Montant TTC</th>
            </tr>
          </thead>
          <tbody>
            {factures.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '8px', textAlign: 'center', fontSize: '0.875rem' }}>
                  Aucune facture trouvée.
                </td>
              </tr>
            ) : (
              factures.map((facture) => (
                <tr key={facture.id}>
                  <td style={{ padding: '6px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          // Sauvegarder l'état actuel dans le localStorage avant de naviguer
                          const draftData: DraftFermeture = {
                            formData,
                            multibancs,
                            factures,
                            editMode,
                            editingFermetureId: editingFermeture?.id,
                            version: DRAFT_VERSION,
                            timestamp: Date.now()
                          };
                          
                          localStorage.setItem(DRAFT_FERMETURE_KEY, JSON.stringify(draftData));
                          
                          navigate(`/finance/nouvelle-facture`, { 
                            state: { 
                              editMode: true,
                              invoice: facture,
                              returnTo: '/finance/add-cash-closing',
                              editingFermeture: editingFermeture,
                              editMode: editMode
                            } 
                          });
                        }}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          borderRadius: '4px',
                          color: theme.colors.primary,
                          transition: 'all 0.2s'
                        }}
                        title="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {facture.tiers?.nom || '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {facture.numero_document || '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
                    {facture.mode_paiement?.libelle || '-'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {facture.montant_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {facture.montant_tva.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', textAlign: 'right' }}>
                    {facture.montant_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                </tr>
              ))
            )}
            {factures.length > 0 && (
              <tr>
                <td colSpan={6} style={{ 
                  padding: '8px', 
                  borderTop: '2px solid #e5e7eb',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '0.875rem',
                  fontWeight: 'bold', 
                  textAlign: 'right'
                }}>
                  Total :
                </td>
                <td style={{ 
                  padding: '8px', 
                  borderTop: '2px solid #e5e7eb',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>
                  {factures.reduce((sum, facture) => sum + facture.montant_ttc, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </PageSection>

      <PageSection
        subtitle="Contrôle"
        description="Vérification des montants de dépôt"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="Dépôt banque théorique">
            <FormInput
              type="number"
              name="depot_banque_theorique"
              value={formData.depot_banque_theorique}
              onChange={handleInputChange}
              step="0.01"
              readOnly
              style={{ 
                backgroundColor: '#f3f4f6',
                textAlign: 'right'
              }}
            />
          </FormField>

          <FormField label="Dépôt banque réel">
            <FormInput
              type="number"
              name="depot_banque_reel"
              value={formData.depot_banque_reel}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              style={{ textAlign: 'right' }}
            />
          </FormField>
        </div>
      </PageSection>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', marginBottom: '2rem' }}>
        <Button
          label="Annuler"
          type="button"
          icon="X"
          color={theme.colors.secondary}
          onClick={() => {
            // Supprimer le brouillon du localStorage lors de l'annulation
            localStorage.removeItem(DRAFT_FERMETURE_KEY);
            navigate('/finance/cash-closing');
          }}
        />
        <Button
          label="Enregistrer"
          type="button"
          icon="Save"
          color={theme.colors.primary}
          onClick={() => handleSubmit(false)}
          disabled={loading}
        />
        <Button
          label="Valider"
          type="button"
          icon="Lock"
          color={theme.colors.success}
          onClick={() => handleSubmit(true)}
          disabled={loading}
        />
      </div>
    </>
  );
}

export default AddCashClosing;