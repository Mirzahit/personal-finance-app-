import {
  ArrowDownRight,
  ShoppingBag,
  Target,
  Utensils,
  type LucideIcon,
} from "lucide-react";

export type Currency = "KGS" | "KZT";

export type AccountId = "m-bank" | "kaspi" | "cash-kgs" | "cash-kzt";

export type Account = {
  id: AccountId;
  name: string;
  bank: string;
  balance: number;
  currency: Currency;
  trend: "up" | "down" | "flat";
  trendPct: number;
};

export type EnvelopeId = "food" | "shopping" | "savings";

export type Envelope = {
  id: EnvelopeId;
  name: string;
  spent: number;
  limit: number;
  currency: Currency;
  iconName: "utensils" | "shopping-bag" | "target";
};

export type Tx = {
  id: string;
  title: string;
  accountId: AccountId;
  amount: number;
  currency: Currency;
  type: "income" | "expense";
  time: string;
  iconName: "shopping-bag" | "utensils" | "arrow-down-right";
  envelopeId?: EnvelopeId;
  fromLeila?: boolean;
};

export type Goal = {
  id: string;
  name: string;
  saved: number;
  total: number;
  currency: Currency;
  due: string;
};

export type LeilaRequest = {
  id: string;
  amount: number;
  currency: Currency;
  category: string;
  accountId: AccountId;
  status: "pending" | "approved" | "snoozed";
};

export const accounts: Account[] = [
  { id: "m-bank", name: "М банк", bank: "Бишкек", balance: 124_800, currency: "KGS", trend: "up", trendPct: 4.2 },
  { id: "kaspi", name: "Каспи", bank: "Алматы", balance: 287_500, currency: "KZT", trend: "down", trendPct: 1.8 },
  { id: "cash-kgs", name: "Наличные", bank: "Сом", balance: 18_200, currency: "KGS", trend: "flat", trendPct: 0 },
  { id: "cash-kzt", name: "Наличные", bank: "Тенге", balance: 35_000, currency: "KZT", trend: "flat", trendPct: 0 },
];

export const envelopes: Envelope[] = [
  { id: "food", name: "Еда", spent: 42_300, limit: 80_000, currency: "KZT", iconName: "utensils" },
  { id: "shopping", name: "Покупки", spent: 18_700, limit: 25_000, currency: "KGS", iconName: "shopping-bag" },
  { id: "savings", name: "Подушка", spent: 60_000, limit: 100_000, currency: "KZT", iconName: "target" },
];

export const initialTxs: Tx[] = [
  { id: "t1", title: "Globus", accountId: "m-bank", amount: 1_240, currency: "KGS", type: "expense", time: "12:18", iconName: "shopping-bag" },
  { id: "t2", title: "Кафе Navat", accountId: "kaspi", amount: 6_800, currency: "KZT", type: "expense", time: "10:42", iconName: "utensils", envelopeId: "food" },
  { id: "t3", title: "Перевод от клиента", accountId: "kaspi", amount: 120_000, currency: "KZT", type: "income", time: "09:05", iconName: "arrow-down-right" },
  { id: "t4", title: "Бензин", accountId: "cash-kzt", amount: 8_400, currency: "KZT", type: "expense", time: "08:20", iconName: "shopping-bag" },
];

export const goals: Goal[] = [
  { id: "g1", name: "Машина", saved: 1_300_000, total: 3_000_000, currency: "KZT", due: "до декабря" },
  { id: "g2", name: "Отпуск", saved: 78_000, total: 100_000, currency: "KGS", due: "до июня" },
];

export const initialLeilaRequest: LeilaRequest = {
  id: "lr1",
  amount: 4_500,
  currency: "KZT",
  category: "Продукты",
  accountId: "kaspi",
  status: "pending",
};

export const sparkline = [42, 48, 45, 52, 49, 58, 56, 62, 60, 67, 65, 72, 70, 78, 76, 82];

export const currencySymbol: Record<Currency, string> = { KGS: "с", KZT: "₸" };

export function formatMoney(amount: number, currency: Currency) {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ${currencySymbol[currency]}`;
}

const iconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  "shopping-bag": ShoppingBag,
  target: Target,
  "arrow-down-right": ArrowDownRight,
};

export function iconOf(name: string): LucideIcon {
  return iconMap[name] ?? ShoppingBag;
}

export function accountById(id: AccountId): Account {
  const found = accounts.find((a) => a.id === id);
  if (!found) throw new Error(`Account ${id} not found`);
  return found;
}
