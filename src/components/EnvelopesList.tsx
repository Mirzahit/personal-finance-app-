"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Car,
  CreditCard,
  Gift,
  HandCoins,
  Heart,
  Home,
  Plane,
  Plus,
  ShoppingBag,
  Target,
  Trash2,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { deleteEnvelopeAction } from "@/app/actions";
import type { DbAccount, DbEnvelope } from "@/lib/supabase/queries";

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
  const n = new Intl.NumberFormat("ru-RU").format(minor / 100);
  return `${n} ${currency === "KGS" ? "с" : "₸"}`;
}

export function EnvelopesList({
  envelopes,
  accounts,
}: {
  envelopes: DbEnvelope[];
  accounts: DbAccount[];
}) {
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Конверты</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Лимиты по категориям внутри счёта
          </p>
        </div>
        <Link
          href="/envelopes/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          Конверт
        </Link>
      </div>

      {envelopes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-6 rounded-[22px] border border-dashed border-border-default bg-bg-elevated/40 px-6 py-12 text-center lg:px-10 lg:py-16"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft">
            <CreditCard className="h-6 w-6 text-text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">Пока нет конвертов</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Конверт — это лимит на месяц по одной категории. Например «Еда — 80 000 ₸»: каждый
            расход с этим конвертом тратит и счёт, и лимит.
          </p>
          <Link
            href="/envelopes/new"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Создать первый конверт
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
          className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4"
        >
          {envelopes.map((e) => {
            const Icon = iconMap[e.icon_name] ?? ShoppingBag;
            const ratio = e.limit_minor > 0 ? Math.min(e.spent_minor / e.limit_minor, 1) : 0;
            const over = e.spent_minor > e.limit_minor;
            const acc = e.account_id ? accMap.get(e.account_id) : null;
            return (
              <motion.div
                key={e.id}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative rounded-[18px] border border-border-default bg-bg-elevated transition-colors hover:bg-bg-card"
              >
                <Link href={`/envelopes/${e.id}`} className="block px-5 py-4">
                  <div className="flex items-center gap-3 pr-10">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft">
                      <Icon className="h-5 w-5 text-text-primary" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium">{e.name}</p>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
                          {e.currency}
                        </span>
                      </div>
                      {acc ? (
                        <p className="text-xs text-text-muted">
                          {acc.name} · {acc.bank}
                        </p>
                      ) : (
                        <p className="text-xs text-text-muted">без привязки к счёту</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between text-sm tabular-nums">
                      <span className={over ? "text-expense font-semibold" : ""}>
                        {formatMoney(e.spent_minor, e.currency)}
                      </span>
                      <span className="text-text-muted">
                        из {formatMoney(e.limit_minor, e.currency)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-card">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ratio * 100}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: over ? "var(--expense)" : "var(--accent)" }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      {over
                        ? `Перерасход на ${formatMoney(e.spent_minor - e.limit_minor, e.currency)}`
                        : `Осталось ${formatMoney(e.limit_minor - e.spent_minor, e.currency)}`}
                    </p>
                  </div>
                </Link>
                <form action={deleteEnvelopeAction} className="absolute right-3 top-3">
                  <input type="hidden" name="id" value={e.id} />
                  <button
                    type="submit"
                    aria-label="Удалить конверт"
                    className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-bg-base hover:text-expense"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </form>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
