"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { addTransactionAction, type ActionState } from "@/app/actions";
import type { DbAccount, DbEnvelope } from "@/lib/supabase/queries";

const initialState: ActionState = {};
const quickAmounts = [500, 1000, 2000, 5000];

function formatMoney(amount: number, currency: "KGS" | "KZT") {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ${currency === "KGS" ? "с" : "₸"}`;
}

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function nowLocalForInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatOccurred(localInput: string): string {
  const d = new Date(localInput);
  if (Number.isNaN(d.getTime())) return "Сейчас";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (sameDay) return `Сегодня, ${time}`;
  if (isYesterday) return `Вчера, ${time}`;
  const dateStr = d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  return `${dateStr}, ${time}`;
}

export function ExpenseForm({
  accounts,
  envelopes,
}: {
  accounts: DbAccount[];
  envelopes: DbEnvelope[];
}) {
  const [state, formAction, pending] = useActionState(addTransactionAction, initialState);

  const [type, setType] = useState<"expense" | "income">("expense");
  const [accountId, setAccountId] = useState<string>(accounts[0].id);
  const [amount, setAmount] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [envelopeId, setEnvelopeId] = useState<string>("");
  const [occurredAt, setOccurredAt] = useState<string>(nowLocalForInput());
  const [notes, setNotes] = useState<string>("");
  const [dateExpanded, setDateExpanded] = useState<boolean>(false);

  const selectedAccount = accounts.find((a) => a.id === accountId)!;
  const currency = selectedAccount.currency;

  const matchingEnvelopes = useMemo(
    () => envelopes.filter((e) => e.currency === currency),
    [envelopes, currency]
  );

  return (
    <form
      action={formAction}
      className="mx-auto w-full max-w-[640px] flex-1 px-5 pt-6 pb-32 lg:px-0 lg:pt-10"
    >
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="account_id" value={accountId} />
      <input type="hidden" name="envelope_id" value={envelopeId} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="occurred_at" value={occurredAt} />
      <input type="hidden" name="notes" value={notes} />

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

      <div className="mt-4" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-[22px] border border-border-default bg-bg-elevated px-5 py-6 lg:px-7 lg:py-7"
      >
        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Сумма</p>
        <div className="mt-3 flex items-baseline gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0"
            autoFocus
            className="w-full bg-transparent text-4xl font-semibold tracking-tight tabular-nums text-text-primary placeholder:text-text-muted focus:outline-none lg:text-5xl"
          />
          <span className="text-2xl font-semibold tabular-nums text-text-secondary lg:text-3xl">
            {currency === "KGS" ? "с" : "₸"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickAmounts.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              className="rounded-full border border-border-default bg-bg-base/40 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary"
            >
              + {formatMoney(q, currency)}
            </button>
          ))}
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
          placeholder="Например: Globus, бензин, кафе…"
          className="w-full rounded-[16px] border border-border-default bg-bg-elevated px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </Section>

      <Section title="Когда">
        <div className="rounded-[16px] border border-border-default bg-bg-elevated">
          <button
            type="button"
            onClick={() => setDateExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left"
          >
            <span className="text-sm text-text-primary">
              {formatOccurred(occurredAt)}
            </span>
            <span className="text-xs text-text-secondary">
              {dateExpanded ? "Свернуть" : "Изменить"}
            </span>
          </button>
          {dateExpanded ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden border-t border-border-subtle"
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <input
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  className="flex-1 rounded-[12px] border border-border-default bg-bg-base/40 px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setOccurredAt(nowLocalForInput())}
                  className="rounded-full border border-border-default px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-bg-card"
                >
                  Сейчас
                </button>
              </div>
            </motion.div>
          ) : null}
        </div>
      </Section>

      <Section title="Заметка" hint="необязательно">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Любые детали — место, повод, что купил…"
          rows={3}
          className="w-full resize-none rounded-[16px] border border-border-default bg-bg-elevated px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
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
            {pending ? "Сохраняю…" : type === "income" ? "Сохранить доход" : "Сохранить расход"}
          </button>
        </div>
      </div>
    </form>
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
