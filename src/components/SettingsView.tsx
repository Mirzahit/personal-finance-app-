"use client";

import { motion } from "framer-motion";
import {
  CreditCard,
  HandCoins,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toggleResourceSharedAction } from "@/app/actions";
import type {
  DbAccount,
  DbDebt,
  DbEnvelope,
  DbGoal,
  PermissionsData,
} from "@/lib/supabase/queries";

function formatMoney(minor: number, currency: "KGS" | "KZT") {
  return `${new Intl.NumberFormat("ru-RU").format(minor / 100)} ${
    currency === "KGS" ? "с" : "₸"
  }`;
}

export function SettingsView({ data }: { data: PermissionsData }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft">
          <Users className="h-6 w-6 text-text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Права для Лейлы</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Отметь что Лейла видит в приложении. Всё остальное скрыто.
          </p>
        </div>
      </div>

      <Section title="Счета" icon={Wallet} hint="Лейла видит баланс и операции выбранных счетов">
        {data.accounts.length === 0 ? (
          <Empty text="Пока нет счетов" />
        ) : (
          <div className="flex flex-col gap-2">
            {data.accounts.map((a) => (
              <PermissionRow
                key={a.id}
                resource="account"
                id={a.id}
                title={a.name}
                subtitle={`${a.bank} · ${formatMoney(a.balance_minor, a.currency)}`}
                shared={a.shared_with_spouse ?? false}
              />
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Конверты"
        icon={CreditCard}
        hint="Видны только конверты привязанные к открытым счетам"
      >
        {data.envelopes.length === 0 ? (
          <Empty text="Пока нет конвертов" />
        ) : (
          <div className="flex flex-col gap-2">
            {data.envelopes.map((e) => (
              <PermissionRow
                key={e.id}
                resource="envelope"
                id={e.id}
                title={e.name}
                subtitle={`${formatMoney(e.spent_minor, e.currency)} / ${formatMoney(
                  e.limit_minor,
                  e.currency
                )}`}
                shared={e.shared_with_spouse ?? false}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Цели" icon={Target}>
        {data.goals.length === 0 ? (
          <Empty text="Пока нет целей" />
        ) : (
          <div className="flex flex-col gap-2">
            {data.goals.map((g) => (
              <PermissionRow
                key={g.id}
                resource="goal"
                id={g.id}
                title={g.name}
                subtitle={`${formatMoney(g.saved_minor, g.currency)} / ${formatMoney(
                  g.target_minor,
                  g.currency
                )}`}
                shared={g.shared_with_spouse ?? false}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Долги" icon={HandCoins}>
        {data.debts.length === 0 ? (
          <Empty text="Долгов нет" />
        ) : (
          <div className="flex flex-col gap-2">
            {data.debts.map((d) => (
              <PermissionRow
                key={d.id}
                resource="debt"
                id={d.id}
                title={d.creditor}
                subtitle={`выплачено ${formatMoney(d.paid_minor, d.currency)} / ${formatMoney(
                  d.total_minor,
                  d.currency
                )}`}
                shared={d.shared_with_spouse ?? false}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  hint,
  children,
}: {
  title: string;
  icon: LucideIcon;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-7"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-text-secondary">
          {title}
        </h2>
      </div>
      {hint ? <p className="mb-3 text-xs text-text-muted">{hint}</p> : null}
      {children}
    </motion.section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-border-default bg-bg-elevated/40 px-4 py-4 text-center text-xs text-text-muted">
      {text}
    </div>
  );
}

function PermissionRow({
  resource,
  id,
  title,
  subtitle,
  shared,
}: {
  resource: "account" | "envelope" | "goal" | "debt";
  id: string;
  title: string;
  subtitle: string;
  shared: boolean;
}) {
  return (
    <form
      action={toggleResourceSharedAction}
      className="flex items-center gap-3 rounded-[14px] border border-border-default bg-bg-elevated px-4 py-3"
    >
      <input type="hidden" name="resource" value={resource} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="shared" value={shared ? "false" : "true"} />
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-text-muted">{subtitle}</p>
      </div>
      <button
        type="submit"
        aria-label={shared ? "Скрыть от Лейлы" : "Показать Лейле"}
        className="relative h-7 w-12 rounded-full transition-colors"
        style={{
          background: shared ? "var(--accent)" : "var(--bg-card)",
        }}
      >
        <span
          className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all"
          style={{
            left: shared ? "calc(100% - 24px)" : "4px",
          }}
        />
      </button>
    </form>
  );
}
