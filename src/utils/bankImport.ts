import { v4 as uuidv4 } from 'uuid';

interface BCPLine {
  import_id: string;
  companhia: string | null;
  produto: string | null;
  conta: string | null;
  moeda: string | null;
  data_lancamento: string | null;
  data_valor: string | null;
  descricao: string | null;
  valor: number | null;
  saldo: number | null;
  referencia_doc: string | null;
  nom_fichier: string;
}

const parseDate = (dateStr: string): string | null => {
  if (!dateStr || 
      dateStr.toLowerCase() === 'data' || 
      dateStr.toLowerCase() === 'data lancamento' || 
      dateStr.toLowerCase() === 'data valor') {
    return null;
  }
  
  const value = dateStr.trim();

  if (value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY ou YYYY/MM/DD
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1]}-${parts[2]}`; // YYYY/MM/DD
      } else {
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD/MM/YYYY
      }
    }
  } else if (value.includes('-')) {
    return value; // déjà au format ISO
  } else if (value.includes('.')) {
    const parts = value.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD.MM.YYYY
    }
  }

  throw new Error(`Format de date invalide: ${dateStr}`);
};

const parseNumber = (value: string): number | null => {
  if (!value || 
      value.toLowerCase() === 'valor' || 
      value.toLowerCase() === 'saldo' ||
      value.toLowerCase() === 'montant' ||
      value.toLowerCase() === 'solde') {
    return null;
  }
  
  // Traiter les formats de nombre européens (ex: 5.189,65)
  let cleanValue = value.trim();
  
  // Si le nombre contient à la fois un point et une virgule, c'est probablement un format européen
  if (cleanValue.includes('.') && cleanValue.includes(',')) {
    // Supprimer d'abord les points (séparateurs de milliers)
    cleanValue = cleanValue.replace(/\./g, '');
    // Puis remplacer la virgule par un point (séparateur décimal)
    cleanValue = cleanValue.replace(',', '.');
  } else if (cleanValue.includes(',')) {
    // S'il n'y a qu'une virgule, la remplacer par un point
    cleanValue = cleanValue.replace(',', '.');
  }
  
  const number = parseFloat(cleanValue);
  
  if (isNaN(number)) {
    throw new Error(`Format de nombre invalide: ${value}`);
  }
  
  return number;
};

export const parseBCP = (content: string, importId: string, fileName: string): BCPLine[] => {
  const lines = content.split('\n');
  const result: BCPLine[] = [];
  
  // Ignorer la première ligne (en-têtes)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split('\t');
    
    // Vérifier qu'il y a suffisamment de colonnes
    if (columns.length < 8) {
      continue; // Ignorer les lignes invalides
    }

    try {
      const parsedLine: BCPLine = {
        import_id: importId,
        companhia: columns[0]?.trim() || null,
        produto: columns[1]?.trim() || null,
        conta: columns[2]?.trim() || null,
        moeda: columns[3]?.trim() || null,
        data_lancamento: parseDate(columns[4]?.trim()),
        data_valor: parseDate(columns[5]?.trim()),
        descricao: columns[6]?.trim() || null,
        valor: parseNumber(columns[7]?.trim()),
        saldo: parseNumber(columns[8]?.trim()),
        referencia_doc: columns[9]?.trim() || null,
        nom_fichier: fileName
      };
      
      // Vérifier que les dates sont valides avant d'ajouter la ligne
      if (!parsedLine.data_lancamento || !parsedLine.data_valor) {
        continue;
      }
      
      result.push(parsedLine);
    } catch (error) {
      // Ajouter le numéro de ligne à l'erreur pour faciliter le débogage
      throw new Error(`Erreur à la ligne ${i + 1}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
  
  if (result.length === 0) {
    throw new Error('Aucune ligne valide trouvée dans le fichier');
  }
  
  return result;
};