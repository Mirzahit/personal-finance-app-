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
  Plane,
  ShoppingBag,
  Target,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { approveLeilaAction, snoozeLeilaAction } from "@/app/actions";
import type {
  DbAccount,
  DbEnvelope,
  DbGoal,
  DbLeilaRequest,
  DbProfile,
  DbTx,
  MonthAnalytics,
} from "@/lib/supabase/queries";

type DashboardProps = {
  data: {
    profile: DbProfile | null;
    accounts: DbAccount[];
    envelopes: DbEnvelope[];
    txs: DbTx[];
    goals: DbGoal[];
    leilaRequest: DbLeilaRequest | null;
  };
  analytics: MonthAnalytics;
};

const txIconMap: Record<string, LucideIcon> = {
  "shopping-bag": ShoppingBag,
  utensils: Utensils,
  "arrow-down-right": ArrowDownRight,
  target: Target,
  wallet: Wallet,
  car: Car,
  home: Home,
  heart: Heart,
  gift: Gift,
  "book-open": BookOpen,
  plane: Plane,
  "hand-coins": HandCoins,
};

function fromMinor(minor: number) {
  return minor / 100;
}

function formatMoney(minor: number, currency: "KGS" | "KZT") {
  const n = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(fromMinor(minor));
  return `${n} ${currency === "KGS" ? "с" : "₸"}`;
}

export function Dashboard({ data, analytics }: DashboardProps) {
  const { profile, accounts, envelopes, txs, goals, leilaRequest } = data;

  if (accounts.length === 0) {
    return <FirstRunEmpty profileName={profile?.display_name ?? "друг"} />;
  }

  const totals = accounts.reduce(
    (acc, a) => {
      acc[a.currency] += a.balance_minor;
      return acc;
    },
    { KGS: 0, KZT: 0 } as Record<"KGS" | "KZT", number>
  );

  return (
    <>
      <PageHeading name={profile?.display_name ?? "друг"} />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-8">
          <Totals totals={totals} analytics={analytics} />
        </div>
        <div className="lg:col-span-4">
          {leilaRequest ? (
            <LeilaCard request={leilaRequest} accounts={accounts} />
          ) : (
            <NoLeilaRequest />
          )}
        </div>

        <div className="lg:col-span-12">
          <Accounts accounts={accounts} />
        </div>

        <div className="lg:col-span-7">
          <TodayFeed txs={txs} accounts={accounts} />
        </div>

        <div className="lg:col-span-5">
          <Envelopes envelopes={envelopes} />
        </div>

        {goals.length > 0 ? (
          <div className="lg:col-span-12">
            <Goals goals={goals} />
          </div>
        ) : null}
      </div>
    </>
  );
}

function FirstRunEmpty({ profileName }: { profileName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-[22px] border border-border-default bg-bg-elevated p-8 text-center lg:p-14"
    >
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent text-white">
        <Wallet className="h-7 w-7" strokeWidth={2} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight lg:text-3xl">
        Привет, {profileName}!
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">
        Чтобы приложение начало работать — добавь свой первый счёт. Это может быть Каспи, М банк
        или просто наличные.
      </p>
      <Link
        href="/accounts/new"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Добавить первый счёт
      </Link>
    </motion.div>
  );
}

function PageHeading({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="hidden lg:block"
    >
      <p className="text-sm text-text-secondary">Сегодня</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Привет, {name}</h1>
    </motion.div>
  );
}

function Totals({
  totals,
  analytics,
}: {
  totals: Record<"KGS" | "KZT", number>;
  analytics: MonthAnalytics;
}) {
  const sumIncome = analytics.income.KGS + analytics.income.KZT;
  const sumExpense = analytics.expense.KGS + analytics.expense.KZT;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[22px] border border-border-default px-5 py-6 lg:px-7 lg:py-7"
      style={{
        background:
          "radial-gradient(120% 140% at 0% 0%, rgba(40,98,58,0.28) 0%, var(--bg-elevated) 55%, var(--bg-base) 100%)",
      }}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Всего на счетах</p>
      <div className="mt-3 flex flex-col gap-1">
        <p className="text-3xl font-semibold tracking-tight tabular-nums lg:text-[40px] lg:leading-[1.05]">
          {formatMoney(totals.KGS, "KGS")}
        </p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-text-secondary lg:text-[28px]">
          {formatMoney(totals.KZT, "KZT")}
        </p>
      </div>

      {sumIncome > 0 || sumExpense > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniMonthCard
            label="Доход"
            kgs={analytics.income.KGS}
            kzt={analytics.income.KZT}
            type="income"
          />
          <MiniMonthCard
            label="Расход"
            kgs={analytics.expense.KGS}
            kzt={analytics.expense.KZT}
            type="expense"
          />
        </div>
      ) : (
        <p className="mt-5 text-xs text-text-muted">
          Добавь операции — здесь покажутся итоги месяца
        </p>
      )}

      <Link
        href="/analytics"
        className="mt-4 inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
      >
        Подробная аналитика →
      </Link>
    </motion.section>
  );
}

function MiniMonthCard({
  label,
  kgs,
  kzt,
  type,
}: {
  label: string;
  kgs: number;
  kzt: number;
  type: "income" | "expense";
}) {
  const color = type === "income" ? "var(--income)" : "var(--expense)";
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-base/50 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color }}>
        {label} в этом месяце
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums">
        {formatMoney(kgs, "KGS")}
      </p>
      <p className="text-xs tabular-nums text-text-secondary">
        {formatMoney(kzt, "KZT")}
      </p>
    </div>
  );
}

function Accounts({ accounts }: { accounts: DbAccount[] }) {
  return (
    <section>
      <SectionHeader
        title="Счета"
        hint={`${accounts.length} ${accounts.length === 1 ? "счёт" : "счёта"}`}
        action={
          <Link
            href="/accounts/new"
            className="rounded-full border border-border-default px-3 py-1 text-xs text-text-secondary hover:bg-bg-card"
          >
            + Счёт
          </Link>
        }
      />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
        }}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
      >
        {accounts.map((a) => (
          <motion.div
            key={a.id}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-start rounded-[18px] border border-border-default bg-bg-elevated px-4 py-4 lg:px-5 lg:py-5"
          >
            <div className="flex w-full items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft">
                <Wallet className="h-4 w-4 text-text-primary" strokeWidth={1.75} />
              </div>
              <span className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
                {a.currency}
              </span>
            </div>
            <p className="mt-3 text-sm text-text-secondary">{a.name}</p>
            <p className="text-xs text-text-muted">{a.bank}</p>
            <p className="mt-3 text-base font-semibold tabular-nums lg:text-lg">
              {formatMoney(a.balance_minor, a.currency)}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function Envelopes({ envelopes }: { envelopes: DbEnvelope[] }) {
  if (envelopes.length === 0) {
    return (
      <section className="h-full">
        <SectionHeader
          title="Конверты"
          action={
            <Link
              href="/envelopes/new"
              className="rounded-full border border-border-default px-3 py-1 text-xs text-text-secondary hover:bg-bg-card"
            >
              + Конверт
            </Link>
          }
        />
        <Link
          href="/envelopes/new"
          className="block rounded-[18px] border border-dashed border-border-default bg-bg-elevated/40 px-5 py-8 text-center text-sm text-text-secondary transition-colors hover:bg-bg-elevated"
        >
          Создай первый конверт — лимит по категории на месяц
        </Link>
      </section>
    );
  }
  return (
    <section className="h-full">
      <SectionHeader
        title="Конверты"
        action={
          <Link
            href="/envelopes/new"
            className="rounded-full border border-border-default px-3 py-1 text-xs text-text-secondary hover:bg-bg-card"
          >
            + Конверт
          </Link>
        }
      />
      <div className="flex flex-col gap-2.5">
        {envelopes.map((e, i) => {
          const ratio = e.limit_minor > 0 ? Math.min(e.spent_minor / e.limit_minor, 1) : 0;
          const over = e.spent_minor > e.limit_minor;
          const Icon = txIconMap[e.icon_name] ?? ShoppingBag;
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.05, ease: "easeOut" }}
              className="rounded-[18px] border border-border-default bg-bg-elevated px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft">
                  <Icon className="h-4 w-4 text-text-primary" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{e.name}</p>
                    <p className="text-sm tabular-nums text-text-secondary">
                      <span className={over ? "text-expense font-semibold" : ""}>
                        {formatMoney(e.spent_minor, e.currency)}
                      </span>
                      <span className="text-text-muted"> / {formatMoney(e.limit_minor, e.currency)}</span>
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-card">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${ratio * 100}%`,
                        background: over ? "var(--expense)" : "var(--accent)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function TodayFeed({ txs, accounts }: { txs: DbTx[]; accounts: DbAccount[] }) {
  if (txs.length === 0) {
    return (
      <section className="h-full">
        <SectionHeader title="Операции" />
        <div className="rounded-[18px] border border-dashed border-border-default bg-bg-elevated/40 px-5 py-8 text-center text-sm text-text-secondary">
          Пока нет операций.
          <br />
          Добавь первый расход кнопкой «+ Добавить расход».
        </div>
      </section>
    );
  }
  const accMap = new Map(accounts.map((a) => [a.id, a]));
  return (
    <section className="h-full">
      <SectionHeader title="Операции" hint={`${txs.length}`} />
      <div className="overflow-hidden rounded-[18px] border border-border-default bg-bg-elevated divide-y divide-border-subtle">
        {txs.map((t, i) => {
          const Icon = ShoppingBag;
          const acc = accMap.get(t.account_id);
          const time = new Date(t.occurred_at).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i < 5 ? 0.1 + i * 0.04 : 0, ease: "easeOut" }}
              className="flex items-center gap-3 px-4 py-3 lg:px-5 lg:py-4"
            >
              <div
                className="grid h-9 w-9 place-items-center rounded-full"
                style={{
                  background:
                    t.type === "income" ? "rgba(63,179,127,0.14)" : "rgba(229,99,77,0.12)",
                }}
              >
                <Icon
                  className="h-4 w-4"
                  strokeWidth={1.75}
                  style={{ color: t.type === "income" ? "var(--income)" : "var(--expense)" }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-text-muted">
                  {acc?.name ?? "счёт"} · {time}
                  {t.from_leila ? " · от Лейлы" : ""}
                </p>
              </div>
              <p
                className="text-sm font-semibold tabular-nums"
                style={{ color: t.type === "income" ? "var(--income)" : "var(--text-primary)" }}
              >
                {t.type === "income" ? "+" : "−"}
                {formatMoney(t.amount_minor, t.currency)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function LeilaCard({
  request,
  accounts,
}: {
  request: DbLeilaRequest;
  accounts: DbAccount[];
}) {
  const acc = accounts.find((a) => a.id === request.account_id);
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
      className="relative h-full overflow-hidden rounded-[22px] border border-border-default p-5 lg:p-6"
      style={{
        background:
          "radial-gradient(140% 120% at 100% 0%, rgba(91,163,208,0.18) 0%, var(--bg-elevated) 55%, var(--bg-base) 100%)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold"
          style={{ background: "rgba(91,163,208,0.20)", color: "var(--leila-request)" }}
        >
          Л
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Запрос от Лейлы</p>
          <p className="text-xs text-text-secondary">
            {new Date(request.created_at).toLocaleString("ru-RU")}
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ background: "rgba(91,163,208,0.18)", color: "var(--leila-request)" }}
        >
          ждёт
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-base/40 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Хочет потратить</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          до {formatMoney(request.estimated_minor, request.currency)}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {request.category}
          {acc ? ` · ${acc.name}` : ""}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <form action={approveLeilaAction} className="flex-1">
          <input type="hidden" name="id" value={request.id} />
          <button
            type="submit"
            className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Подтвердить
          </button>
        </form>
        <form action={snoozeLeilaAction}>
          <input type="hidden" name="id" value={request.id} />
          <button
            type="submit"
            className="rounded-full border border-border-default px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-card"
          >
            Позже
          </button>
        </form>
      </div>
    </motion.section>
  );
}

function NoLeilaRequest() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-[22px] border border-dashed border-border-default bg-bg-elevated/40 p-5 lg:p-6"
    >
      <p className="text-sm text-text-secondary">Нет новых запросов от Лейлы</p>
      <p className="mt-1 text-xs text-text-muted">
        Когда Лейла попросит подтвердить трату — увидишь здесь.
      </p>
    </motion.section>
  );
}

function Goals({ goals }: { goals: DbGoal[] }) {
  return (
    <section>
      <SectionHeader
        title="Цели и накопления"
        hint={`${goals.length}`}
        action={
          <Link
            href="/goals/new"
            className="rounded-full border border-border-default px-3 py-1 text-xs text-text-secondary hover:bg-bg-card"
          >
            + Цель
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        {goals.map((g, i) => {
          const ratio = g.target_minor > 0 ? Math.min(g.saved_minor / g.target_minor, 1) : 0;
          const pct = Math.round(ratio * 100);
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.05, ease: "easeOut" }}
              className="rounded-[18px] border border-border-default bg-bg-elevated px-5 py-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft">
                    <Target className="h-4 w-4 text-text-primary" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{g.name}</p>
                    {g.due_date ? (
                      <p className="text-xs text-text-muted">до {g.due_date}</p>
                    ) : null}
                  </div>
                </div>
                <p className="text-base font-semibold tabular-nums">{pct}%</p>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-bg-card">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${pct}%`, background: "var(--accent)" }}
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between text-sm tabular-nums">
                <span className="text-text-secondary">
                  {formatMoney(g.saved_minor, g.currency)}
                </span>
                <span className="text-text-muted">
                  из {formatMoney(g.target_minor, g.currency)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-2">
      <h2 className="text-base font-semibold tracking-tight lg:text-lg">{title}</h2>
      <div className="flex items-baseline gap-2">
        {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
        {action}
      </div>
    </div>
  );
}
