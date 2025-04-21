/**
 * Détecte l'encodage d'un fichier
 * Supporte UTF-8 et ISO-8859-1 (Latin-1)
 */
export async function detectFileEncoding(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          return resolve('utf-8'); // Par défaut
        }

        const bytes = new Uint8Array(buffer);
        
        // Vérifier si c'est de l'UTF-8 avec BOM
        if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
          return resolve('utf-8');
        }
        
        // Vérifier si c'est de l'UTF-8 sans BOM
        // L'UTF-8 a des séquences spécifiques pour les caractères non-ASCII
        let isUtf8 = true;
        let i = 0;
        while (i < bytes.length) {
          if (bytes[i] <= 0x7F) {
            // ASCII
            i++;
          } else if (bytes[i] >= 0xC2 && bytes[i] <= 0xDF && i + 1 < bytes.length && bytes[i + 1] >= 0x80 && bytes[i + 1] <= 0xBF) {
            // 2-byte sequence
            i += 2;
          } else if (bytes[i] >= 0xE0 && bytes[i] <= 0xEF && i + 2 < bytes.length && bytes[i + 1] >= 0x80 && bytes[i + 1] <= 0xBF && bytes[i + 2] >= 0x80 && bytes[i + 2] <= 0xBF) {
            // 3-byte sequence
            i += 3;
          } else if (bytes[i] >= 0xF0 && bytes[i] <= 0xF7 && i + 3 < bytes.length && bytes[i + 1] >= 0x80 && bytes[i + 1] <= 0xBF && bytes[i + 2] >= 0x80 && bytes[i + 2] <= 0xBF && bytes[i + 3] >= 0x80 && bytes[i + 3] <= 0xBF) {
            // 4-byte sequence
            i += 4;
          } else {
            isUtf8 = false;
            break;
          }
        }
        
        if (isUtf8) {
          return resolve('utf-8');
        }
        
        // Si ce n'est pas de l'UTF-8, on suppose que c'est de l'ISO-8859-1
        return resolve('iso-8859-1');
      } catch (error) {
        console.error('Erreur lors de la détection de l\'encodage:', error);
        resolve('utf-8'); // Par défaut en cas d'erreur
      }
    };
    
    reader.onerror = () => {
      resolve('utf-8'); // Par défaut en cas d'erreur
    };
    
    // Lire les premiers 4KB du fichier pour détecter l'encodage
    const slice = file.slice(0, 4096);
    reader.readAsArrayBuffer(slice);
  });
}