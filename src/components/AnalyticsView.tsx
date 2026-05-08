"use client";

import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Car,
  Gift,
  HandCoins,
  Heart,
  Home,
  LineChart,
  Plane,
  ShoppingBag,
  Target,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { MonthAnalytics } from "@/lib/supabase/queries";

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

export function AnalyticsView({ data }: { data: MonthAnalytics }) {
  const { monthLabel, income, expense, byEnvelope, byDay, txs } = data;
  const hasAny = txs.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Аналитика</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight capitalize">{monthLabel}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Доходы, расходы и куда уходят деньги
          </p>
        </div>
      </div>

      {!hasAny ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-6 rounded-[22px] border border-dashed border-border-default bg-bg-elevated/40 px-6 py-12 text-center lg:py-16"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft">
            <LineChart className="h-6 w-6 text-text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            В этом месяце ещё нет операций
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Добавь хотя бы один доход или расход — и здесь появятся реальные цифры.
          </p>
        </motion.div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SummaryCard
              type="income"
              kgs={income.KGS}
              kzt={income.KZT}
              label="Доходы за месяц"
            />
            <SummaryCard
              type="expense"
              kgs={expense.KGS}
              kzt={expense.KZT}
              label="Расходы за месяц"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <NetCard
              kgs={income.KGS - expense.KGS}
              kzt={income.KZT - expense.KZT}
            />
            <DaysChart byDay={byDay} />
          </div>

          {byEnvelope.length > 0 ? (
            <section className="mt-8">
              <h2 className="mb-3 text-base font-semibold tracking-tight lg:text-lg">
                Куда уходят деньги
              </h2>
              <div className="rounded-[18px] border border-border-default bg-bg-elevated divide-y divide-border-subtle">
                {byEnvelope.slice(0, 8).map((e, i) => {
                  const Icon = iconMap[e.icon_name] ?? ShoppingBag;
                  const totalForCurrency = expense[e.currency];
                  const ratio =
                    totalForCurrency > 0 ? Math.min(e.spent_minor / totalForCurrency, 1) : 0;
                  return (
                    <motion.div
                      key={`${e.envelope_id ?? "null"}-${e.currency}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
                      className="flex items-center gap-3 px-4 py-3 lg:px-5 lg:py-4"
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft">
                        <Icon className="h-4 w-4 text-text-primary" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium">{e.name}</p>
                          <p className="text-sm tabular-nums text-text-secondary">
                            {formatMoney(e.spent_minor, e.currency)}
                          </p>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bg-card">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${ratio * 100}%` }}
                            transition={{ duration: 0.6, delay: 0.1 + i * 0.04 }}
                            className="h-full rounded-full"
                            style={{ background: "var(--accent)" }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-text-muted">
                          {Math.round(ratio * 100)}% от расходов в {e.currency}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold tracking-tight lg:text-lg">
              Все операции за месяц ({txs.length})
            </h2>
            <div className="overflow-hidden rounded-[18px] border border-border-default bg-bg-elevated divide-y divide-border-subtle">
              {txs.slice(0, 50).map((t) => {
                const date = new Date(t.occurred_at);
                const ds = date.toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                });
                const ts = date.toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-4 py-3 lg:px-5 lg:py-4"
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
                      {t.type === "income" ? (
                        <ArrowDownRight
                          className="h-4 w-4"
                          strokeWidth={1.75}
                          style={{ color: "var(--income)" }}
                        />
                      ) : (
                        <ArrowUpRight
                          className="h-4 w-4"
                          strokeWidth={1.75}
                          style={{ color: "var(--expense)" }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-text-muted">
                        {ds} · {ts}
                        {t.from_leila ? " · от Лейлы" : ""}
                      </p>
                    </div>
                    <p
                      className="text-sm font-semibold tabular-nums"
                      style={{
                        color: t.type === "income" ? "var(--income)" : "var(--text-primary)",
                      }}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {formatMoney(t.amount_minor, t.currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  type,
  kgs,
  kzt,
  label,
}: {
  type: "income" | "expense";
  kgs: number;
  kzt: number;
  label: string;
}) {
  const color = type === "income" ? "var(--income)" : "var(--expense)";
  const bg =
    type === "income" ? "rgba(63,179,127,0.10)" : "rgba(229,99,77,0.08)";
  const Icon = type === "income" ? ArrowDownRight : ArrowUpRight;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-[22px] border border-border-default px-5 py-5 lg:px-6 lg:py-6"
      style={{ background: bg }}
    >
      <div className="flex items-center gap-2 text-sm" style={{ color }}>
        <Icon className="h-4 w-4" strokeWidth={2} />
        <span className="font-medium">{label}</span>
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <p className="text-2xl font-semibold tracking-tight tabular-nums lg:text-3xl">
          {formatMoney(kgs, "KGS")}
        </p>
        <p className="text-xl font-semibold tracking-tight tabular-nums text-text-secondary lg:text-2xl">
          {formatMoney(kzt, "KZT")}
        </p>
      </div>
    </motion.div>
  );
}

function NetCard({ kgs, kzt }: { kgs: number; kzt: number }) {
  const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "");
  const color = (n: number) =>
    n > 0 ? "var(--income)" : n < 0 ? "var(--expense)" : "var(--text-secondary)";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
      className="rounded-[22px] border border-border-default bg-bg-elevated px-5 py-5 lg:px-6 lg:py-6"
    >
      <p className="text-sm font-medium text-text-secondary">Итог месяца</p>
      <p className="mt-2 text-xs text-text-muted">Доходы минус расходы</p>
      <div className="mt-3 flex flex-col gap-1">
        <p
          className="text-2xl font-semibold tracking-tight tabular-nums lg:text-3xl"
          style={{ color: color(kgs) }}
        >
          {sign(kgs)}
          {formatMoney(Math.abs(kgs), "KGS")}
        </p>
        <p
          className="text-xl font-semibold tracking-tight tabular-nums lg:text-2xl"
          style={{ color: color(kzt) }}
        >
          {sign(kzt)}
          {formatMoney(Math.abs(kzt), "KZT")}
        </p>
      </div>
    </motion.div>
  );
}

function DaysChart({
  byDay,
}: {
  byDay: Record<"KGS" | "KZT", Array<{ day: string; income: number; expense: number }>>;
}) {
  const all = [...byDay.KGS, ...byDay.KZT];
  const hasData = all.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <div className="rounded-[22px] border border-dashed border-border-default bg-bg-elevated/40 px-5 py-5 text-sm text-text-secondary lg:px-6 lg:py-6">
        Дневной график появится когда будут операции
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      className="rounded-[22px] border border-border-default bg-bg-elevated px-5 py-5 lg:px-6 lg:py-6"
    >
      <p className="text-sm font-medium text-text-secondary">По дням</p>
      <p className="mt-1 text-xs text-text-muted">Зелёное — доходы, красное — расходы</p>
      <div className="mt-4 space-y-4">
        <DayBars title="Сом (KGS)" data={byDay.KGS} />
        <DayBars title="Тенге (KZT)" data={byDay.KZT} />
      </div>
    </motion.div>
  );
}

function DayBars({
  title,
  data,
}: {
  title: string;
  data: Array<{ day: string; income: number; expense: number }>;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);
  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-text-muted">{title}</p>
      <div className="flex items-end gap-[3px] h-16">
        {data.map((d) => (
          <div key={d.day} className="flex-1 flex flex-col justify-end gap-[2px]">
            <div
              className="w-full rounded-sm"
              style={{
                height: `${(d.income / max) * 100}%`,
                background: "var(--income)",
                opacity: d.income > 0 ? 0.85 : 0,
                minHeight: d.income > 0 ? 2 : 0,
              }}
              title={`${d.day}: +${(d.income / 100).toLocaleString("ru-RU")}`}
            />
            <div
              className="w-full rounded-sm"
              style={{
                height: `${(d.expense / max) * 100}%`,
                background: "var(--expense)",
                opacity: d.expense > 0 ? 0.85 : 0,
                minHeight: d.expense > 0 ? 2 : 0,
              }}
              title={`${d.day}: −${(d.expense / 100).toLocaleString("ru-RU")}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
