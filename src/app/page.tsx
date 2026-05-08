"use client";

import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CreditCard,
  HandCoins,
  LayoutDashboard,
  LineChart,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Target,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type Currency = "KGS" | "KZT";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

type Account = {
  id: string;
  name: string;
  bank: string;
  balance: number;
  currency: Currency;
  trend: "up" | "down" | "flat";
  trendPct: number;
};

type Envelope = {
  id: string;
  name: string;
  spent: number;
  limit: number;
  currency: Currency;
  icon: LucideIcon;
};

type Tx = {
  id: string;
  title: string;
  account: string;
  amount: number;
  currency: Currency;
  type: "income" | "expense";
  time: string;
  icon: LucideIcon;
};

type Goal = {
  id: string;
  name: string;
  saved: number;
  total: number;
  currency: Currency;
  due: string;
};

const accounts: Account[] = [
  { id: "m-bank", name: "М банк", bank: "Бишкек", balance: 124_800, currency: "KGS", trend: "up", trendPct: 4.2 },
  { id: "kaspi", name: "Каспи", bank: "Алматы", balance: 287_500, currency: "KZT", trend: "down", trendPct: 1.8 },
  { id: "cash-kgs", name: "Наличные", bank: "Сом", balance: 18_200, currency: "KGS", trend: "flat", trendPct: 0 },
  { id: "cash-kzt", name: "Наличные", bank: "Тенге", balance: 35_000, currency: "KZT", trend: "flat", trendPct: 0 },
];

const envelopes: Envelope[] = [
  { id: "food", name: "Еда", spent: 42_300, limit: 80_000, currency: "KZT", icon: Utensils },
  { id: "shopping", name: "Покупки", spent: 18_700, limit: 25_000, currency: "KGS", icon: ShoppingBag },
  { id: "savings", name: "Подушка", spent: 60_000, limit: 100_000, currency: "KZT", icon: Target },
];

const today: Tx[] = [
  { id: "t1", title: "Globus", account: "М банк", amount: 1_240, currency: "KGS", type: "expense", time: "12:18", icon: ShoppingBag },
  { id: "t2", title: "Кафе Navat", account: "Каспи", amount: 6_800, currency: "KZT", type: "expense", time: "10:42", icon: Utensils },
  { id: "t3", title: "Перевод от клиента", account: "Каспи", amount: 120_000, currency: "KZT", type: "income", time: "09:05", icon: ArrowDownRight },
  { id: "t4", title: "Бензин", account: "Наличные тенге", amount: 8_400, currency: "KZT", type: "expense", time: "08:20", icon: ShoppingBag },
];

const goals: Goal[] = [
  { id: "g1", name: "Машина", saved: 1_300_000, total: 3_000_000, currency: "KZT", due: "до декабря" },
  { id: "g2", name: "Отпуск", saved: 78_000, total: 100_000, currency: "KGS", due: "до июня" },
];

const sparkline = [42, 48, 45, 52, 49, 58, 56, 62, 60, 67, 65, 72, 70, 78, 76, 82];

const navItems = [
  { id: "dashboard", label: "Главная", icon: LayoutDashboard, active: true },
  { id: "accounts", label: "Счета", icon: Wallet, active: false },
  { id: "envelopes", label: "Конверты", icon: CreditCard, active: false },
  { id: "goals", label: "Цели", icon: Target, active: false },
  { id: "debts", label: "Долги", icon: HandCoins, active: false },
  { id: "leila", label: "Лейла", icon: Users, active: false, badge: 1 },
  { id: "analytics", label: "Аналитика", icon: LineChart, active: false },
  { id: "settings", label: "Настройки", icon: Settings, active: false },
];

const currencySymbol: Record<Currency, string> = { KGS: "с", KZT: "₸" };

function formatMoney(amount: number, currency: Currency) {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ${currencySymbol[currency]}`;
}

const totals = accounts.reduce(
  (acc, a) => {
    acc[a.currency] += a.balance;
    return acc;
  },
  { KGS: 0, KZT: 0 } as Record<Currency, number>
);

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-5 pt-6 pb-32 lg:px-10 lg:pt-8 lg:pb-12">
          <div className="mx-auto w-full max-w-[1200px]">
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
          </div>
        </main>
      </div>

      <FloatingActions />
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-[240px] lg:shrink-0 lg:flex-col lg:border-r lg:border-border-subtle lg:bg-bg-elevated/40 lg:px-4 lg:py-6">
      <div className="flex items-center gap-2.5 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-white">
          <Wallet className="h-5 w-5" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Финансы</p>
          <p className="text-[11px] text-text-muted leading-tight">семейный учёт</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                item.active
                  ? "bg-accent-soft text-text-primary"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  item.active ? "text-text-primary" : "text-text-muted group-hover:text-text-secondary"
                }`}
                strokeWidth={1.75}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge ? (
                <span
                  className="grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-semibold"
                  style={{ background: "rgba(91,163,208,0.18)", color: "var(--leila-request)" }}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-border-default bg-bg-elevated p-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-sm font-semibold">
            М
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-tight">Мирзахит</p>
            <p className="text-[11px] text-text-muted leading-tight">+ Лейла</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-bg-base/80 px-5 py-3 backdrop-blur-md lg:px-10 lg:py-4">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-4">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-base font-semibold">
            М
          </div>
          <div>
            <p className="text-xs text-text-secondary leading-tight">Привет,</p>
            <p className="text-base font-semibold leading-tight">Мирзахит</p>
          </div>
        </div>

        <div className="hidden flex-1 lg:flex">
          <div className="flex w-full max-w-md items-center gap-2.5 rounded-full border border-border-default bg-bg-elevated px-4 py-2.5">
            <Search className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Найти операцию, конверт, цель…"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <kbd className="hidden rounded-md border border-border-subtle bg-bg-base/60 px-1.5 py-0.5 text-[10px] text-text-muted lg:inline-block">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="hidden items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover lg:flex"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Добавить расход
          </button>
          <button
            type="button"
            aria-label="Уведомления"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-border-default bg-bg-elevated transition-colors hover:bg-bg-card"
          >
            <Bell className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-leila-request" />
          </button>
        </div>
      </div>
    </header>
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
          const Icon = e.icon;
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
  return (
    <section className="h-full">
      <SectionHeader title="Сегодня" hint={`${today.length} операции`} />
      <div className="overflow-hidden rounded-[18px] border border-border-default bg-bg-elevated divide-y divide-border-subtle">
        {today.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 + i * 0.05, ease: "easeOut" }}
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
                  {t.account} · {t.time}
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
      </div>
    </section>
  );
}

function PendingFromLeila() {
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
        <p className="mt-1 text-2xl font-semibold tabular-nums">до 4 500 ₸</p>
        <p className="mt-1 text-sm text-text-secondary">Продукты · Каспи</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Подтвердить
        </button>
        <button
          type="button"
          className="rounded-full border border-border-default px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-card"
        >
          Позже
        </button>
      </div>
    </motion.section>
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

function FloatingActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
      className="fixed bottom-[max(env(safe-area-inset-bottom),20px)] left-1/2 z-20 -translate-x-1/2 lg:hidden"
    >
      <button
        type="button"
        className="flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-base font-medium text-white shadow-[0_10px_30px_-8px_rgba(40,98,58,0.6)] transition-colors active:bg-accent-hover"
      >
        <Plus className="h-5 w-5" strokeWidth={2.25} />
        Добавить расход
      </button>
    </motion.div>
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
