// lib/utils.ts
export const monthsOptions = ["12", "24", "36", "48", "60", "72"];

export const prettyCurrency = (v: number | string) => {
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  if (!isFinite(n)) return "";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
};

export const STAFFEL_LETTERS = Array.from({ length: 17 }, (_, i) =>
  String.fromCharCode("A".charCodeAt(0) + i)
);
export const BASE_RATES: Record<string, number> = STAFFEL_LETTERS.reduce(
  (acc, letter, idx) => {
    const rate = 16.49 - idx * 0.5;
    acc[letter] = Number(rate.toFixed(2));
    return acc;
  },
  {} as Record<string, number>
);

export const getEffectiveRate = (letter: string, isKvkJong: boolean) => {
  const base = BASE_RATES[letter] ?? 16.49;
  return isKvkJong ? base : Number((base - 1).toFixed(2));
};

export function calcMonthly({
  aanschafprijs,
  aanbetaling,
  slottermijn,
  looptijd,
  annualRatePct,
}: {
  aanschafprijs: number | string;
  aanbetaling: number | string;
  slottermijn: number | string;
  looptijd: number;
  annualRatePct: number;
}) {
  const parseNumber = (v: any) => {
    const n = Number(String(v || 0).replace(/[^\d.-]/g, ""));
    return isFinite(n) ? n : 0;
  };
  const P = Math.max(0, parseNumber(aanschafprijs) - parseNumber(aanbetaling));
  const FV = parseNumber(slottermijn);
  const n = Number(looptijd || 0);
  if (!P || !n) return 0;
  const i = Number(annualRatePct || 0) / 100 / 12;
  if (i === 0) return Math.max(0, (P - FV) / n);
  const pvBalloon = FV / Math.pow(1 + i, n);
  const L = Math.max(0, P - pvBalloon);
  const maand = (i * L) / (1 - Math.pow(1 + i, -n));
  return maand;
}
