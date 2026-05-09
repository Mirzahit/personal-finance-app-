"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { createSpouseRequestAction, type ActionState } from "@/app/actions";
import type { DbAccount, DbEnvelope } from "@/lib/supabase/queries";

const initialState: ActionState = {};
const quickAmounts = [500, 1000, 2000, 5000];

function formatMoney(amount: number, currency: "KGS" | "KZT") {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ${currency === "KGS" ? "с" : "₸"}`;
}

export function SpouseRequestForm({
  accounts,
  envelopes,
}: {
  accounts: DbAccount[];
  envelopes: DbEnvelope[];
}) {
  const [state, formAction, pending] = useActionState(
    createSpouseRequestAction,
    initialState
  );

  const [accountId, setAccountId] = useState<string>(accounts[0].id);
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [envelopeId, setEnvelopeId] = useState<string>("");

  const selectedAccount = accounts.find((a) => a.id === accountId)!;
  const currency = selectedAccount.currency;

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
            Запросить трату
          </h1>
        </div>
      </header>

      <form
        action={formAction}
        className="mx-auto w-full max-w-[640px] flex-1 px-5 pt-6 pb-32 lg:px-0 lg:pt-10"
      >
        <input type="hidden" name="account_id" value={accountId} />
        <input type="hidden" name="envelope_id" value={envelopeId} />
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="amount" value={amount} />
        <input type="hidden" name="currency" value={currency} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-[22px] border border-border-default bg-bg-elevated px-5 py-6 lg:px-7 lg:py-7"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Хочу потратить</p>
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

        <Section title="На что">
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Продукты, такси, аптека…"
            required
            className="w-full rounded-[16px] border border-border-default bg-bg-elevated px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </Section>

        {matchingEnvelopes.length > 0 ? (
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
              disabled={pending || !amount || !category || Number(amount) <= 0}
              className="flex-1 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Отправляю…" : "Отправить запрос"}
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
