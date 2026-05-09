"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  error?: string;
  ok?: boolean;
};

export async function addTransactionAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const amountStr = String(formData.get("amount") ?? "").replace(/\s/g, "");
  const accountId = String(formData.get("account_id") ?? "");
  const envelopeIdRaw = String(formData.get("envelope_id") ?? "");
  const envelopeId = envelopeIdRaw === "" ? null : envelopeIdRaw;
  const typeRaw = String(formData.get("type") ?? "expense");
  const type: "income" | "expense" = typeRaw === "income" ? "income" : "expense";

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
  const effectiveEnvelopeId = type === "expense" ? envelopeId : null;

  const { error: txErr } = await supabase.from("transactions").insert({
    household_id: profile.household_id,
    account_id: account.id,
    envelope_id: effectiveEnvelopeId,
    user_id: user.id,
    title,
    amount_minor: amountMinor,
    currency: account.currency,
    type,
    occurred_at: new Date().toISOString(),
  });
  if (txErr) return { error: txErr.message };

  const balanceDelta = type === "income" ? amountMinor : -amountMinor;
  await supabase
    .from("accounts")
    .update({ balance_minor: account.balance_minor + balanceDelta })
    .eq("id", account.id);

  if (effectiveEnvelopeId) {
    const { data: env } = await supabase
      .from("envelopes")
      .select("spent_minor")
      .eq("id", effectiveEnvelopeId)
      .maybeSingle<{ spent_minor: number }>();
    if (env) {
      await supabase
        .from("envelopes")
        .update({ spent_minor: env.spent_minor + amountMinor })
        .eq("id", effectiveEnvelopeId);
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

/**
 * Откатывает эффект транзакции на счёт и конверт (обратное от addTransaction).
 * Используется при удалении и при редактировании.
 */
async function revertTxEffects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tx: {
    account_id: string;
    envelope_id: string | null;
    amount_minor: number;
    type: "income" | "expense" | "transfer";
  }
) {
  const { data: account } = await supabase
    .from("accounts")
    .select("id, balance_minor")
    .eq("id", tx.account_id)
    .maybeSingle<{ id: string; balance_minor: number }>();
  if (account) {
    const delta = tx.type === "income" ? -tx.amount_minor : tx.amount_minor;
    await supabase
      .from("accounts")
      .update({ balance_minor: account.balance_minor + delta })
      .eq("id", account.id);
  }
  if (tx.envelope_id && tx.type === "expense") {
    const { data: env } = await supabase
      .from("envelopes")
      .select("spent_minor")
      .eq("id", tx.envelope_id)
      .maybeSingle<{ spent_minor: number }>();
    if (env) {
      await supabase
        .from("envelopes")
        .update({ spent_minor: Math.max(env.spent_minor - tx.amount_minor, 0) })
        .eq("id", tx.envelope_id);
    }
  }
}

export async function editTransactionAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const amountStr = String(formData.get("amount") ?? "").replace(/\s/g, "");
  const accountId = String(formData.get("account_id") ?? "");
  const envelopeIdRaw = String(formData.get("envelope_id") ?? "");
  const envelopeId = envelopeIdRaw === "" ? null : envelopeIdRaw;
  const typeRaw = String(formData.get("type") ?? "expense");
  const type: "income" | "expense" = typeRaw === "income" ? "income" : "expense";

  if (!id) return { error: "Не указана операция" };
  if (!title) return { error: "Введи описание" };
  const amount = Number(amountStr);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Сумма должна быть больше 0" };
  if (!accountId) return { error: "Выбери счёт" };

  const supabase = await createClient();

  const { data: oldTx } = await supabase
    .from("transactions")
    .select("id, account_id, envelope_id, amount_minor, type, currency")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      account_id: string;
      envelope_id: string | null;
      amount_minor: number;
      type: "income" | "expense" | "transfer";
      currency: "KGS" | "KZT";
    }>();
  if (!oldTx) return { error: "Операция не найдена" };

  // Откатить эффект старой
  await revertTxEffects(supabase, oldTx);

  const { data: newAccount } = await supabase
    .from("accounts")
    .select("id, currency, balance_minor")
    .eq("id", accountId)
    .maybeSingle<{ id: string; currency: "KGS" | "KZT"; balance_minor: number }>();
  if (!newAccount) return { error: "Счёт не найден" };

  const amountMinor = Math.round(amount * 100);
  const effectiveEnvelopeId = type === "expense" ? envelopeId : null;

  // Применить новую
  await supabase
    .from("transactions")
    .update({
      title,
      account_id: newAccount.id,
      envelope_id: effectiveEnvelopeId,
      amount_minor: amountMinor,
      currency: newAccount.currency,
      type,
    })
    .eq("id", id);

  const balanceDelta = type === "income" ? amountMinor : -amountMinor;
  await supabase
    .from("accounts")
    .update({ balance_minor: newAccount.balance_minor + balanceDelta })
    .eq("id", newAccount.id);

  if (effectiveEnvelopeId) {
    const { data: env } = await supabase
      .from("envelopes")
      .select("spent_minor")
      .eq("id", effectiveEnvelopeId)
      .maybeSingle<{ spent_minor: number }>();
    if (env) {
      await supabase
        .from("envelopes")
        .update({ spent_minor: env.spent_minor + amountMinor })
        .eq("id", effectiveEnvelopeId);
    }
  }

  revalidatePath("/");
  revalidatePath("/analytics");
  revalidatePath("/envelopes");
  redirect("/");
}

export async function deleteTransactionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: tx } = await supabase
    .from("transactions")
    .select("id, account_id, envelope_id, amount_minor, type")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      account_id: string;
      envelope_id: string | null;
      amount_minor: number;
      type: "income" | "expense" | "transfer";
    }>();
  if (!tx) return;

  await revertTxEffects(supabase, tx);
  await supabase.from("transactions").delete().eq("id", id);

  revalidatePath("/");
  revalidatePath("/analytics");
  revalidatePath("/envelopes");
}

export async function addGoalAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const targetStr = String(formData.get("target") ?? "").replace(/\s/g, "");
  const currency = String(formData.get("currency") ?? "") as "KGS" | "KZT";
  const dueRaw = String(formData.get("due_date") ?? "").trim();

  if (!name) return { error: "Введи название цели" };
  if (currency !== "KGS" && currency !== "KZT") return { error: "Выбери валюту" };
  const target = Number(targetStr);
  if (!Number.isFinite(target) || target <= 0) return { error: "Цель должна быть больше 0" };

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

  const { error } = await supabase.from("goals").insert({
    household_id: profile.household_id,
    name,
    target_minor: Math.round(target * 100),
    saved_minor: 0,
    currency,
    due_date: dueRaw === "" ? null : dueRaw,
  });
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/goals");
  redirect("/goals");
}

export async function depositToGoalAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const goalId = String(formData.get("goal_id") ?? "");
  const accountId = String(formData.get("account_id") ?? "");
  const amountStr = String(formData.get("amount") ?? "").replace(/\s/g, "");

  if (!goalId) return { error: "Не указана цель" };
  if (!accountId) return { error: "Выбери счёт" };
  const amount = Number(amountStr);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Сумма должна быть больше 0" };

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

  const { data: goal } = await supabase
    .from("goals")
    .select("id, name, currency, saved_minor, target_minor")
    .eq("id", goalId)
    .maybeSingle<{
      id: string;
      name: string;
      currency: "KGS" | "KZT";
      saved_minor: number;
      target_minor: number;
    }>();
  if (!goal) return { error: "Цель не найдена" };

  const { data: account } = await supabase
    .from("accounts")
    .select("id, currency, balance_minor")
    .eq("id", accountId)
    .maybeSingle<{ id: string; currency: "KGS" | "KZT"; balance_minor: number }>();
  if (!account) return { error: "Счёт не найден" };

  if (account.currency !== goal.currency) {
    return { error: "Валюта счёта и цели должны совпадать" };
  }

  const amountMinor = Math.round(amount * 100);
  const newSaved = goal.saved_minor + amountMinor;
  const achieved = newSaved >= goal.target_minor;

  await supabase
    .from("goals")
    .update({ saved_minor: newSaved, achieved })
    .eq("id", goal.id);

  await supabase
    .from("accounts")
    .update({ balance_minor: account.balance_minor - amountMinor })
    .eq("id", account.id);

  await supabase.from("transactions").insert({
    household_id: profile.household_id,
    account_id: account.id,
    user_id: user.id,
    title: `В цель: ${goal.name}`,
    amount_minor: amountMinor,
    currency: account.currency,
    type: "expense",
  });

  revalidatePath("/");
  revalidatePath("/goals");
  return { ok: true };
}

export async function editGoalAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const targetStr = String(formData.get("target") ?? "").replace(/\s/g, "");
  const dueRaw = String(formData.get("due_date") ?? "").trim();

  if (!id) return { error: "Не указана цель" };
  if (!name) return { error: "Введи название" };
  const target = Number(targetStr);
  if (!Number.isFinite(target) || target <= 0) return { error: "Сумма должна быть больше 0" };

  const supabase = await createClient();
  const { data: goal } = await supabase
    .from("goals")
    .select("saved_minor")
    .eq("id", id)
    .maybeSingle<{ saved_minor: number }>();
  if (!goal) return { error: "Цель не найдена" };

  const targetMinor = Math.round(target * 100);
  await supabase
    .from("goals")
    .update({
      name,
      target_minor: targetMinor,
      due_date: dueRaw === "" ? null : dueRaw,
      achieved: goal.saved_minor >= targetMinor,
    })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/goals");
  redirect("/goals");
}

export async function deleteGoalAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("goals").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/goals");
}

export async function addDebtAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const creditor = String(formData.get("creditor") ?? "").trim();
  const totalStr = String(formData.get("total") ?? "").replace(/\s/g, "");
  const currency = String(formData.get("currency") ?? "") as "KGS" | "KZT";
  const endDateRaw = String(formData.get("end_date") ?? "").trim();

  if (!creditor) return { error: "Кому должен?" };
  if (currency !== "KGS" && currency !== "KZT") return { error: "Выбери валюту" };
  const total = Number(totalStr);
  if (!Number.isFinite(total) || total <= 0) return { error: "Сумма должна быть больше 0" };

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

  const { error } = await supabase.from("debts").insert({
    household_id: profile.household_id,
    creditor,
    total_minor: Math.round(total * 100),
    paid_minor: 0,
    currency,
    end_date: endDateRaw === "" ? null : endDateRaw,
  });
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/debts");
  redirect("/debts");
}

export async function payDebtAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const debtId = String(formData.get("debt_id") ?? "");
  const accountId = String(formData.get("account_id") ?? "");
  const amountStr = String(formData.get("amount") ?? "").replace(/\s/g, "");

  if (!debtId) return { error: "Не указан долг" };
  if (!accountId) return { error: "Выбери счёт" };
  const amount = Number(amountStr);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Сумма должна быть больше 0" };

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

  const { data: debt } = await supabase
    .from("debts")
    .select("id, creditor, currency, paid_minor, total_minor")
    .eq("id", debtId)
    .maybeSingle<{
      id: string;
      creditor: string;
      currency: "KGS" | "KZT";
      paid_minor: number;
      total_minor: number;
    }>();
  if (!debt) return { error: "Долг не найден" };

  const { data: account } = await supabase
    .from("accounts")
    .select("id, currency, balance_minor")
    .eq("id", accountId)
    .maybeSingle<{ id: string; currency: "KGS" | "KZT"; balance_minor: number }>();
  if (!account) return { error: "Счёт не найден" };

  if (account.currency !== debt.currency) {
    return { error: "Валюта счёта и долга должны совпадать" };
  }

  const amountMinor = Math.round(amount * 100);
  const newPaid = debt.paid_minor + amountMinor;
  const paidOff = newPaid >= debt.total_minor;

  await supabase
    .from("debts")
    .update({ paid_minor: newPaid, paid_off: paidOff })
    .eq("id", debt.id);

  await supabase
    .from("accounts")
    .update({ balance_minor: account.balance_minor - amountMinor })
    .eq("id", account.id);

  await supabase.from("transactions").insert({
    household_id: profile.household_id,
    account_id: account.id,
    user_id: user.id,
    title: `Долг: ${debt.creditor}`,
    amount_minor: amountMinor,
    currency: account.currency,
    type: "expense",
  });

  revalidatePath("/");
  revalidatePath("/debts");
  return { ok: true };
}

export async function editDebtAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const creditor = String(formData.get("creditor") ?? "").trim();
  const totalStr = String(formData.get("total") ?? "").replace(/\s/g, "");
  const endDateRaw = String(formData.get("end_date") ?? "").trim();

  if (!id) return { error: "Не указан долг" };
  if (!creditor) return { error: "Кому должен?" };
  const total = Number(totalStr);
  if (!Number.isFinite(total) || total <= 0) return { error: "Сумма должна быть больше 0" };

  const supabase = await createClient();
  const { data: debt } = await supabase
    .from("debts")
    .select("paid_minor")
    .eq("id", id)
    .maybeSingle<{ paid_minor: number }>();
  if (!debt) return { error: "Долг не найден" };

  const totalMinor = Math.round(total * 100);
  await supabase
    .from("debts")
    .update({
      creditor,
      total_minor: totalMinor,
      end_date: endDateRaw === "" ? null : endDateRaw,
      paid_off: debt.paid_minor >= totalMinor,
    })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/debts");
  redirect("/debts");
}

export async function deleteDebtAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("debts").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/debts");
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

export async function toggleResourceSharedAction(formData: FormData) {
  const resourceTypeRaw = String(formData.get("resource") ?? "");
  const id = String(formData.get("id") ?? "");
  const sharedRaw = String(formData.get("shared") ?? "");
  const shared = sharedRaw === "true";

  const tables: Record<string, string> = {
    account: "accounts",
    envelope: "envelopes",
    goal: "goals",
    debt: "debts",
  };
  const table = tables[resourceTypeRaw];
  if (!table || !id) return;

  const supabase = await createClient();
  await supabase.from(table).update({ shared_with_spouse: shared }).eq("id", id);
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function createSpouseRequestAction(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const category = String(formData.get("category") ?? "").trim();
  const amountStr = String(formData.get("amount") ?? "").replace(/\s/g, "");
  const currency = String(formData.get("currency") ?? "") as "KGS" | "KZT";
  const accountId = String(formData.get("account_id") ?? "");
  const envelopeIdRaw = String(formData.get("envelope_id") ?? "");
  const envelopeId = envelopeIdRaw === "" ? null : envelopeIdRaw;

  if (!category) return { error: "Введи описание" };
  if (currency !== "KGS" && currency !== "KZT") return { error: "Выбери валюту" };
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

  const { error } = await supabase.from("leila_requests").insert({
    household_id: profile.household_id,
    account_id: accountId,
    envelope_id: envelopeId,
    requested_by: user.id,
    category,
    estimated_minor: Math.round(amount * 100),
    currency,
    status: "pending",
  });
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/leila");
  redirect("/");
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
