"use client";

import { motion } from "framer-motion";
import { Plus, Wallet } from "lucide-react";
import Link from "next/link";
import type { DbAccount } from "@/lib/supabase/queries";

function formatMoney(minor: number, currency: "KGS" | "KZT") {
  return `${new Intl.NumberFormat("ru-RU").format(minor / 100)} ${
    currency === "KGS" ? "с" : "₸"
  }`;
}

export function AccountsList({ accounts }: { accounts: DbAccount[] }) {
  const totals = accounts.reduce(
    (acc, a) => {
      acc[a.currency] += a.balance_minor;
      return acc;
    },
    { KGS: 0, KZT: 0 } as Record<"KGS" | "KZT", number>
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Счета</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Все твои счета и наличные
          </p>
        </div>
        <Link
          href="/accounts/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          Счёт
        </Link>
      </div>

      {accounts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-6 rounded-[22px] border border-dashed border-border-default bg-bg-elevated/40 px-6 py-12 text-center"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft">
            <Wallet className="h-6 w-6 text-text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">Счетов пока нет</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Добавь свой первый счёт — карта в банке или наличные.
          </p>
          <Link
            href="/accounts/new"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Добавить счёт
          </Link>
        </motion.div>
      ) : (
        <>
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mt-6 rounded-[22px] border border-border-default px-5 py-5 lg:px-7 lg:py-6"
            style={{
              background:
                "radial-gradient(120% 140% at 0% 0%, rgba(40,98,58,0.22) 0%, var(--bg-elevated) 55%, var(--bg-base) 100%)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Всего</p>
            <div className="mt-2 flex flex-col gap-1">
              <p className="text-2xl font-semibold tracking-tight tabular-nums lg:text-3xl">
                {formatMoney(totals.KGS, "KGS")}
              </p>
              <p className="text-xl font-semibold tracking-tight tabular-nums text-text-secondary lg:text-2xl">
                {formatMoney(totals.KZT, "KZT")}
              </p>
            </div>
          </motion.section>

          <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {accounts.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: "easeOut" }}
              >
                <Link
                  href={`/accounts/${a.id}`}
                  className="block rounded-[18px] border border-border-default bg-bg-elevated px-5 py-4 transition-colors hover:bg-bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft">
                      <Wallet className="h-5 w-5 text-text-primary" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium">{a.name}</p>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
                          {a.currency}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">{a.bank}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xl font-semibold tracking-tight tabular-nums">
                    {formatMoney(a.balance_minor, a.currency)}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
