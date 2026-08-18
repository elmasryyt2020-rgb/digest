/**
 * Normalizes Eastern Arabic-Indic numerals (٠-٩) and Persian numerals (۰-۹)
 * to standard ASCII digits (0-9) so parseFloat/parseInt operate reliably.
 */
export function normalizeArabicDigits(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\u0660-\u0669]/g, (d) => (d.charCodeAt(0) - 1632).toString())
    .replace(/[\u06F0-\u06F9]/g, (d) => (d.charCodeAt(0) - 1776).toString())
    .replace(/،/g, '.'); // Arabic decimal comma
}

export function parseLocalizedFloat(str: string | number | null | undefined, fallback = 0): number {
  if (str === null || str === undefined) return fallback;
  const normalized = normalizeArabicDigits(str).trim();
  const val = parseFloat(normalized);
  return isNaN(val) ? fallback : val;
}

export function parseLocalizedInt(str: string | number | null | undefined, fallback = 0): number {
  if (str === null || str === undefined) return fallback;
  const normalized = normalizeArabicDigits(str).trim();
  const val = parseInt(normalized, 10);
  return isNaN(val) ? fallback : val;
}
