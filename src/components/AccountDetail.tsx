"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import type { DbAccount, DbTx } from "@/lib/supabase/queries";

function formatMoney(minor: number, currency: "KGS" | "KZT") {
  return `${new Intl.NumberFormat("ru-RU").format(minor / 100)} ${
    currency === "KGS" ? "с" : "₸"
  }`;
}

export function AccountDetail({
  account,
  transactions,
}: {
  account: DbAccount;
  transactions: DbTx[];
}) {
  const monthlyIn = transactions
    .filter((t) => t.type === "income" && isThisMonth(t.occurred_at))
    .reduce((s, t) => s + t.amount_minor, 0);
  const monthlyOut = transactions
    .filter((t) => t.type === "expense" && isThisMonth(t.occurred_at))
    .reduce((s, t) => s + t.amount_minor, 0);

  // Group by day
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
          href="/accounts"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Все счета
        </Link>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-[22px] border border-border-default px-5 py-6 lg:px-7 lg:py-7"
        style={{
          background:
            "radial-gradient(120% 140% at 0% 0%, rgba(40,98,58,0.22) 0%, var(--bg-elevated) 55%, var(--bg-base) 100%)",
        }}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft">
            <Wallet className="h-6 w-6 text-text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{account.name}</h1>
            <p className="text-sm text-text-secondary">{account.bank}</p>
          </div>
          <Link
            href="/expense/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Операция
          </Link>
        </div>

        <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums lg:text-4xl">
          {formatMoney(account.balance_minor, account.currency)}
        </p>
      </motion.section>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div
          className="rounded-[18px] border border-border-default px-4 py-3.5"
          style={{ background: "rgba(63,179,127,0.08)" }}
        >
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--income)" }}
          >
            <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2} />
            Доход в этом месяце
          </div>
          <p className="mt-1.5 text-base font-semibold tabular-nums">
            {formatMoney(monthlyIn, account.currency)}
          </p>
        </div>
        <div
          className="rounded-[18px] border border-border-default px-4 py-3.5"
          style={{ background: "rgba(229,99,77,0.08)" }}
        >
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--expense)" }}
          >
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            Расход в этом месяце
          </div>
          <p className="mt-1.5 text-base font-semibold tabular-nums">
            {formatMoney(monthlyOut, account.currency)}
          </p>
        </div>
      </div>

      <section className="mt-7">
        <h2 className="mb-3 text-base font-semibold tracking-tight">История операций</h2>

        {transactions.length === 0 ? (
          <Link
            href="/expense/new"
            className="block rounded-[18px] border border-dashed border-border-default bg-bg-elevated/40 px-5 py-10 text-center text-sm text-text-secondary transition-colors hover:bg-bg-elevated"
          >
            Пока операций нет.
          </Link>
        ) : (
          <div className="flex flex-col gap-5">
            {Object.entries(byDay).map(([day, txs]) => {
              const dayIn = txs
                .filter((t) => t.type === "income")
                .reduce((s, t) => s + t.amount_minor, 0);
              const dayOut = txs
                .filter((t) => t.type === "expense")
                .reduce((s, t) => s + t.amount_minor, 0);
              return (
                <div key={day}>
                  <div className="mb-2 flex items-baseline justify-between px-1">
                    <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                      {day}
                    </p>
                    <p className="text-xs tabular-nums text-text-secondary">
                      {dayIn > 0 ? `+${formatMoney(dayIn, account.currency)} ` : ""}
                      {dayOut > 0 ? `−${formatMoney(dayOut, account.currency)}` : ""}
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-[16px] border border-border-default bg-bg-elevated divide-y divide-border-subtle">
                    {txs.map((t, i) => {
                      const time = new Date(t.occurred_at).toLocaleTimeString(
                        "ru-RU",
                        { hour: "2-digit", minute: "2-digit" }
                      );
                      const Icon = t.type === "income" ? ArrowDownRight : ArrowUpRight;
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
                        >
                          <Link
                            href={`/transactions/${t.id}/edit`}
                            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-card"
                          >
                            <div
                              className="grid h-9 w-9 place-items-center rounded-full"
                              style={{
                                background:
                                  t.type === "income"
                                    ? "rgba(63,179,127,0.14)"
                                    : "rgba(229,99,77,0.12)",
                              }}
                            >
                              <Icon
                                className="h-4 w-4"
                                strokeWidth={1.75}
                                style={{
                                  color:
                                    t.type === "income"
                                      ? "var(--income)"
                                      : "var(--expense)",
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{t.title}</p>
                              <p className="text-xs text-text-muted">
                                {time}
                                {t.from_leila ? " · от Лейлы" : ""}
                              </p>
                            </div>
                            <p
                              className="text-sm font-semibold tabular-nums"
                              style={{
                                color:
                                  t.type === "income"
                                    ? "var(--income)"
                                    : "var(--text-primary)",
                              }}
                            >
                              {t.type === "income" ? "+" : "−"}
                              {formatMoney(t.amount_minor, t.currency)}
                            </p>
                          </Link>
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

function isThisMonth(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
