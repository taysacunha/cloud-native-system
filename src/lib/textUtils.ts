/**
 * Normaliza texto removendo acentos e convertendo para minúsculas
 * Usado para validação de nomes duplicados
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Verifica se dois nomes são similares (ignorando acentos e case)
 */
export function isSimilarName(name1: string, name2: string): boolean {
  return normalizeText(name1) === normalizeText(name2);
}
