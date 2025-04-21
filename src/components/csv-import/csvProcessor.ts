import { supabase } from '../../lib/supabase';

// Types d'interface pour les données CSV
interface CSVRow {
  Entite: string;
  Date: string;
  Heure: string;
  'Docs Emitidos': string;
  'Media p/Doc S/IVA': string;
  'Media P/Doc': string;
  'Valor S/IVA': string;
  'Valor Total': string;
}

interface ProcessedData {
  id_entite: string;
  date: string;
  horaire: string;
  docs_emitidos: number | null;
  montant_moyen_ht: number | null;
  montant_moyen_ttc: number | null;
  montant_total_ht: number | null;
  montant_total_ttc: number | null;
  source: string;
}

/**
 * Détecte le séparateur utilisé dans un fichier CSV
 * @param csvContent Contenu du fichier CSV
 * @returns Le séparateur détecté (virgule ou point-virgule) ou null si non détecté
 */
function detectSeparator(csvContent: string): string | null {
  // Prendre la première ligne non vide
  const firstLine = csvContent.split(/\r?\n/).find(line => line.trim().length > 0);
  if (!firstLine) return null;
  
  // Compter les occurrences de chaque séparateur potentiel
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  
  // Déterminer le séparateur le plus probable
  if (commaCount > semicolonCount) return ',';
  if (semicolonCount > 0) return ';';
  
  // Si aucun séparateur n'est trouvé ou s'ils sont à égalité, préférer la virgule
  return commaCount > 0 ? ',' : null;
}

export async function processCSVData(csvContent: string): Promise<{ data: ProcessedData[], errors: string[] }> {
  const errors: string[] = [];
  const processedData: ProcessedData[] = [];
  
  // Vérifier si le contenu est vide
  if (!csvContent.trim()) {
    errors.push('Le fichier CSV est vide');
    return { data: [], errors };
  }

  // Détecter le séparateur utilisé
  const separator = detectSeparator(csvContent);
  if (!separator) {
    errors.push('Impossible de détecter le séparateur dans le fichier CSV. Veuillez utiliser une virgule (,) ou un point-virgule (;) comme séparateur.');
    return { data: [], errors };
  }
  
  // Diviser le contenu en lignes
  const lines = csvContent.split(/\r?\n/);
  
  // Vérifier s'il y a au moins une ligne d'en-tête et une ligne de données
  if (lines.length < 2) {
    errors.push('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données');
    return { data: [], errors };
  }
  
  // Définir les en-têtes attendus (au lieu de les extraire de la première ligne)
  const headers = ['Entite', 'Date', 'Heure', 'Docs Emitidos', 'Media p/Doc S/IVA', 'Media P/Doc', 'Valor S/IVA', 'Valor Total'];
  
  // Récupérer les entités depuis la base de données pour la validation
  const { data: entitesData, error: entitesError } = await supabase
    .from('entite')
    .select('id, code');
  
  if (entitesError) {
    errors.push(`Erreur lors de la récupération des entités: ${entitesError.message}`);
    return { data: [], errors };
  }
  
  const entitesMap = new Map<string, string>();
  entitesData?.forEach(entite => {
    entitesMap.set(entite.code, entite.id);
  });
  
  // Traiter chaque ligne de données
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Ignorer les lignes vides
    
    const values = parseCSVLine(line, separator);

    // Vérifier si la ligne semble être un en-tête (première ligne)
    if (i === 0 && values.some(v => headers.includes(v))) {
      continue; // Ignorer la ligne d'en-tête
    }
    
    // Vérifier si le nombre de valeurs correspond au nombre d'en-têtes
    if (values.length !== headers.length) {
      errors.push(`Ligne ${i}: Le nombre de valeurs (${values.length}) ne correspond pas au nombre attendu (${headers.length})`);
      continue;
    }
    
    // Créer un objet avec les valeurs
    const rowData: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowData[header] = values[index];
    });
    
    try {
      // Valider et transformer les données
      const processedRow = await validateAndTransformRow(rowData as unknown as CSVRow, entitesMap, i);
      processedData.push(processedRow);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Erreur inconnue à la ligne ${i}`);
    }
  }
  
  return { data: processedData, errors };
}

async function validateAndTransformRow(row: CSVRow, entitesMap: Map<string, string>, lineNumber: number): Promise<ProcessedData> {
  const errors: string[] = [];
  
  // Valider et transformer l'entité
  if (!row.Entite) {
    throw new Error(`Ligne ${lineNumber}: Code entité manquant`);
  }
  
  const entiteId = entitesMap.get(row.Entite);
  if (!entiteId) {
    throw new Error(`Ligne ${lineNumber}: Entité "${row.Entite}" non trouvée dans la base de données`);
  }
  
  // Valider et transformer la date
  if (!row.Date) {
    throw new Error(`Ligne ${lineNumber}: Date manquante`);
  }
  
  let formattedDate: string;
  try {
    // Format attendu: DD/MM/YYYY
    const dateParts = row.Date.split('/');
    if (dateParts.length !== 3) {
      throw new Error(`Format de date invalide`);
    }
    
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12) {
      throw new Error(`Valeurs de date invalides`);
    }
    
    formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  } catch (error) {
    throw new Error(`Ligne ${lineNumber}: Date "${row.Date}" invalide. Format attendu: JJ/MM/AAAA. ${error instanceof Error ? error.message : ''}`);
  }
  
  // Valider et transformer l'heure
  if (!row.Heure) {
    throw new Error(`Ligne ${lineNumber}: Heure manquante`);
  }
  
  let formattedTime: string;
  try {
    // Format attendu: "7H", "13H", etc.
    const hourMatch = row.Heure.match(/^(\d+)H$/i);
    if (!hourMatch) {
      throw new Error(`Format d'heure invalide`);
    }
    
    const hour = parseInt(hourMatch[1], 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      throw new Error(`Valeur d'heure invalide`);
    }
    
    formattedTime = `${hour.toString().padStart(2, '0')}:00:00`;
  } catch (error) {
    throw new Error(`Ligne ${lineNumber}: Heure "${row.Heure}" invalide. Format attendu: XXH. ${error instanceof Error ? error.message : ''}`);
  }
  
  // Valider et transformer les valeurs numériques
  const docs_emitidos = parseNumericValue(row['Docs Emitidos'], `Ligne ${lineNumber}: Docs Emitidos`);
  const montant_moyen_ht = parseMonetaryValue(row['Media p/Doc S/IVA'], `Ligne ${lineNumber}: Media p/Doc S/IVA`);
  const montant_moyen_ttc = parseMonetaryValue(row['Media P/Doc'], `Ligne ${lineNumber}: Media P/Doc`);
  const montant_total_ht = parseMonetaryValue(row['Valor S/IVA'], `Ligne ${lineNumber}: Valor S/IVA`);
  const montant_total_ttc = parseMonetaryValue(row['Valor Total'], `Ligne ${lineNumber}: Valor Total`);
  
  return {
    id_entite: entiteId,
    date: formattedDate,
    horaire: formattedTime,
    docs_emitidos,
    montant_moyen_ht,
    montant_moyen_ttc,
    montant_total_ht,
    montant_total_ttc,
    source: 'import POS CSV'
  };
}

function parseCSVLine(line: string, separator: string = ','): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i < line.length - 1 ? line[i + 1] : null;
    
    if (char === '"' && inQuotes && nextChar === '"') {
      // Double quotes inside quotes
      currentValue += '"';
      i++;
    } else if (char === '"') {
      // Toggle quotes mode
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      // End of field
      result.push(currentValue);
      currentValue = '';
    } else {
      // Normal character
      currentValue += char;
    }
  }
  
  // Add the last field
  result.push(currentValue);
  
  return result;
}

function parseNumericValue(value: string, errorPrefix: string): number | null {
  if (!value || value.trim() === '' || value.trim() === '-') {
    return null;
  }
  
  try {
    // Nettoyer la valeur (supprimer les espaces, remplacer les virgules par des points)
    const cleanedValue = value.trim().replace(/\s/g, '').replace(/,/g, '.');
    const numericValue = parseFloat(cleanedValue);
    
    if (isNaN(numericValue)) {
      throw new Error(`Valeur numérique invalide: ${value}`);
    }
    
    return numericValue;
  } catch (error) {
    throw new Error(`${errorPrefix}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

function parseMonetaryValue(value: string, errorPrefix: string): number | null {
  if (!value || value.trim() === '' || value.trim() === '-') {
    return null;
  }
  
  try {
    // Nettoyer la valeur (supprimer les symboles €, les espaces, remplacer les virgules par des points)
    const cleanedValue = value.trim().replace(/€/g, '').replace(/\s/g, '').replace(/,/g, '.');
    const numericValue = parseFloat(cleanedValue);
    
    if (isNaN(numericValue)) {
      throw new Error(`Valeur monétaire invalide: ${value}`);
    }
    
    return numericValue;
  } catch (error) {
    throw new Error(`${errorPrefix}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}