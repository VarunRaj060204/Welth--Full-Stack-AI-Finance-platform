import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency Formatting ─────────────────────────────────────────────────────
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number, currency: string = "USD"): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${formatCurrency(amount / 1_000_000, currency).slice(0, -3)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${formatCurrency(amount / 1_000, currency).slice(0, -3)}K`;
  }
  return formatCurrency(amount, currency);
}

// ─── Date Utilities ──────────────────────────────────────────────────────────
export function formatDate(date: Date | string, format: "short" | "long" | "relative" = "short"): string {
  const d = new Date(date);

  if (format === "relative") {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  if (format === "long") {
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Number Utilities ────────────────────────────────────────────────────────
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// ─── Color Utilities ─────────────────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#f59e0b",
  Shopping: "#8b5cf6",
  Transportation: "#3b82f6",
  Entertainment: "#ec4899",
  Healthcare: "#ef4444",
  Utilities: "#6b7280",
  Housing: "#f97316",
  Travel: "#06b6d4",
  Education: "#10b981",
  Business: "#6366f1",
  Investment: "#22c55e",
  Income: "#22c55e",
  Transfer: "#94a3b8",
  Other: "#9ca3af",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#9ca3af";
}

export const ACCOUNT_ICONS: Record<string, string> = {
  CHECKING: "building-2",
  SAVINGS: "piggy-bank",
  CREDIT_CARD: "credit-card",
  INVESTMENT: "trending-up",
  CRYPTO: "bitcoin",
  CASH: "banknotes",
  OTHER: "wallet",
};

// ─── Validation ──────────────────────────────────────────────────────────────
export function isValidAmount(value: string): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num < 1_000_000_000;
}

// ─── Exchange Rate ────────────────────────────────────────────────────────────
export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
];

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
    const data = await res.json();
    return data.rates[to] ?? 1;
  } catch {
    return 1;
  }
}

// ─── Transaction Categories ───────────────────────────────────────────────────
export const TRANSACTION_CATEGORIES = [
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Healthcare",
  "Utilities",
  "Housing",
  "Travel",
  "Education",
  "Business",
  "Investment",
  "Income",
  "Transfer",
  "Other",
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

// ─── Prisma Serializer ────────────────────────────────────────────────────────

// ─── Prisma Serializer ────────────────────────────────────────────────────────
export function serializePrisma<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      // Handle Decimal - Prisma Decimal has a specific shape
      if (value !== null && typeof value === "object" && "s" in value && "e" in value && "d" in value) {
        return parseFloat(value.toString());
      }
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    })
  );
}