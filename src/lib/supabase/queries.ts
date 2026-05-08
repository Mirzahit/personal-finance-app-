import { createClient } from "./server";

export type Currency = "KGS" | "KZT";

export type DbAccount = {
  id: string;
  name: string;
  bank: string;
  currency: Currency;
  balance_minor: number;
  position: number;
};

export type DbEnvelope = {
  id: string;
  name: string;
  icon_name: string;
  account_id: string | null;
  currency: Currency;
  limit_minor: number;
  spent_minor: number;
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
    .select("id, name, bank, currency, balance_minor, position")
    .eq("archived", false)
    .order("position")
    .order("created_at")
    .returns<DbAccount[]>();
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
