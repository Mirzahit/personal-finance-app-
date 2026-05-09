"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  deleteTransactionAction,
  editTransactionAction,
  type ActionState,
} from "@/app/actions";
import type { DbAccount, DbEnvelope, DbTx } from "@/lib/supabase/queries";

const initialState: ActionState = {};

function formatMoney(amount: number, currency: "KGS" | "KZT") {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ${currency === "KGS" ? "с" : "₸"}`;
}

export function TransactionEditForm({
  tx,
  accounts,
  envelopes,
}: {
  tx: DbTx;
  accounts: DbAccount[];
  envelopes: DbEnvelope[];
}) {
  const [state, formAction, pending] = useActionState(
    editTransactionAction,
    initialState
  );

  const [type, setType] = useState<"expense" | "income">(
    tx.type === "income" ? "income" : "expense"
  );
  const [accountId, setAccountId] = useState<string>(tx.account_id);
  const [amount, setAmount] = useState<string>(String(tx.amount_minor / 100));
  const [title, setTitle] = useState<string>(tx.title);
  const [envelopeId, setEnvelopeId] = useState<string>(tx.envelope_id ?? "");

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const currency = selectedAccount?.currency ?? tx.currency;

  const matchingEnvelopes = useMemo(
    () => envelopes.filter((e) => e.currency === currency),
    [envelopes, currency]
  );

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-bg-base/85 px-5 py-3 backdrop-blur-md lg:px-10 lg:py-4">
        <div className="mx-auto flex w-full max-w-[640px] items-center gap-3">
          <Link
            href="/"
            aria-label="Назад"
            className="grid h-10 w-10 place-items-center rounded-full border border-border-default bg-bg-elevated transition-colors hover:bg-bg-card"
          >
            ←
          </Link>
          <h1 className="flex-1 text-base font-semibold tracking-tight lg:text-lg">
            Изменить операцию
          </h1>
        </div>
      </header>

      <form
        action={formAction}
        className="mx-auto w-full max-w-[640px] flex-1 px-5 pt-6 pb-32 lg:px-0 lg:pt-10"
      >
        <input type="hidden" name="id" value={tx.id} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="account_id" value={accountId} />
        <input type="hidden" name="envelope_id" value={envelopeId} />
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="amount" value={amount} />

        <div className="grid grid-cols-2 gap-2 rounded-full border border-border-default bg-bg-elevated p-1">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              type === "expense" ? "bg-bg-card text-text-primary" : "text-text-secondary"
            }`}
          >
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} style={{ color: "var(--expense)" }} />
            Расход
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              type === "income" ? "bg-bg-card text-text-primary" : "text-text-secondary"
            }`}
          >
            <ArrowDownRight className="h-4 w-4" strokeWidth={2} style={{ color: "var(--income)" }} />
            Доход
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-4 rounded-[22px] border border-border-default bg-bg-elevated px-5 py-6 lg:px-7 lg:py-7"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Сумма</p>
          <div className="mt-3 flex items-baseline gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
              className="w-full bg-transparent text-4xl font-semibold tracking-tight tabular-nums text-text-primary placeholder:text-text-muted focus:outline-none lg:text-5xl"
            />
            <span className="text-2xl font-semibold tabular-nums text-text-secondary lg:text-3xl">
              {currency === "KGS" ? "с" : "₸"}
            </span>
          </div>
        </motion.div>

        <Section title="Со счёта">
          <div className="grid grid-cols-2 gap-2.5">
            {accounts.map((a) => {
              const active = a.id === accountId;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setAccountId(a.id);
                    if (envelopeId) {
                      const env = envelopes.find((e) => e.id === envelopeId);
                      if (!env || env.currency !== a.currency) setEnvelopeId("");
                    }
                  }}
                  className={`flex items-start justify-between rounded-[16px] border px-4 py-3 text-left transition-colors ${
                    active
                      ? "border-accent bg-accent-soft"
                      : "border-border-default bg-bg-elevated hover:bg-bg-card"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-text-muted">{a.bank}</p>
                    <p className="mt-1 text-xs tabular-nums text-text-secondary">
                      {formatMoney(a.balance_minor / 100, a.currency)}
                    </p>
                  </div>
                  {active ? (
                    <Check className="h-4 w-4 text-accent" strokeWidth={2.25} />
                  ) : (
                    <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
                      {a.currency}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Описание">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Globus, бензин, кафе…"
            className="w-full rounded-[16px] border border-border-default bg-bg-elevated px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </Section>

        {type === "expense" && matchingEnvelopes.length > 0 ? (
          <Section title="Конверт" hint="необязательно">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEnvelopeId("")}
                className={`rounded-full border px-3.5 py-2 text-xs transition-colors ${
                  envelopeId === ""
                    ? "border-accent bg-accent-soft text-text-primary"
                    : "border-border-default bg-bg-elevated text-text-secondary hover:bg-bg-card"
                }`}
              >
                Без конверта
              </button>
              {matchingEnvelopes.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEnvelopeId(e.id)}
                  className={`rounded-full border px-3.5 py-2 text-xs transition-colors ${
                    e.id === envelopeId
                      ? "border-accent bg-accent-soft text-text-primary"
                      : "border-border-default bg-bg-elevated text-text-secondary hover:bg-bg-card"
                  }`}
                >
                  {e.name}
                </button>
              ))}
            </div>
          </Section>
        ) : null}

        {state.error ? <p className="mt-5 text-sm text-expense">{state.error}</p> : null}

        <Section title="Опасные действия">
          <form action={deleteTransactionAction} className="flex">
            <input type="hidden" name="id" value={tx.id} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-expense/40 bg-bg-elevated px-4 py-3 text-sm text-expense transition-colors hover:bg-expense/10"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              Удалить операцию (баланс вернётся)
            </button>
          </form>
        </Section>

        <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border-subtle bg-bg-base/95 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 backdrop-blur-md lg:px-10 lg:py-4">
          <div className="mx-auto flex w-full max-w-[640px] gap-3">
            <Link
              href="/"
              className="rounded-full border border-border-default px-5 py-3 text-sm text-text-secondary transition-colors hover:bg-bg-card"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={pending || !amount || !title || Number(amount) <= 0}
              className="flex-1 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Сохраняю…" : "Сохранить"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-text-muted">
          {title}
        </h2>
        {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}
