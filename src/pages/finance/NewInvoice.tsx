import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageSection } from '../../components/layout/page-layout';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Dropdown } from '../../components/ui/dropdown';
import { FileText, Image, Upload } from 'lucide-react';
import { theme } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { InvoiceLineForm } from '../../components/invoice/InvoiceLineForm';
import { InvoiceLinesList } from '../../components/invoice/InvoiceLinesList';
import { FileUploadDialog } from '../../components/invoice/FileUploadDialog';
import type { InvoiceFormData, InvoiceLineFormData, Invoice } from '../../types/invoice';

function NewInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = location.state?.editMode || false;
  const editingInvoice = location.state?.invoice as Invoice | undefined;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [entites, setEntites] = useState<{ id: string; code: string; libelle: string; }[]>([]);
  const [tiers, setTiers] = useState<{ id: string; code: string; nom: string; }[]>([]);
  const [modesPaiement, setModesPaiement] = useState<{ id: string; code: string; libelle: string; }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [invoiceLines, setInvoiceLines] = useState([]);
  const [showLineForm, setShowLineForm] = useState(false);
  const [categories, setCategories] = useState<{ id: string; libelle: string; }[]>([]);
  const [userEntites, setUserEntites] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [editingLine, setEditingLine] = useState<InvoiceLine | null>(null);
  const [formData, setFormData] = useState<InvoiceFormData>({
    entite_id: editingInvoice?.entite_id || '',
    tiers_id: editingInvoice?.tiers_id || '',
    numero_document: editingInvoice?.numero_document || '',
    date_facture: editingInvoice?.date_facture || new Date().toISOString().split('T')[0],
    montant_ht: editingInvoice?.montant_ht.toString() || '',
    montant_tva: editingInvoice?.montant_tva.toString() || '',
    montant_ttc: editingInvoice?.montant_ttc.toString() || '',
    mode_paiement_id: editingInvoice?.mode_paiement_id || '',
    commentaire: editingInvoice?.commentaire || '',
    file: null
  });

  // Récupérer les entités auxquelles l'utilisateur a accès
  useEffect(() => {
    async function fetchUserEntiteAccess() {
      try {
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        // Vérifier si l'utilisateur est un administrateur (a le rôle admin)
        const { data: collaborateur } = await supabase
          .from('param_collaborateur')
          .select('id, role_id, param_role:role_id(libelle)')
          .eq('auth_id', user.id)
          .single();
        
        if (collaborateur?.param_role?.libelle === 'Administrateur') {
          setIsAdmin(true);
          return;
        }
        
        // Récupérer les entités auxquelles l'utilisateur a accès
        if (collaborateur) {
          const { data: habilitations } = await supabase
            .from('param_habilitation')
            .select('entite_id')
            .eq('collaborateur_id', collaborateur.id)
            .eq('est_actif', true)
            .gte('date_debut', new Date().toISOString())
            .or(`date_fin.is.null,date_fin.gte.${new Date().toISOString()}`);
          
          if (habilitations) {
            setUserEntites(habilitations.map(h => h.entite_id));
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des habilitations:', error);
      }
    }
    
    fetchUserEntiteAccess();
  }, []);

  // Chargement des données de référence
  React.useEffect(() => {
    async function fetchData() {
      try {
        // Catégories d'achat
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('fin_categorie_achat')
          .select('id, libelle')
          .eq('actif', true)
          .order('ordre_affichage')
          .order('libelle');
        if (categoriesError) throw categoriesError;
        if (categoriesData) setCategories(categoriesData);

        // Entités
        // Toutes les entités seront chargées, mais filtrées dans le rendu
        const { data: entitesData } = await supabase
          .from('entite')
          .select('id, code, libelle')
          .order('code');
        if (entitesData) setEntites(entitesData);

        // Tiers
        const { data: tiersData } = await supabase
          .from('fin_tiers')
          .select('id, code, nom')
          .eq('actif', true)
          .order('nom');
        if (tiersData) setTiers(tiersData);

        // Modes de paiement
        const { data: modesData } = await supabase
          .from('fin_mode_paiement')
          .select('id, code, libelle')
          .eq('actif', true)
          .order('ordre_affichage')
          .order('code');
        if (modesData) setModesPaiement(modesData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    }
    fetchData();
  }, []);

  // Filtrer les entités selon les habilitations de l'utilisateur
  const filteredEntites = isAdmin 
    ? entites 
    : entites.filter(entite => userEntites.includes(entite.id));


  // Charger les lignes de facture si on est en mode édition
  React.useEffect(() => {
    async function fetchInvoiceLines() {
      if (!editingInvoice) return;
      
      setLoadingLines(true);
      try {
        const { data, error } = await supabase
          .from('fin_ligne_facture_achat')
          .select(`
            *,
            categorie:categorie_id (
              libelle
            )
          `)
          .eq('facture_id', editingInvoice.id);

        if (error) throw error;
        setInvoiceLines(data || []);
      } catch (err) {
        console.error('Erreur lors du chargement des lignes:', err);
        showToast({
          label: 'Erreur lors du chargement des lignes de facture',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      } finally {
        setLoadingLines(false);
      }
    }

    fetchInvoiceLines();
  }, [editingInvoice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Mise à jour du state avec potentiel recalcul du TTC
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Si on modifie montant_ht ou montant_tva, on recalcule le TTC
      if (name === 'montant_ht' || name === 'montant_tva') {
        const ht = parseFloat(newData.montant_ht);
        const tva = parseFloat(newData.montant_tva);
        
        // Recalcul uniquement si les deux valeurs sont des nombres valides
        if (!isNaN(ht) && !isNaN(tva)) {
          newData.montant_ttc = (ht + tva).toFixed(2);
        }
      }
      
      return newData;
    });
  };

  const handleAffectationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'xls', 'xlsx'];
    const maxSize = 10 * 1024 * 1024; // 10 Mo

    if (!fileExt || !allowedExts.includes(fileExt)) {
      throw new Error('Type de fichier non autorisé');
    }

    if (file.size > maxSize) {
      throw new Error('Le fichier est trop volumineux (max 10 Mo)');
    }

    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('factures-achat')
      .upload(fileName, file);

    if (error) throw error;
    return data.path;
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setShowFileDialog(false);
  };

  const handleAddLine = (lineData: InvoiceLineFormData) => {
    if (editingLine) {
      // Mode modification
      setInvoiceLines(prev => {
        return prev.map(line =>
          line.id === editingLine.id ? {
            ...line,
            categorie_id: lineData.categorie_id,
            designation: lineData.designation,
            quantite: Number(lineData.quantite),
            prix_unitaire_ht: Number(lineData.prix_unitaire_ht),
            montant_ht: Number(lineData.montant_ht),
            montant_tva: Number(lineData.montant_tva || '0'),
            commentaire: lineData.commentaire,
            categorie: {
              libelle: categories.find(c => c.id === lineData.categorie_id)?.libelle || ''
            }
          } : line
        );
      });
    } else {
      // Mode ajout
      setInvoiceLines(prev => {
        return [...prev, {
          id: Date.now().toString(), // ID temporaire
          categorie_id: lineData.categorie_id,
          designation: lineData.designation,
          quantite: Number(lineData.quantite),
          prix_unitaire_ht: Number(lineData.prix_unitaire_ht),
          montant_ht: Number(lineData.montant_ht),
          montant_tva: Number(lineData.montant_tva || '0'),
          commentaire: lineData.commentaire,
          categorie: {
            libelle: categories.find(c => c.id === lineData.categorie_id)?.libelle || ''
          }
        }];
      });
    }
    
    // Fermer le formulaire
    setShowLineForm(false);
    setEditingLine(null);
  };

  const handleEditLine = (line: InvoiceLine) => {
    setEditingLine(line);
    setShowLineForm(true);
  };

  const handleDeleteLine = (line: InvoiceLine) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) {
      // Supprimer la ligne
      setInvoiceLines(prev => prev.filter(l => l.id !== line.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called");

    const montantHT = typeof formData.montant_ht === 'string' ? parseFloat(formData.montant_ht) : formData.montant_ht;
    const montantTVA = typeof formData.montant_tva === 'string' ? parseFloat(formData.montant_tva) : formData.montant_tva;
    const montantTTC = typeof formData.montant_ttc === 'string' ? parseFloat(formData.montant_ttc) : formData.montant_ttc;

    console.log('HT', montantHT, 'TVA', montantTVA, 'TTC', montantTTC);

    // Vérifier que toutes les lignes ont un categorie_id
    const missingCategories = invoiceLines.some(line => !line.categorie_id);
    if (missingCategories) {
      showToast({
        label: 'Erreur : certaines lignes n\'ont pas de catégorie analytique.',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    // Vérifier s'il y a des lignes de facture
    if (invoiceLines.length === 0) {
      showToast({
        label: 'Impossible d\'enregistrer la facture : au moins une ligne analytique est requise.',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    console.log('formData final:', formData);
    console.log('Montants calculés:', montantHT, montantTVA, montantTTC);

    console.log("DATA À ENVOYER :", {
      ht: montantHT,
      tva: montantTVA,
      ttc: montantTTC
    });

    setLoading(true);

    try {
      // Log des données avant l'insertion
      console.log('Données de la facture:', {
        formData,
        invoiceLines,
        editMode,
        editingInvoice
      });

      let lien_piece_jointe = null;
      if (selectedFile) {
        lien_piece_jointe = await handleFileUpload(selectedFile);
      } else if (editingInvoice) {
        lien_piece_jointe = editingInvoice.lien_piece_jointe;
      }

      // Démarrer une transaction
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // 1. Créer ou mettre à jour la facture
      let factureId;
      if (editMode && editingInvoice) {
        const { data, error } = await supabase
          .from('fin_facture_achat')
          .update({
            entite_id: formData.entite_id,
            tiers_id: formData.tiers_id,
            numero_document: formData.numero_document || null,
            date_facture: formData.date_facture,
            montant_ht: montantHT,
            montant_tva: montantTVA,
            montant_ttc: montantTTC,
            mode_paiement_id: formData.mode_paiement_id,
            commentaire: formData.commentaire || null,
            lien_piece_jointe
          })
          .eq('id', editingInvoice.id)
          .select()
          .single();

        console.log("RÉPONSE SUPABASE :", data);
        if (error) throw error;
        factureId = editingInvoice.id;

        // Supprimer les anciennes lignes
        const { error: deleteError } = await supabase
          .from('fin_ligne_facture_achat')
          .delete()
          .eq('facture_id', factureId);

        if (deleteError) throw deleteError;
      } else {
        const { data, error } = await supabase
          .from('fin_facture_achat')
          .insert([{
            entite_id: formData.entite_id,
            tiers_id: formData.tiers_id,
            numero_document: formData.numero_document || null,
            date_facture: formData.date_facture,
            montant_ht: montantHT,
            montant_tva: montantTVA,
            montant_ttc: montantTTC,
            mode_paiement_id: formData.mode_paiement_id,
            commentaire: formData.commentaire || null,
            lien_piece_jointe
          }])
          .select()
          .single();

        if (error) throw error;
        factureId = data.id;
      }

      // 2. Créer les nouvelles lignes
      const lignesData = invoiceLines.map(line => ({
        facture_id: factureId,
        categorie_id: line.categorie_id,
        designation: line.designation,
        quantite: line.quantite,
        prix_unitaire_ht: line.prix_unitaire_ht,
        montant_ht: line.montant_ht,
        montant_tva: line.montant_tva,
        commentaire: line.commentaire || null
      }));

      const { error: lignesError } = await supabase
        .from('fin_ligne_facture_achat')
        .insert(lignesData);

      if (lignesError) throw lignesError;

      showToast({
        label: `Facture ${editMode ? 'modifiée' : 'enregistrée'} avec succès`,
        icon: 'Check',
        color: '#10b981'
      });

      navigate('/finance/invoice');
    } catch (error) {
      console.error('Erreur:', error);
      showToast({
        label: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const isImage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext === 'jpg' || ext === 'jpeg' || ext === 'png';
  };

  return (
    <>
      <PageSection
        title={editMode ? "Modifier la facture" : "Nouvelle facture"}
        description={editMode ? "Modification d'une facture existante" : "Saisie d'une nouvelle facture fournisseur"}
        style={{ marginBottom: '1rem' }}
      >
        <Form size={100} columns={4} onSubmit={handleSubmit}>
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
              {filteredEntites.map(entite => (
                <option key={entite.id} value={entite.id}>
                  {entite.code} - {entite.libelle}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Date de facture" required>
            <FormInput
              type="date"
              name="date_facture"
              value={formData.date_facture}
              onChange={handleInputChange}
              required
            />
          </FormField>

          <FormField label="Mode de paiement" required>
            <select
              name="mode_paiement_id"
              value={formData.mode_paiement_id}
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
              <option value="">Sélectionner un mode de paiement</option>
              {modesPaiement.map(mode => (
                <option key={mode.id} value={mode.id}>
                  {mode.code} - {mode.libelle}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Fournisseur" required>
            <select
              name="tiers_id"
              value={formData.tiers_id}
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
              <option value="">Sélectionner un fournisseur</option>
              {tiers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.code} - {t.nom}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Numéro de document">
            <FormInput
              type="text"
              name="numero_document"
              value={formData.numero_document}
              onChange={handleInputChange}
              maxLength={40}
            />
          </FormField>

          <FormField label="Montant HT" required>
            <FormInput
              type="number"
              name="montant_ht"
              value={formData.montant_ht}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
            />
          </FormField>

          <FormField label="Montant TVA" required>
            <FormInput
              type="number"
              name="montant_tva"
              value={formData.montant_tva}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
            />
          </FormField>

          <FormField label="Montant TTC" required>
            <FormInput
              type="number"
              name="montant_ttc"
              value={formData.montant_ttc}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
            />
          </FormField>

          <FormField label="Commentaire" style={{ gridColumn: 'span 4' }}>
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
                resize: 'vertical',
                maxHeight: '150px'
              }}
            />
          </FormField>

          <FormField label="Pièce jointe" style={{ gridColumn: 'span 4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Button
                type="button"
                label={selectedFile ? "Changer le fichier" : "Ajouter un fichier"}
                icon="Upload"
                color={theme.colors.primary}
                onClick={() => setShowFileDialog(true)}
              />
              {selectedFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isImage(selectedFile.name) ? (
                    <Image size={16} style={{ color: theme.colors.primary }} />
                  ) : (
                    <FileText size={16} style={{ color: theme.colors.primary }} />
                  )}
                  <span style={{ fontSize: '0.875rem' }}>{selectedFile.name}</span>
                </div>
              )}
            </div>
          </FormField>

          <FormActions style={{ gridColumn: 'span 4' }}>
            <Button
              label="Annuler"
              type="button"
              icon="X"
              color={theme.colors.secondary}
              onClick={() => navigate('/finance/invoice')}
            />
            <Button
              label="Enregistrer"
              type="submit"
              icon="Save"
              color={theme.colors.primary}
              disabled={loading}
            />
          </FormActions>
        </Form>
      </PageSection>

      {/* Liste des lignes de facture */}
      <PageSection
        subtitle="Lignes de facture"
        description="Liste des lignes analytiques de la facture"
        style={{ 
          opacity: loadingLines ? 0.5 : 1,
          marginTop: '1rem'
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <Button
            label="Ajouter une ligne de facture"
            icon="Plus"
            color={theme.colors.primary}
            disabled={loadingLines}
            onClick={() => setShowLineForm(true)}
          />
        </div>

        {loadingLines ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Chargement des lignes de facture...
          </div>
        ) : (
          <InvoiceLinesList 
            lines={invoiceLines}
            onEdit={handleEditLine}
            onDelete={handleDeleteLine}
          />
        )}

        {showLineForm && (
          <PageSection
            subtitle={editingLine ? "Modifier la ligne de facture" : "Nouvelle ligne de facture"}
            description={editingLine ? "Modifier les informations de la ligne" : "Ajouter une nouvelle ligne analytique"} 
            style={{ marginTop: '1rem' }}
          >
            <InvoiceLineForm
              editingLine={editingLine}
              onSubmit={handleAddLine}
              onCancel={() => {
                setShowLineForm(false);
                setEditingLine(null);
              }}
            />
          </PageSection>
        )}
      </PageSection>
      
      <FileUploadDialog
        isOpen={showFileDialog}
        onClose={() => setShowFileDialog(false)}
        onUpload={handleFileSelect}
        currentFileName={editingInvoice?.lien_piece_jointe}
      />
    </>
  );
}

export default NewInvoice;