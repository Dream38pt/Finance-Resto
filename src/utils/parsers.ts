import * as XLSX from 'xlsx';

/**
 * Parsers pour les fichiers bancaires
 * Ce fichier contient les fonctions de parsing pour différents formats de fichiers bancaires
 */

/**
 * Interface pour les lignes de données bancaires parsées
 */
export interface ParsedLine {
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

/**
 * Valide une date et retourne true si elle est valide
 * @param year Année
 * @param month Mois
 * @param day Jour
 * @returns boolean
 */
function isValidDate(year: number, month: number, day: number): boolean {
  // Vérifier que l'année est raisonnable (entre 1900 et l'année courante + 1)
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear + 1) return false;
  
  // Vérifier que le mois est valide (1-12)
  if (month < 1 || month > 12) return false;
  
  // Vérifier que le jour est valide pour le mois donné
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;
  
  return true;
}

/**
 * Parse une date au format européen et retourne une date ISO
 * @param val Chaîne de date à parser
 * @returns Date au format YYYY-MM-DD ou null si invalide
 */
function parseDate(val: string): string | null {
  if (!val) return null;
  
  // Nettoyer la chaîne de caractères
  const trimmed = val
    .normalize('NFKD')
    .replace(/[–—−]/g, '-')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\s/g, '')
    .trim();

  if (!trimmed) return null;

  try {
    let day: string, month: string, year: string;
    let match;

    // Format DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
    if (match = trimmed.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/)) {
      [, day, month, year] = match;
    }
    // Format YYYY/MM/DD ou YYYY-MM-DD ou YYYY.MM.DD
    else if (match = trimmed.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/)) {
      [, year, month, day] = match;
    } else {
      return null;
    }

    // Convertir en nombres pour validation
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    let yearNum = parseInt(year, 10);

    // Gestion de l'année sur 2 chiffres
    if (year.length === 2) {
      yearNum = yearNum > 50 ? 1900 + yearNum : 2000 + yearNum;
    }

    // Valider la date
    if (!isValidDate(yearNum, monthNum, dayNum)) {
      return null;
    }

    // Formater la date au format ISO
    return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
  } catch (err) {
    console.error(`Erreur lors du parsing de la date: ${val}`, err);
    return null;
  }
}

/**
 * Détermine le délimiteur utilisé dans le fichier
 * @param content Contenu du fichier
 * @returns Le délimiteur détecté
 */
function detectDelimiter(content: string): string {
  const firstLines = content.split('\n').slice(0, 5).join('\n');
  const delimiters = ['\t', ';', ','];
  const counts = delimiters.map(d => {
    const matches = firstLines.match(new RegExp(d, 'g'));
    return matches ? matches.length : 0;
  });
  
  // Trouver le délimiteur le plus fréquent
  const maxCount = Math.max(...counts);
  const delimiterIndex = counts.indexOf(maxCount);
  
  // Si aucun délimiteur n'est clairement identifié, utiliser le point-virgule par défaut
  return maxCount > 0 ? delimiters[delimiterIndex] : ';';
}

/**
 * Parse un fichier BCP au format CSV
 * @param content Contenu du fichier CSV
 * @param importId Identifiant unique de l'import
 * @param fileName Nom du fichier d'origine
 * @returns Tableau de lignes parsées
 */
export function parseBCP(content: string, importId: string, fileName: string): ParsedLine[] {
  // Détecter le délimiteur utilisé
  const delimiter = detectDelimiter(content);
  console.log(`Délimiteur détecté: ${delimiter === '\t' ? 'tab' : delimiter}`);

  const lines = content.split('\n');
  const result: ParsedLine[] = [];
  let errorCount = 0;
  let errorDetails: string[] = [];

  // Vérifier si le fichier est vide
  if (lines.length <= 1) {
    throw new Error('Le fichier est vide ou ne contient que l\'en-tête');
  }

  // Rechercher la ligne d'en-tête (recherche plus précise)
  const headerIndex = lines.findIndex(line => {
    const lowerLine = line.toLowerCase();
    return (lowerLine.includes('companhia') || lowerLine.includes('data') || 
            lowerLine.includes('valor') || lowerLine.includes('saldo'));
  });

  if (headerIndex === -1) {
    throw new Error("Impossible de trouver la ligne d'en-tête dans le fichier BCP.");
  }

  // Utiliser cette ligne comme en-tête
  const headerLine = lines[headerIndex].trim();
  const headerColumns = headerLine.toLowerCase().split(delimiter);
  console.log("En-têtes détectés:", headerColumns);

  // Identifier précisément les indices des colonnes importantes
  const dateLancIndex = headerColumns.findIndex(col => 
    (col.includes('data') && col.includes('lanc')) || 
    (col.includes('date') && col.includes('opération')));
  
  const dateValorIndex = headerColumns.findIndex(col => 
    (col.includes('data') && col.includes('valor')) || 
    (col.includes('date') && col.includes('valeur')));
  
  // Pour le montant, on cherche "valor" ou "montant" mais pas "data valor" ni "saldo"
  const montantIndex = headerColumns.findIndex(col => 
    (col === 'valor' || col === 'montant' || 
     (col.includes('valor') && !col.includes('data') && !col.includes('saldo')) ||
     (col.includes('montant') && !col.includes('date') && !col.includes('solde'))));
  
  const soldeIndex = headerColumns.findIndex(col => 
    col.includes('saldo') || col.includes('solde'));
  
  const descIndex = headerColumns.findIndex(col => 
    col.includes('descri') || col.includes('libel'));
  
  const compteIndex = headerColumns.findIndex(col => 
    col.includes('conta') || col.includes('compte'));
  
  console.log("Indices des colonnes:", {
    dateLanc: dateLancIndex,
    dateValor: dateValorIndex,
    montant: montantIndex,
    solde: soldeIndex,
    desc: descIndex,
    compte: compteIndex
  });

  // Vérifier que nous avons au moins une date et le montant
  const dateIndex = dateValorIndex !== -1 ? dateValorIndex : dateLancIndex;
  if (dateIndex === -1 || montantIndex === -1) {
    throw new Error(`Format de fichier invalide. Colonnes requises non trouvées. 
      En-tête: ${headerColumns.join(', ')}
      Date index: ${dateIndex}, Montant index: ${montantIndex}`);
  }

  // Commencer le traitement à partir de la ligne suivant l'en-tête
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(delimiter).map(col => col.trim());
    
    // Vérifier que nous avons assez de colonnes
    const maxIndex = Math.max(
      dateValorIndex !== -1 ? dateValorIndex : -1,
      dateLancIndex !== -1 ? dateLancIndex : -1,
      montantIndex !== -1 ? montantIndex : -1,
      soldeIndex !== -1 ? soldeIndex : -1,
      descIndex !== -1 ? descIndex : -1,
      compteIndex !== -1 ? compteIndex : -1
    );
    
    if (columns.length <= maxIndex) {
      errorCount++;
      errorDetails.push(`Ligne ${i - headerIndex} (ligne réelle ${i + 1}): Nombre de colonnes insuffisant (${columns.length} < ${maxIndex + 1})`);
      continue;
    }

    try {
      // Récupérer et parser les dates
      let dateValor = null;
      let dateLanc = null;
      
      if (dateValorIndex !== -1) {
        dateValor = parseDate(columns[dateValorIndex]);
      }
      
      if (dateLancIndex !== -1) {
        dateLanc = parseDate(columns[dateLancIndex]);
      }
      
      // Utiliser la date de valeur en priorité, sinon la date d'opération
      const date = dateValor || dateLanc;

      // Parser le montant avec la fonction cleanEuropeanNumber
      const montant = cleanEuropeanNumber(columns[montantIndex]);

      // Parser le solde si disponible
      let solde = null;
      if (soldeIndex !== -1 && columns[soldeIndex]) {
        solde = cleanEuropeanNumber(columns[soldeIndex]);
      }

      // Vérifier les données essentielles
      if (!date || isNaN(montant)) {
        errorCount++;
        errorDetails.push(`Ligne ${i - headerIndex} (ligne réelle ${i + 1}): Données essentielles manquantes (date: ${date}, montant: ${montant})`);
        continue;
      }

      const parsedLine: ParsedLine = {
        import_id: importId,
        companhia: 'BCP',
        produto: null,
        conta: compteIndex !== -1 ? columns[compteIndex]?.replace(/^0+/, '') : null,
        moeda: 'EUR',
        data_lancamento: dateLanc || date, // Utiliser la date d'opération si disponible, sinon la date de valeur
        data_valor: date,
        descricao: descIndex !== -1 ? columns[descIndex] : null,
        valor: montant,
        saldo: solde,
        referencia_doc: null,
        nom_fichier: fileName
      };

      result.push(parsedLine);
    } catch (err) {
      errorCount++;
      errorDetails.push(`Ligne ${i - headerIndex} (ligne réelle ${i + 1}): ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  }

  if (result.length === 0) {
    const errorMessage = `Aucune ligne valide trouvée dans le fichier BCP. ${errorCount} erreurs détectées.\n` +
      `Détails des erreurs:\n${errorDetails.slice(0, 5).join('\n')}` +
      (errorDetails.length > 5 ? `\n... et ${errorDetails.length - 5} autres erreurs.` : '');
    throw new Error(errorMessage);
  }

  if (errorCount > 0) {
    console.warn(`${errorCount} lignes ignorées sur ${lines.length - headerIndex - 1} en raison d'erreurs de format.`);
  }

  return result;
}

/**
 * Nettoie et convertit une valeur au format numérique européen (1.234,56) en nombre
 * @param value Valeur à convertir (peut être une chaîne ou un nombre)
 * @returns Nombre converti ou null si la conversion échoue
 */
function cleanEuropeanNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    return value;
  }

  try {
    const str = String(value).trim();

    // Ignorer les en-têtes ou mauvaises valeurs
    if (['valor', 'saldo', 'montant', 'solde'].includes(str.toLowerCase())) {
      return null;
    }

    // Si le string contient déjà un point et pas de virgule, on considère que c'est un nombre correct
    if (str.includes('.') && !str.includes(',')) {
      const num = parseFloat(str);
      return isNaN(num) ? null : num;
    }

    // Sinon, traiter comme un format européen (ex: "1.234,56")
    const cleaned = str
      .replace(/[^\d,.-]/g, '')  // Garder uniquement les chiffres, virgules, points et signes
      .replace(/\./g, '')        // Enlever les séparateurs de milliers
      .replace(',', '.');        // Remplacer la virgule décimale par un point
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Parse un fichier ABANCA au format Excel
 * @param buffer Contenu du fichier Excel sous forme d'ArrayBuffer
 * @param importId Identifiant unique de l'import
 * @param fileName Nom du fichier d'origine
 * @returns Tableau de lignes parsées
 */
export function parseABANCA(buffer: ArrayBuffer, importId: string, fileName: string): ParsedLine[] {
  const result: ParsedLine[] = [];
  let errorCount = 0;

  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json<any>(worksheet, {
    header: 1,
    raw: true,
    defval: ''
  });

  // Conversion forcée en texte
  for (let i = 1; i < data.length; i++) {
    if (!data[i]) continue;
    data[i] = data[i].map((cell: any) => (cell !== null && cell !== undefined ? String(cell).trim() : ''));
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 6) continue;

    try {
      const conta = row[0] ? row[0].replace(/^0+/, '') : null;
      const dataOp = parseDate(row[1]);
      const dataVal = parseDate(row[2]);
      const descricao = row[3] || null;
      
      const valor = cleanEuropeanNumber(row[4]);
      const saldo = row[5] ? cleanEuropeanNumber(row[5]) : null;

      // Vérifier que nous avons au moins une date valide et un montant
      if (!dataVal || valor === null) {
        errorCount++;
        continue;
      }

      const parsedLine: ParsedLine = {
        import_id: importId,
        companhia: 'ABANCA',
        produto: null,
        conta: conta || null,
        moeda: 'EUR',
        data_lancamento: dataOp || dataVal, // Utiliser data_valor comme fallback
        data_valor: dataVal,
        descricao,
        valor,
        saldo,
        referencia_doc: null,
        nom_fichier: fileName
      };

      result.push(parsedLine);
    } catch (err) {
      errorCount++;
      console.error(`Erreur à la ligne ${i + 1}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  }

  if (result.length === 0) {
    throw new Error(`Aucune ligne valide trouvée dans le fichier ABANCA. ${errorCount} erreurs détectées.`);
  }

  if (errorCount > 0) {
    console.warn(`${errorCount} lignes ignorées en raison d'erreurs de format.`);
  }

  return result;
}