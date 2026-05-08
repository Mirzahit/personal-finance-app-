"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Target,
  Wallet,
} from "lucide-react";
import {
  accounts,
  accountById,
  envelopes,
  formatMoney,
  goals,
  iconOf,
  sparkline,
  type Currency,
} from "@/lib/data";
import { useStore } from "@/lib/store";

const totals = accounts.reduce(
  (acc, a) => {
    acc[a.currency] += a.balance;
    return acc;
  },
  { KGS: 0, KZT: 0 } as Record<Currency, number>
);

export default function Home() {
  return (
    <>
      <PageHeading />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-8">
          <Totals />
        </div>
        <div className="lg:col-span-4">
          <PendingFromLeila />
        </div>

        <div className="lg:col-span-12">
          <Accounts />
        </div>

        <div className="lg:col-span-7">
          <TodayFeed />
        </div>

        <div className="lg:col-span-5">
          <Envelopes />
        </div>

        <div className="lg:col-span-12">
          <Goals />
        </div>
      </div>
    </>
  );
}

function PageHeading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="hidden lg:block"
    >
      <p className="text-sm text-text-secondary">Понедельник, 8 мая</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Доброе утро, Мирзахит</h1>
    </motion.div>
  );
}

function Totals() {
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
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Всего на счетах</p>
          <div className="mt-3 flex flex-col gap-1">
            <p className="text-3xl font-semibold tracking-tight tabular-nums lg:text-[40px] lg:leading-[1.05]">
              {formatMoney(totals.KGS, "KGS")}
            </p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums text-text-secondary lg:text-[28px]">
              {formatMoney(totals.KZT, "KZT")}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1 rounded-full bg-bg-base/50 px-2.5 py-1 text-income">
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              +12%
            </span>
            <span>за этот месяц</span>
          </div>
        </div>

        <div className="hidden lg:block lg:w-[280px]">
          <Sparkline data={sparkline} />
          <div className="mt-2 flex justify-between text-[11px] text-text-muted">
            <span>1 май</span>
            <span>сегодня</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const w = 280;
  const h = 80;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 8) - 4}`);
  const path = `M ${points.join(" L ")}`;
  const areaPath = `${path} L ${w},${h} L 0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" aria-hidden>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill="url(#sparkFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.2, ease: "easeOut" }}
      />
    </svg>
  );
}

function Accounts() {
  return (
    <section>
      <SectionHeader title="Счета" hint="4 счёта" />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
        }}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
      >
        {accounts.map((a) => {
          const trendColor =
            a.trend === "up" ? "text-income" : a.trend === "down" ? "text-expense" : "text-text-muted";
          const TrendIcon =
            a.trend === "up" ? ArrowUpRight : a.trend === "down" ? ArrowDownRight : null;
          return (
            <motion.button
              key={a.id}
              type="button"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-start rounded-[18px] border border-border-default bg-bg-elevated px-4 py-4 text-left transition-colors hover:bg-bg-card lg:px-5 lg:py-5"
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
                {formatMoney(a.balance, a.currency)}
              </p>
              {TrendIcon ? (
                <p className={`mt-2 inline-flex items-center gap-1 text-xs ${trendColor}`}>
                  <TrendIcon className="h-3 w-3" strokeWidth={2} />
                  {a.trendPct}% за неделю
                </p>
              ) : (
                <p className="mt-2 text-xs text-text-muted">без изменений</p>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

function Envelopes() {
  return (
    <section className="h-full">
      <SectionHeader title="Конверты" hint="ноябрь" />
      <div className="flex flex-col gap-2.5">
        {envelopes.map((e, i) => {
          const ratio = Math.min(e.spent / e.limit, 1);
          const over = e.spent > e.limit;
          const Icon = iconOf(e.iconName);
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.05, ease: "easeOut" }}
              className="rounded-[18px] border border-border-default bg-bg-elevated px-4 py-3.5 lg:px-5 lg:py-4"
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
                        {formatMoney(e.spent, e.currency)}
                      </span>
                      <span className="text-text-muted"> / {formatMoney(e.limit, e.currency)}</span>
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-card">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ratio * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.2 + i * 0.05, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: over ? "var(--expense)" : "var(--accent)" }}
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

function TodayFeed() {
  const { txs } = useStore();
  return (
    <section className="h-full">
      <SectionHeader title="Сегодня" hint={`${txs.length} операции`} />
      <div className="overflow-hidden rounded-[18px] border border-border-default bg-bg-elevated divide-y divide-border-subtle">
        <AnimatePresence initial={false}>
          {txs.map((t, i) => {
            const Icon = iconOf(t.iconName);
            const account = accountById(t.accountId);
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, delay: i < 5 ? 0.25 + i * 0.05 : 0, ease: "easeOut" }}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-card lg:px-5 lg:py-4"
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
                    {account.name} · {t.time}
                    {t.fromLeila ? " · от Лейлы" : ""}
                  </p>
                </div>
                <p
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: t.type === "income" ? "var(--income)" : "var(--text-primary)" }}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatMoney(t.amount, t.currency)}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}

function PendingFromLeila() {
  const { leilaRequest, approveLeila, snoozeLeila } = useStore();

  return (
    <AnimatePresence mode="wait">
      {leilaRequest.status === "pending" ? (
        <motion.section
          key="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
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
              <p className="text-xs text-text-secondary">2 минуты назад</p>
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
              до {formatMoney(leilaRequest.amount, leilaRequest.currency)}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {leilaRequest.category} · {accountById(leilaRequest.accountId).name}
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={approveLeila}
              className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover active:bg-accent-hover"
            >
              Подтвердить
            </button>
            <button
              type="button"
              onClick={snoozeLeila}
              className="rounded-full border border-border-default px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-card"
            >
              Позже
            </button>
          </div>
        </motion.section>
      ) : (
        <motion.section
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-[22px] border border-border-default bg-bg-elevated p-5 lg:p-6"
        >
          <p className="text-sm text-text-secondary">
            {leilaRequest.status === "approved"
              ? "Запрос подтверждён ✓"
              : "Запрос отложен"}
          </p>
          <p className="mt-1 text-xs text-text-muted">Нет новых запросов от Лейлы</p>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function Goals() {
  return (
    <section>
      <SectionHeader title="Цели и накопления" hint={`${goals.length} активные`} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        {goals.map((g, i) => {
          const ratio = Math.min(g.saved / g.total, 1);
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
                    <p className="text-xs text-text-muted">{g.due}</p>
                  </div>
                </div>
                <p className="text-base font-semibold tabular-nums">{pct}%</p>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-bg-card">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.05, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between text-sm tabular-nums">
                <span className="text-text-secondary">{formatMoney(g.saved, g.currency)}</span>
                <span className="text-text-muted">из {formatMoney(g.total, g.currency)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-base font-semibold tracking-tight lg:text-lg">{title}</h2>
      {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
    </div>
  );
}
