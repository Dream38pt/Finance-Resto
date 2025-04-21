/**
 * Fonction pour parser un fichier CSV
 * Supporte les séparateurs virgule et point-virgule
 */
export async function parseCSV(file: File, encoding: string = 'utf-8'): Promise<{ 
  data: string[][], 
  error: string | null,
  separator: string
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          return resolve({ data: [], error: 'Impossible de lire le contenu du fichier', separator: ',' });
        }

        // Détection du séparateur (virgule ou point-virgule)
        const firstLine = content.split('\n')[0];
        let separator = ',';
        
        // Si la première ligne contient plus de points-virgules que de virgules, on utilise le point-virgule
        if (firstLine.split(';').length > firstLine.split(',').length) {
          separator = ';';
        }

        // Parser le CSV
        const rows = content.split('\n')
          .filter(row => row.trim() !== '') // Ignorer les lignes vides
          .map(row => {
            // Gestion des champs entre guillemets
            const fields: string[] = [];
            let field = '';
            let inQuotes = false;
            
            for (let i = 0; i < row.length; i++) {
              const char = row[i];
              
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === separator && !inQuotes) {
                fields.push(field.trim());
                field = '';
              } else {
                field += char;
              }
            }
            
            // Ajouter le dernier champ
            fields.push(field.trim());
            
            return fields;
          });

        resolve({ data: rows, error: null, separator });
      } catch (error) {
        resolve({ 
          data: [], 
          error: error instanceof Error ? error.message : 'Erreur lors du parsing du fichier CSV',
          separator: ','
        });
      }
    };

    reader.onerror = () => {
      resolve({ 
        data: [], 
        error: 'Erreur lors de la lecture du fichier',
        separator: ','
      });
    };

    reader.readAsText(file, encoding);
  });
}