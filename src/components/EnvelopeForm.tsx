"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Car,
  Gift,
  HandCoins,
  Heart,
  Home,
  Plane,
  ShoppingBag,
  Target,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { addEnvelopeAction, type ActionState } from "@/app/actions";
import type { DbAccount } from "@/lib/supabase/queries";

const initialState: ActionState = {};

const iconSet: { name: string; Icon: LucideIcon; label: string }[] = [
  { name: "utensils", Icon: Utensils, label: "Еда" },
  { name: "shopping-bag", Icon: ShoppingBag, label: "Покупки" },
  { name: "car", Icon: Car, label: "Транспорт" },
  { name: "home", Icon: Home, label: "Жильё" },
  { name: "heart", Icon: Heart, label: "Здоровье" },
  { name: "gift", Icon: Gift, label: "Подарки" },
  { name: "book-open", Icon: BookOpen, label: "Учёба" },
  { name: "plane", Icon: Plane, label: "Путешествия" },
  { name: "target", Icon: Target, label: "Подушка" },
  { name: "hand-coins", Icon: HandCoins, label: "Прочее" },
];

export function EnvelopeForm({ accounts }: { accounts: DbAccount[] }) {
  const [state, formAction, pending] = useActionState(addEnvelopeAction, initialState);

  const [name, setName] = useState("");
  const [iconName, setIconName] = useState("utensils");
  const [currency, setCurrency] = useState<"KGS" | "KZT">(accounts[0]?.currency ?? "KZT");
  const [limit, setLimit] = useState("");
  const [accountId, setAccountId] = useState<string>("");

  const matchingAccounts = accounts.filter((a) => a.currency === currency);

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-bg-base/85 px-5 py-3 backdrop-blur-md lg:px-10 lg:py-4">
        <div className="mx-auto flex w-full max-w-[640px] items-center gap-3">
          <Link
            href="/envelopes"
            aria-label="Назад"
            className="grid h-10 w-10 place-items-center rounded-full border border-border-default bg-bg-elevated transition-colors hover:bg-bg-card"
          >
            ←
          </Link>
          <h1 className="flex-1 text-base font-semibold tracking-tight lg:text-lg">
            Новый конверт
          </h1>
        </div>
      </header>

      <form
        action={formAction}
        className="mx-auto w-full max-w-[640px] flex-1 px-5 pt-6 pb-32 lg:px-0 lg:pt-10"
      >
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="icon_name" value={iconName} />
        <input type="hidden" name="currency" value={currency} />
        <input type="hidden" name="limit" value={limit} />
        <input type="hidden" name="account_id" value={accountId} />

        <Section title="Иконка">
          <div className="grid grid-cols-5 gap-2">
            {iconSet.map((it) => {
              const active = it.name === iconName;
              const Icon = it.Icon;
              return (
                <button
                  key={it.name}
                  type="button"
                  onClick={() => setIconName(it.name)}
                  aria-label={it.label}
                  title={it.label}
                  className={`grid place-items-center rounded-2xl border py-3 transition-colors ${
                    active
                      ? "border-accent bg-accent-soft"
                      : "border-border-default bg-bg-elevated hover:bg-bg-card"
                  }`}
                >
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={1.75}
                    style={{
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Название">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Еда, Транспорт, Подушка…"
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
                onClick={() => {
                  setCurrency(c);
                  if (accountId) {
                    const acc = accounts.find((a) => a.id === accountId);
                    if (acc && acc.currency !== c) setAccountId("");
                  }
                }}
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

        <Section title="Лимит на месяц">
          <div className="flex items-baseline gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={limit}
              onChange={(e) => setLimit(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
              className="w-full rounded-[16px] border border-border-default bg-bg-elevated px-4 py-3.5 text-base font-semibold tabular-nums text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <span className="text-base font-semibold tabular-nums text-text-secondary">
              {currency === "KGS" ? "с" : "₸"}
            </span>
          </div>
        </Section>

        {matchingAccounts.length > 0 ? (
          <Section title="Привязка к счёту" hint="необязательно">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAccountId("")}
                className={`rounded-full border px-3.5 py-2 text-xs transition-colors ${
                  accountId === ""
                    ? "border-accent bg-accent-soft text-text-primary"
                    : "border-border-default bg-bg-elevated text-text-secondary hover:bg-bg-card"
                }`}
              >
                Без привязки
              </button>
              {matchingAccounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccountId(a.id)}
                  className={`rounded-full border px-3.5 py-2 text-xs transition-colors ${
                    a.id === accountId
                      ? "border-accent bg-accent-soft text-text-primary"
                      : "border-border-default bg-bg-elevated text-text-secondary hover:bg-bg-card"
                  }`}
                >
                  {a.name} · {a.bank}
                </button>
              ))}
            </div>
          </Section>
        ) : null}

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
              href="/envelopes"
              className="rounded-full border border-border-default px-5 py-3 text-sm text-text-secondary transition-colors hover:bg-bg-card"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={pending || !name || !limit || Number(limit) <= 0}
              className="flex-1 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Сохраняю…" : "Создать конверт"}
            </button>
          </div>
        </motion.div>
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
