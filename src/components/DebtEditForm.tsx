"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { deleteDebtAction, editDebtAction, type ActionState } from "@/app/actions";
import type { DbDebt } from "@/lib/supabase/queries";

const initialState: ActionState = {};

export function DebtEditForm({ debt }: { debt: DbDebt }) {
  const [state, formAction, pending] = useActionState(editDebtAction, initialState);
  const [creditor, setCreditor] = useState(debt.creditor);
  const [total, setTotal] = useState(String(debt.total_minor / 100));
  const [endDate, setEndDate] = useState(debt.end_date ?? "");

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-bg-base/85 px-5 py-3 backdrop-blur-md lg:px-10 lg:py-4">
        <div className="mx-auto flex w-full max-w-[640px] items-center gap-3">
          <Link
            href="/debts"
            aria-label="Назад"
            className="grid h-10 w-10 place-items-center rounded-full border border-border-default bg-bg-elevated transition-colors hover:bg-bg-card"
          >
            ←
          </Link>
          <h1 className="flex-1 text-base font-semibold tracking-tight lg:text-lg">
            Изменить долг
          </h1>
        </div>
      </header>

      <form
        action={formAction}
        className="mx-auto w-full max-w-[640px] flex-1 px-5 pt-6 pb-32 lg:px-0 lg:pt-10"
      >
        <input type="hidden" name="id" value={debt.id} />
        <input type="hidden" name="creditor" value={creditor} />
        <input type="hidden" name="total" value={total} />
        <input type="hidden" name="end_date" value={endDate} />

        <Section title="Кому должен">
          <input
            type="text"
            value={creditor}
            onChange={(e) => setCreditor(e.target.value)}
            required
            className="w-full rounded-[16px] border border-border-default bg-bg-elevated px-4 py-3.5 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </Section>

        <Section title="Сумма долга">
          <div className="flex items-baseline gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={total}
              onChange={(e) => setTotal(e.target.value.replace(/[^\d.]/g, ""))}
              className="w-full rounded-[16px] border border-border-default bg-bg-elevated px-4 py-3.5 text-base font-semibold tabular-nums text-text-primary focus:border-accent focus:outline-none"
            />
            <span className="text-base font-semibold tabular-nums text-text-secondary">
              {debt.currency === "KGS" ? "с" : "₸"}
            </span>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Уже выплачено: {(debt.paid_minor / 100).toLocaleString("ru-RU")}{" "}
            {debt.currency === "KGS" ? "с" : "₸"}
          </p>
        </Section>

        <Section title="Срок погашения" hint="необязательно">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-[16px] border border-border-default bg-bg-elevated px-4 py-3.5 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </Section>

        {state.error ? <p className="mt-5 text-sm text-expense">{state.error}</p> : null}

        <Section title="Опасные действия">
          <form action={deleteDebtAction} className="flex">
            <input type="hidden" name="id" value={debt.id} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-expense/40 bg-bg-elevated px-4 py-3 text-sm text-expense transition-colors hover:bg-expense/10"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              Удалить долг
            </button>
          </form>
        </Section>

        <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border-subtle bg-bg-base/95 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 backdrop-blur-md lg:px-10 lg:py-4">
          <div className="mx-auto flex w-full max-w-[640px] gap-3">
            <Link
              href="/debts"
              className="rounded-full border border-border-default px-5 py-3 text-sm text-text-secondary transition-colors hover:bg-bg-card"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={pending || !creditor || !total || Number(total) <= 0}
              className="flex-1 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Сохраняю…" : "Сохранить"}
            </button>
          </div>
        </div>
      </form>
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
    <section className="mt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-text-muted">
          {title}
        </h2>
        {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}
