"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Plus, XCircle } from "lucide-react";
import Link from "next/link";
import type { DbLeilaRequest, DbProfile } from "@/lib/supabase/queries";

function formatMoney(minor: number, currency: "KGS" | "KZT") {
  return `${new Intl.NumberFormat("ru-RU").format(minor / 100)} ${
    currency === "KGS" ? "с" : "₸"
  }`;
}

const statusInfo: Record<
  DbLeilaRequest["status"],
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Ждёт подтверждения", color: "var(--leila-request)", bg: "rgba(91,163,208,0.16)" },
  approved: { label: "Подтверждён", color: "var(--income)", bg: "rgba(63,179,127,0.14)" },
  completed: { label: "Завершён", color: "var(--income)", bg: "rgba(63,179,127,0.14)" },
  rejected: { label: "Отклонён", color: "var(--expense)", bg: "rgba(229,99,77,0.14)" },
  cancelled: { label: "Отменён", color: "var(--text-muted)", bg: "var(--bg-card)" },
  expired: { label: "Просрочен", color: "var(--text-muted)", bg: "var(--bg-card)" },
};

export function SpouseHome({
  profile,
  requests,
}: {
  profile: DbProfile;
  requests: DbLeilaRequest[];
}) {
  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved" || r.status === "completed");

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <p className="text-sm text-text-secondary">Привет,</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
          {profile.display_name}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Здесь твои запросы на трату и их статус.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
        className="mt-6"
      >
        <Link
          href="/request/new"
          className="flex items-center justify-center gap-2 rounded-[18px] border border-accent bg-accent-soft px-5 py-5 text-base font-medium text-text-primary transition-colors hover:bg-accent/20"
        >
          <Plus className="h-5 w-5" strokeWidth={2.25} />
          Запросить новую трату
        </Link>
      </motion.div>

      {pending.length > 0 ? (
        <Section title="Ждут подтверждения" hint={`${pending.length}`}>
          {pending.map((r, i) => (
            <RequestCard key={r.id} request={r} delay={0.1 + i * 0.04} />
          ))}
        </Section>
      ) : null}

      {approved.length > 0 ? (
        <Section title="Подтверждённые" hint={`${approved.length}`}>
          {approved.map((r, i) => (
            <RequestCard key={r.id} request={r} delay={0.1 + i * 0.04} />
          ))}
        </Section>
      ) : null}

      {requests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-8 rounded-[22px] border border-dashed border-border-default bg-bg-elevated/40 px-5 py-12 text-center"
        >
          <p className="text-sm text-text-secondary">Пока запросов нет.</p>
          <p className="mt-1 text-xs text-text-muted">
            Хочешь что-то купить — нажми «Запросить трату» сверху.
          </p>
        </motion.div>
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

function RequestCard({ request, delay }: { request: DbLeilaRequest; delay: number }) {
  const info = statusInfo[request.status];
  const Icon =
    request.status === "pending"
      ? Clock
      : request.status === "approved" || request.status === "completed"
        ? CheckCircle2
        : XCircle;
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
      className="rounded-[18px] border border-border-default bg-bg-elevated px-4 py-3.5"
    >
      <div className="flex items-center gap-3">
        <div
          className="grid h-9 w-9 place-items-center rounded-full"
          style={{ background: info.bg }}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} style={{ color: info.color }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{request.category}</p>
          <p className="text-xs text-text-muted">{created}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">
            {formatMoney(request.estimated_minor, request.currency)}
          </p>
          <p className="text-[11px]" style={{ color: info.color }}>
            {info.label}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
