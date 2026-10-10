/**
 * Formatters for BDT Currency, Numerals, and Dates
 */

export function toBengaliNumerals(input: string | number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(input).replace(/[0-9]/g, (w) => bnDigits[parseInt(w, 10)]);
}

export function formatBDT(amount: number, isBn: boolean = false): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount);

  if (isBn) {
    return `৳ ${toBengaliNumerals(formatted)}`;
  }
  return `৳ ${formatted}`;
}

export function formatDate(isoString?: string, isBn: boolean = false): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const dateStr = d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return dateStr;
  } catch {
    return isoString;
  }
}
