"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useActionState, useState } from "react";
import { addAccountAction, type ActionState } from "@/app/actions";

const initialState: ActionState = {};

const presets = [
  { name: "Каспи", bank: "Алматы", currency: "KZT" as const },
  { name: "М банк", bank: "Бишкек", currency: "KGS" as const },
  { name: "Наличные", bank: "Сом", currency: "KGS" as const },
  { name: "Наличные", bank: "Тенге", currency: "KZT" as const },
];

export function AccountForm() {
  const [state, formAction, pending] = useActionState(addAccountAction, initialState);

  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [currency, setCurrency] = useState<"KGS" | "KZT">("KZT");
  const [balance, setBalance] = useState("");

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
            Новый счёт
          </h1>
        </div>
      </header>

      <form
        action={formAction}
        className="mx-auto w-full max-w-[640px] flex-1 px-5 pt-6 pb-32 lg:px-0 lg:pt-10"
      >
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="bank" value={bank} />
        <input type="hidden" name="currency" value={currency} />
        <input type="hidden" name="balance" value={balance} />

        <Section title="Шаблоны">
          <div className="grid grid-cols-2 gap-2.5">
            {presets.map((p) => (
              <button
                key={`${p.name}-${p.bank}`}
                type="button"
                onClick={() => {
                  setName(p.name);
                  setBank(p.bank);
                  setCurrency(p.currency);
                }}
                className="rounded-[14px] border border-border-default bg-bg-elevated px-3 py-2.5 text-left text-sm transition-colors hover:bg-bg-card"
              >
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-text-muted">{p.bank} · {p.currency}</p>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Название">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="М банк, Каспи, Наличные…"
            required
            className="w-full rounded-[16px] border border-border-default bg-bg-elevated px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </Section>

        <Section title="Подпись (банк/тип)">
          <input
            type="text"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            placeholder="Бишкек, Алматы, Сом, Тенге…"
            required
            className="w-full rounded-[16px] border border-border-default bg-bg-elevated px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </Section>

        <Section title="Валюта">
          <div className="grid grid-cols-2 gap-2.5">
            {(["KGS", "KZT"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`rounded-[14px] border px-4 py-3 text-sm transition-colors ${
                  currency === c
                    ? "border-accent bg-accent-soft text-text-primary"
                    : "border-border-default bg-bg-elevated text-text-secondary hover:bg-bg-card"
                }`}
              >
                {c === "KGS" ? "Сом (с)" : "Тенге (₸)"}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Текущий баланс">
          <div className="flex items-baseline gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={balance}
              onChange={(e) => setBalance(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
              className="w-full rounded-[16px] border border-border-default bg-bg-elevated px-4 py-3.5 text-base font-semibold tabular-nums text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <span className="text-base font-semibold tabular-nums text-text-secondary">
              {currency === "KGS" ? "с" : "₸"}
            </span>
          </div>
        </Section>

        {state.error ? (
          <p className="mt-5 text-sm text-expense">{state.error}</p>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="fixed bottom-0 left-0 right-0 z-10 border-t border-border-subtle bg-bg-base/95 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 backdrop-blur-md lg:px-10 lg:py-4"
        >
          <div className="mx-auto flex w-full max-w-[640px] gap-3">
            <Link
              href="/"
              className="rounded-full border border-border-default px-5 py-3 text-sm text-text-secondary transition-colors hover:bg-bg-card"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={pending || !name || !bank}
              className="flex-1 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Сохраняю…" : "Создать счёт"}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-text-muted">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
