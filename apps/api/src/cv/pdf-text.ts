// pdf-parse v1 exécute du code de debug dans son index ; on importe directement l'implémentation.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

/** Signature d'un vrai PDF : les 4 premiers octets valent « %PDF ». */
export function looksLikePdf(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString('latin1') === '%PDF';
}

/** Extrait le texte d'un PDF. Lève si le contenu est illisible. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text.trim();
}
