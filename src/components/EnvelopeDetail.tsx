"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Car,
  Gift,
  HandCoins,
  Heart,
  Home,
  Plane,
  Plus,
  ShoppingBag,
  Target,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { DbAccount, DbEnvelope, DbTx } from "@/lib/supabase/queries";

const iconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  "shopping-bag": ShoppingBag,
  car: Car,
  home: Home,
  heart: Heart,
  gift: Gift,
  "book-open": BookOpen,
  plane: Plane,
  target: Target,
  "hand-coins": HandCoins,
};

function formatMoney(minor: number, currency: "KGS" | "KZT") {
  return `${new Intl.NumberFormat("ru-RU").format(minor / 100)} ${
    currency === "KGS" ? "с" : "₸"
  }`;
}

export function EnvelopeDetail({
  envelope,
  transactions,
  accounts,
}: {
  envelope: DbEnvelope;
  transactions: DbTx[];
  accounts: DbAccount[];
}) {
  const Icon = iconMap[envelope.icon_name] ?? ShoppingBag;
  const ratio =
    envelope.limit_minor > 0
      ? Math.min(envelope.spent_minor / envelope.limit_minor, 1)
      : 0;
  const pct = Math.round(ratio * 100);
  const over = envelope.spent_minor > envelope.limit_minor;
  const remaining = Math.max(envelope.limit_minor - envelope.spent_minor, 0);
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  // Группировка по дате (день)
  const byDay = transactions.reduce(
    (acc, t) => {
      const day = new Date(t.occurred_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });
      (acc[day] ??= []).push(t);
      return acc;
    },
    {} as Record<string, DbTx[]>
  );

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/envelopes"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Конверты
        </Link>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-[22px] border border-border-default bg-bg-elevated px-5 py-6 lg:px-7 lg:py-7"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft">
            <Icon className="h-6 w-6 text-text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{envelope.name}</h1>
            <p className="text-sm text-text-secondary">
              {transactions.length}{" "}
              {transactions.length === 1
                ? "операция"
                : transactions.length < 5
                  ? "операции"
                  : "операций"}
            </p>
          </div>
          <Link
            href="/expense/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Расход
          </Link>
        </div>

        <div className="mt-6 flex items-baseline justify-between text-sm tabular-nums">
          <span className={over ? "text-expense font-semibold" : "text-text-primary"}>
            {formatMoney(envelope.spent_minor, envelope.currency)}
          </span>
          <span className="text-text-muted">
            из {formatMoney(envelope.limit_minor, envelope.currency)}
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-bg-card">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: over ? "var(--expense)" : "var(--accent)" }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-text-muted">{pct}% использовано</span>
          {over ? (
            <span className="text-expense font-medium">
              Перерасход на{" "}
              {formatMoney(envelope.spent_minor - envelope.limit_minor, envelope.currency)}
            </span>
          ) : (
            <span className="text-text-secondary">
              Осталось {formatMoney(remaining, envelope.currency)}
            </span>
          )}
        </div>
      </motion.section>

      <section className="mt-7">
        <h2 className="mb-3 text-base font-semibold tracking-tight">
          История операций
        </h2>

        {transactions.length === 0 ? (
          <Link
            href="/expense/new"
            className="block rounded-[18px] border border-dashed border-border-default bg-bg-elevated/40 px-5 py-10 text-center text-sm text-text-secondary transition-colors hover:bg-bg-elevated"
          >
            Пока операций нет. Создай первую — нажми «+ Расход» сверху.
          </Link>
        ) : (
          <div className="flex flex-col gap-5">
            {Object.entries(byDay).map(([day, txs]) => {
              const dayTotal = txs.reduce((s, t) => s + t.amount_minor, 0);
              return (
                <div key={day}>
                  <div className="mb-2 flex items-baseline justify-between px-1">
                    <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                      {day}
                    </p>
                    <p className="text-xs tabular-nums text-text-secondary">
                      {formatMoney(dayTotal, envelope.currency)}
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-[16px] border border-border-default bg-bg-elevated divide-y divide-border-subtle">
                    {txs.map((t, i) => {
                      const acc = accMap.get(t.account_id);
                      const time = new Date(t.occurred_at).toLocaleTimeString(
                        "ru-RU",
                        { hour: "2-digit", minute: "2-digit" }
                      );
                      return (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: i * 0.03,
                            ease: "easeOut",
                          }}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <div
                            className="grid h-9 w-9 place-items-center rounded-full"
                            style={{ background: "rgba(229,99,77,0.12)" }}
                          >
                            <ShoppingBag
                              className="h-4 w-4"
                              strokeWidth={1.75}
                              style={{ color: "var(--expense)" }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{t.title}</p>
                            <p className="text-xs text-text-muted">
                              {acc?.name ?? "счёт"} · {time}
                              {t.from_leila ? " · от Лейлы" : ""}
                            </p>
                          </div>
                          <p className="text-sm font-semibold tabular-nums">
                            −{formatMoney(t.amount_minor, t.currency)}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
