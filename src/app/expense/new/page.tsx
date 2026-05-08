"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  accounts,
  envelopes,
  formatMoney,
  type AccountId,
  type Currency,
  type EnvelopeId,
} from "@/lib/data";
import { useStore } from "@/lib/store";

const quickAmounts = [500, 1000, 2000, 5000];

export default function NewExpensePage() {
  const router = useRouter();
  const { addExpense } = useStore();

  const [accountId, setAccountId] = useState<AccountId>("kaspi");
  const [amount, setAmount] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [envelopeId, setEnvelopeId] = useState<EnvelopeId | "">("");
  const [submitting, setSubmitting] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === accountId)!;
  const currency: Currency = selectedAccount.currency;

  const matchingEnvelopes = useMemo(
    () => envelopes.filter((e) => e.currency === currency),
    [currency]
  );

  const numericAmount = Number(amount.replace(/\s/g, ""));
  const valid = Number.isFinite(numericAmount) && numericAmount > 0 && title.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    addExpense({
      title: title.trim(),
      amount: numericAmount,
      currency,
      accountId,
      envelopeId: envelopeId || undefined,
    });
    router.push("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-bg-base/85 px-5 py-3 backdrop-blur-md lg:px-10 lg:py-4">
        <div className="mx-auto flex w-full max-w-[640px] items-center gap-3">
          <Link
            href="/"
            aria-label="Назад"
            className="grid h-10 w-10 place-items-center rounded-full border border-border-default bg-bg-elevated transition-colors hover:bg-bg-card"
          >
            <ArrowLeft className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
          </Link>
          <h1 className="flex-1 text-base font-semibold tracking-tight lg:text-lg">
            Новый расход
          </h1>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-[640px] flex-1 px-5 pt-6 pb-32 lg:px-0 lg:pt-10"
      >
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
                      {formatMoney(a.balance, a.currency)}
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

        <Section
          title="Конверт"
          hint={matchingEnvelopes.length === 0 ? "нет конвертов в этой валюте" : "необязательно"}
        >
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
            {matchingEnvelopes.map((e) => {
              const active = e.id === envelopeId;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEnvelopeId(e.id)}
                  className={`rounded-full border px-3.5 py-2 text-xs transition-colors ${
                    active
                      ? "border-accent bg-accent-soft text-text-primary"
                      : "border-border-default bg-bg-elevated text-text-secondary hover:bg-bg-card"
                  }`}
                >
                  {e.name}
                </button>
              );
            })}
          </div>
        </Section>
      </form>

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
            onClick={handleSubmit}
            disabled={!valid || submitting}
            className="flex-1 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Сохраняю…" : "Сохранить расход"}
          </button>
        </div>
      </div>
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
