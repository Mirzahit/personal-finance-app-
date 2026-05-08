"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  error?: string;
  ok?: boolean;
};

export async function addExpenseAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const amountStr = String(formData.get("amount") ?? "").replace(/\s/g, "");
  const accountId = String(formData.get("account_id") ?? "");
  const envelopeIdRaw = String(formData.get("envelope_id") ?? "");
  const envelopeId = envelopeIdRaw === "" ? null : envelopeIdRaw;

  if (!title) return { error: "Введи описание" };
  const amount = Number(amountStr);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Сумма должна быть больше 0" };
  if (!accountId) return { error: "Выбери счёт" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нужно войти заново" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .maybeSingle<{ household_id: string }>();
  if (!profile) return { error: "Профиль не найден" };

  const { data: account } = await supabase
    .from("accounts")
    .select("id, currency, balance_minor")
    .eq("id", accountId)
    .maybeSingle<{ id: string; currency: "KGS" | "KZT"; balance_minor: number }>();
  if (!account) return { error: "Счёт не найден" };

  const amountMinor = Math.round(amount * 100);

  const { error: txErr } = await supabase.from("transactions").insert({
    household_id: profile.household_id,
    account_id: account.id,
    envelope_id: envelopeId,
    user_id: user.id,
    title,
    amount_minor: amountMinor,
    currency: account.currency,
    type: "expense",
    occurred_at: new Date().toISOString(),
  });
  if (txErr) return { error: txErr.message };

  await supabase
    .from("accounts")
    .update({ balance_minor: account.balance_minor - amountMinor })
    .eq("id", account.id);

  if (envelopeId) {
    const { data: env } = await supabase
      .from("envelopes")
      .select("spent_minor")
      .eq("id", envelopeId)
      .maybeSingle<{ spent_minor: number }>();
    if (env) {
      await supabase
        .from("envelopes")
        .update({ spent_minor: env.spent_minor + amountMinor })
        .eq("id", envelopeId);
    }
  }

  revalidatePath("/");
  redirect("/");
}

export async function addAccountAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const bank = String(formData.get("bank") ?? "").trim();
  const currency = String(formData.get("currency") ?? "") as "KGS" | "KZT";
  const balanceStr = String(formData.get("balance") ?? "0").replace(/\s/g, "");

  if (!name) return { error: "Введи название" };
  if (!bank) return { error: "Введи банк/тип" };
  if (currency !== "KGS" && currency !== "KZT") return { error: "Выбери валюту" };
  const balance = Number(balanceStr);
  if (!Number.isFinite(balance) || balance < 0) return { error: "Баланс должен быть числом ≥ 0" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нужно войти заново" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .maybeSingle<{ household_id: string }>();
  if (!profile) return { error: "Профиль не найден" };

  const { error } = await supabase.from("accounts").insert({
    household_id: profile.household_id,
    name,
    bank,
    currency,
    balance_minor: Math.round(balance * 100),
  });
  if (error) return { error: error.message };

  revalidatePath("/");
  redirect("/");
}

export async function addEnvelopeAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const iconName = String(formData.get("icon_name") ?? "shopping-bag");
  const currency = String(formData.get("currency") ?? "") as "KGS" | "KZT";
  const limitStr = String(formData.get("limit") ?? "").replace(/\s/g, "");
  const accountIdRaw = String(formData.get("account_id") ?? "");
  const accountId = accountIdRaw === "" ? null : accountIdRaw;

  if (!name) return { error: "Введи название" };
  if (currency !== "KGS" && currency !== "KZT") return { error: "Выбери валюту" };
  const limit = Number(limitStr);
  if (!Number.isFinite(limit) || limit <= 0) return { error: "Лимит должен быть больше 0" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нужно войти заново" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .maybeSingle<{ household_id: string }>();
  if (!profile) return { error: "Профиль не найден" };

  if (accountId) {
    const { data: acc } = await supabase
      .from("accounts")
      .select("currency")
      .eq("id", accountId)
      .maybeSingle<{ currency: "KGS" | "KZT" }>();
    if (acc && acc.currency !== currency) {
      return { error: "Валюта конверта должна совпадать с валютой счёта" };
    }
  }

  const { error } = await supabase.from("envelopes").insert({
    household_id: profile.household_id,
    account_id: accountId,
    name,
    icon_name: iconName,
    currency,
    limit_minor: Math.round(limit * 100),
    spent_minor: 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/envelopes");
  redirect("/envelopes");
}

export async function deleteEnvelopeAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("envelopes").update({ archived: true }).eq("id", id);

  revalidatePath("/");
  revalidatePath("/envelopes");
}

export async function approveLeilaAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .maybeSingle<{ household_id: string }>();
  if (!profile) return;

  const { data: req } = await supabase
    .from("leila_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      account_id: string;
      envelope_id: string | null;
      category: string;
      estimated_minor: number;
      currency: "KGS" | "KZT";
      requested_by: string;
    }>();
  if (!req) return;

  await supabase
    .from("leila_requests")
    .update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() })
    .eq("id", id);

  await supabase.from("transactions").insert({
    household_id: profile.household_id,
    account_id: req.account_id,
    envelope_id: req.envelope_id,
    user_id: req.requested_by,
    title: `Лейла: ${req.category}`,
    amount_minor: req.estimated_minor,
    currency: req.currency,
    type: "expense",
    from_leila: true,
  });

  const { data: acc } = await supabase
    .from("accounts")
    .select("balance_minor")
    .eq("id", req.account_id)
    .maybeSingle<{ balance_minor: number }>();
  if (acc) {
    await supabase
      .from("accounts")
      .update({ balance_minor: acc.balance_minor - req.estimated_minor })
      .eq("id", req.account_id);
  }

  revalidatePath("/");
}

export async function snoozeLeilaAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("leila_requests")
    .update({ status: "cancelled" })
    .eq("id", id);

  revalidatePath("/");
}
