"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Users, XCircle } from "lucide-react";
import { approveLeilaAction, snoozeLeilaAction } from "@/app/actions";
import type { DbAccount, DbLeilaRequest } from "@/lib/supabase/queries";

function formatMoney(minor: number, currency: "KGS" | "KZT") {
  return `${new Intl.NumberFormat("ru-RU").format(minor / 100)} ${
    currency === "KGS" ? "с" : "₸"
  }`;
}

const statusInfo: Record<
  DbLeilaRequest["status"],
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Ждёт", color: "var(--leila-request)", bg: "rgba(91,163,208,0.16)" },
  approved: { label: "Подтверждён", color: "var(--income)", bg: "rgba(63,179,127,0.14)" },
  completed: { label: "Завершён", color: "var(--income)", bg: "rgba(63,179,127,0.14)" },
  rejected: { label: "Отклонён", color: "var(--expense)", bg: "rgba(229,99,77,0.14)" },
  cancelled: { label: "Отменён", color: "var(--text-muted)", bg: "var(--bg-card)" },
  expired: { label: "Просрочен", color: "var(--text-muted)", bg: "var(--bg-card)" },
};

export function LeilaRequestsList({
  requests,
  accounts,
}: {
  requests: DbLeilaRequest[];
  accounts: DbAccount[];
}) {
  const accMap = new Map(accounts.map((a) => [a.id, a]));
  const pending = requests.filter((r) => r.status === "pending");
  const others = requests.filter((r) => r.status !== "pending");

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft">
          <Users className="h-6 w-6 text-text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Запросы Лейлы</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Подтверждай или отклоняй запросы на трату
          </p>
        </div>
      </div>

      {pending.length > 0 ? (
        <Section title="Ждут подтверждения" hint={`${pending.length}`}>
          {pending.map((r, i) => (
            <PendingRow
              key={r.id}
              request={r}
              accountName={accMap.get(r.account_id)?.name ?? "счёт"}
              delay={0.05 + i * 0.04}
            />
          ))}
        </Section>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mt-6 rounded-[22px] border border-dashed border-border-default bg-bg-elevated/40 px-5 py-10 text-center"
        >
          <p className="text-sm text-text-secondary">Нет новых запросов</p>
          <p className="mt-1 text-xs text-text-muted">
            Когда Лейла попросит подтвердить трату — появится здесь.
          </p>
        </motion.div>
      )}

      {others.length > 0 ? (
        <Section title="История" hint={`${others.length}`}>
          {others.map((r, i) => (
            <HistoryRow
              key={r.id}
              request={r}
              accountName={accMap.get(r.account_id)?.name ?? "счёт"}
              delay={0.05 + i * 0.03}
            />
          ))}
        </Section>
      ) : null}
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
    <section className="mt-7">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

function PendingRow({
  request,
  accountName,
  delay,
}: {
  request: DbLeilaRequest;
  accountName: string;
  delay: number;
}) {
  const created = new Date(request.created_at).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="rounded-[18px] border border-border-default bg-bg-elevated p-4"
      style={{
        background:
          "radial-gradient(140% 120% at 100% 0%, rgba(91,163,208,0.10) 0%, var(--bg-elevated) 50%)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: "rgba(91,163,208,0.18)" }}
        >
          <Clock
            className="h-5 w-5"
            strokeWidth={1.75}
            style={{ color: "var(--leila-request)" }}
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{request.category}</p>
          <p className="text-xs text-text-muted">
            {accountName} · {created}
          </p>
        </div>
        <p className="text-base font-semibold tabular-nums">
          {formatMoney(request.estimated_minor, request.currency)}
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
            Отклонить
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function HistoryRow({
  request,
  accountName,
  delay,
}: {
  request: DbLeilaRequest;
  accountName: string;
  delay: number;
}) {
  const info = statusInfo[request.status];
  const Icon =
    request.status === "approved" || request.status === "completed"
      ? CheckCircle2
      : XCircle;
  const created = new Date(request.created_at).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
  });
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-[16px] border border-border-default bg-bg-elevated px-4 py-3"
    >
      <div
        className="grid h-9 w-9 place-items-center rounded-full"
        style={{ background: info.bg }}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} style={{ color: info.color }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{request.category}</p>
        <p className="text-xs text-text-muted">
          {accountName} · {created}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">
          {formatMoney(request.estimated_minor, request.currency)}
        </p>
        <p className="text-[11px]" style={{ color: info.color }}>
          {info.label}
        </p>
      </div>
    </motion.div>
  );
}
