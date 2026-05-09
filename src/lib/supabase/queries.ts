import { createClient } from "./server";

export type Currency = "KGS" | "KZT";

export type DbAccount = {
  id: string;
  name: string;
  bank: string;
  currency: Currency;
  balance_minor: number;
  position: number;
  shared_with_spouse?: boolean;
};

export type DbEnvelope = {
  id: string;
  name: string;
  icon_name: string;
  account_id: string | null;
  currency: Currency;
  limit_minor: number;
  spent_minor: number;
  shared_with_spouse?: boolean;
};

export type DbTx = {
  id: string;
  title: string;
  account_id: string;
  envelope_id: string | null;
  user_id: string | null;
  amount_minor: number;
  currency: Currency;
  type: "income" | "expense" | "transfer";
  occurred_at: string;
  from_leila: boolean;
};

export type DbGoal = {
  id: string;
  name: string;
  target_minor: number;
  saved_minor: number;
  currency: Currency;
  due_date: string | null;
  achieved: boolean;
  shared_with_spouse?: boolean;
};

export type DbDebt = {
  id: string;
  creditor: string;
  total_minor: number;
  paid_minor: number;
  currency: Currency;
  start_date: string;
  end_date: string | null;
  paid_off: boolean;
  shared_with_spouse?: boolean;
};

export type DbLeilaRequest = {
  id: string;
  account_id: string;
  envelope_id: string | null;
  category: string;
  estimated_minor: number;
  actual_minor: number | null;
  currency: Currency;
  status: "pending" | "approved" | "completed" | "rejected" | "cancelled" | "expired";
  created_at: string;
};

export type DbProfile = {
  id: string;
  household_id: string;
  display_name: string;
  avatar_letter: string;
  role: "owner" | "spouse";
};

export async function getDashboardData() {
  const supabase = await createClient();

  const [
    { data: profile },
    { data: accounts },
    { data: envelopes },
    { data: txs },
    { data: goals },
    { data: leila },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, household_id, display_name, avatar_letter, role")
      .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .maybeSingle<DbProfile>(),
    supabase
      .from("accounts")
      .select("id, name, bank, currency, balance_minor, position")
      .eq("archived", false)
      .order("position")
      .order("created_at")
      .returns<DbAccount[]>(),
    supabase
      .from("envelopes")
      .select("id, name, icon_name, account_id, currency, limit_minor, spent_minor")
      .eq("archived", false)
      .order("position")
      .returns<DbEnvelope[]>(),
    supabase
      .from("transactions")
      .select("id, title, account_id, envelope_id, user_id, amount_minor, currency, type, occurred_at, from_leila")
      .order("occurred_at", { ascending: false })
      .limit(20)
      .returns<DbTx[]>(),
    supabase
      .from("goals")
      .select("id, name, target_minor, saved_minor, currency, due_date, achieved")
      .eq("achieved", false)
      .order("created_at")
      .returns<DbGoal[]>(),
    supabase
      .from("leila_requests")
      .select("id, account_id, envelope_id, category, estimated_minor, actual_minor, currency, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<DbLeilaRequest>(),
  ]);

  return {
    profile: profile ?? null,
    accounts: accounts ?? [],
    envelopes: envelopes ?? [],
    txs: txs ?? [],
    goals: goals ?? [],
    leilaRequest: leila ?? null,
  };
}

export async function getAccounts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("id, name, bank, currency, balance_minor, position, shared_with_spouse")
    .eq("archived", false)
    .order("position")
    .order("created_at")
    .returns<DbAccount[]>();
  return data ?? [];
}

export async function getCurrentProfile(): Promise<DbProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, household_id, display_name, avatar_letter, role")
    .eq("id", user.id)
    .maybeSingle<DbProfile>();
  return data ?? null;
}

export type PermissionsData = {
  accounts: DbAccount[];
  envelopes: DbEnvelope[];
  goals: DbGoal[];
  debts: DbDebt[];
};

export async function getPermissionsData(): Promise<PermissionsData> {
  const supabase = await createClient();
  const [{ data: accounts }, { data: envelopes }, { data: goals }, { data: debts }] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("id, name, bank, currency, balance_minor, position, shared_with_spouse")
        .eq("archived", false)
        .order("position")
        .returns<DbAccount[]>(),
      supabase
        .from("envelopes")
        .select(
          "id, name, icon_name, account_id, currency, limit_minor, spent_minor, shared_with_spouse"
        )
        .eq("archived", false)
        .order("position")
        .returns<DbEnvelope[]>(),
      supabase
        .from("goals")
        .select(
          "id, name, target_minor, saved_minor, currency, due_date, achieved, shared_with_spouse"
        )
        .order("created_at")
        .returns<DbGoal[]>(),
      supabase
        .from("debts")
        .select(
          "id, creditor, total_minor, paid_minor, currency, start_date, end_date, paid_off, shared_with_spouse"
        )
        .order("created_at")
        .returns<DbDebt[]>(),
    ]);
  return {
    accounts: accounts ?? [],
    envelopes: envelopes ?? [],
    goals: goals ?? [],
    debts: debts ?? [],
  };
}

export async function getAccountDetail(accountId: string): Promise<{
  account: DbAccount | null;
  transactions: DbTx[];
} | null> {
  const supabase = await createClient();
  const { data: account } = await supabase
    .from("accounts")
    .select("id, name, bank, currency, balance_minor, position, shared_with_spouse")
    .eq("id", accountId)
    .maybeSingle<DbAccount>();
  if (!account) return null;
  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, title, account_id, envelope_id, user_id, amount_minor, currency, type, occurred_at, from_leila"
    )
    .eq("account_id", accountId)
    .order("occurred_at", { ascending: false })
    .returns<DbTx[]>();
  return { account, transactions: transactions ?? [] };
}

export async function getEnvelopeDetail(envelopeId: string): Promise<{
  envelope: DbEnvelope | null;
  transactions: DbTx[];
} | null> {
  const supabase = await createClient();
  const { data: envelope } = await supabase
    .from("envelopes")
    .select(
      "id, name, icon_name, account_id, currency, limit_minor, spent_minor, shared_with_spouse"
    )
    .eq("id", envelopeId)
    .maybeSingle<DbEnvelope>();
  if (!envelope) return null;

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, title, account_id, envelope_id, user_id, amount_minor, currency, type, occurred_at, from_leila"
    )
    .eq("envelope_id", envelopeId)
    .order("occurred_at", { ascending: false })
    .returns<DbTx[]>();

  return { envelope, transactions: transactions ?? [] };
}

export async function getMySpouseRequests(): Promise<DbLeilaRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leila_requests")
    .select(
      "id, account_id, envelope_id, category, estimated_minor, actual_minor, currency, status, created_at"
    )
    .order("created_at", { ascending: false })
    .returns<DbLeilaRequest[]>();
  return data ?? [];
}

export async function getEnvelopes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("envelopes")
    .select("id, name, icon_name, account_id, currency, limit_minor, spent_minor")
    .eq("archived", false)
    .order("position")
    .returns<DbEnvelope[]>();
  return data ?? [];
}

export async function getGoals() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("id, name, target_minor, saved_minor, currency, due_date, achieved")
    .order("created_at")
    .returns<DbGoal[]>();
  return data ?? [];
}

export async function getDebts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("debts")
    .select("id, creditor, total_minor, paid_minor, currency, start_date, end_date, paid_off")
    .order("created_at")
    .returns<DbDebt[]>();
  return data ?? [];
}

export type MonthAnalytics = {
  monthLabel: string;
  income: Record<Currency, number>;
  expense: Record<Currency, number>;
  byEnvelope: Array<{
    envelope_id: string | null;
    name: string;
    icon_name: string;
    currency: Currency;
    spent_minor: number;
  }>;
  byDay: Record<Currency, Array<{ day: string; income: number; expense: number }>>;
  txs: DbTx[];
};

export async function getMonthAnalytics(): Promise<MonthAnalytics> {
  const supabase = await createClient();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data: txs } = await supabase
    .from("transactions")
    .select("id, title, account_id, envelope_id, user_id, amount_minor, currency, type, occurred_at, from_leila")
    .gte("occurred_at", start.toISOString())
    .lt("occurred_at", end.toISOString())
    .order("occurred_at", { ascending: false })
    .returns<DbTx[]>();

  const { data: envelopes } = await supabase
    .from("envelopes")
    .select("id, name, icon_name, currency")
    .returns<{ id: string; name: string; icon_name: string; currency: Currency }[]>();

  const list = txs ?? [];
  const envMap = new Map((envelopes ?? []).map((e) => [e.id, e]));

  const income: Record<Currency, number> = { KGS: 0, KZT: 0 };
  const expense: Record<Currency, number> = { KGS: 0, KZT: 0 };

  for (const t of list) {
    if (t.type === "income") income[t.currency] += t.amount_minor;
    else if (t.type === "expense") expense[t.currency] += t.amount_minor;
  }

  const envBuckets = new Map<
    string,
    { envelope_id: string | null; name: string; icon_name: string; currency: Currency; spent_minor: number }
  >();
  for (const t of list) {
    if (t.type !== "expense") continue;
    const key = t.envelope_id ?? `__${t.currency}__null`;
    const env = t.envelope_id ? envMap.get(t.envelope_id) : null;
    const existing = envBuckets.get(key);
    if (existing) {
      existing.spent_minor += t.amount_minor;
    } else {
      envBuckets.set(key, {
        envelope_id: t.envelope_id,
        name: env?.name ?? "Без конверта",
        icon_name: env?.icon_name ?? "shopping-bag",
        currency: t.currency,
        spent_minor: t.amount_minor,
      });
    }
  }
  const byEnvelope = [...envBuckets.values()].sort((a, b) => b.spent_minor - a.spent_minor);

  const byDay: Record<Currency, Array<{ day: string; income: number; expense: number }>> = {
    KGS: [],
    KZT: [],
  };
  const dayMap: Record<Currency, Map<string, { income: number; expense: number }>> = {
    KGS: new Map(),
    KZT: new Map(),
  };
  for (const t of list) {
    const day = new Date(t.occurred_at).toISOString().slice(0, 10);
    const m = dayMap[t.currency];
    const cur = m.get(day) ?? { income: 0, expense: 0 };
    if (t.type === "income") cur.income += t.amount_minor;
    if (t.type === "expense") cur.expense += t.amount_minor;
    m.set(day, cur);
  }
  for (const c of ["KGS", "KZT"] as Currency[]) {
    byDay[c] = [...dayMap[c].entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day, ...v }));
  }

  const monthLabel = now.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  return { monthLabel, income, expense, byEnvelope, byDay, txs: list };
}
