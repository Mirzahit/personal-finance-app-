"use client";

import { motion } from "framer-motion";
import { HandCoins, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  deleteDebtAction,
  payDebtAction,
  type ActionState,
} from "@/app/actions";
import type { DbAccount, DbDebt } from "@/lib/supabase/queries";

const initialState: ActionState = {};

function formatMoney(minor: number, currency: "KGS" | "KZT") {
  return `${new Intl.NumberFormat("ru-RU").format(minor / 100)} ${
    currency === "KGS" ? "с" : "₸"
  }`;
}

export function DebtsList({
  debts,
  accounts,
}: {
  debts: DbDebt[];
  accounts: DbAccount[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Долги</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Только «я должен» — что нужно вернуть
          </p>
        </div>
        <Link
          href="/debts/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          Долг
        </Link>
      </div>

      {debts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-6 rounded-[22px] border border-dashed border-border-default bg-bg-elevated/40 px-6 py-12 text-center lg:px-10 lg:py-16"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft">
            <HandCoins className="h-6 w-6 text-text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">Долгов нет</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Если кому-то должен — добавь сюда. Будешь видеть сколько осталось
            заплатить и срок.
          </p>
          <Link
            href="/debts/new"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Добавить долг
          </Link>
        </motion.div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {debts.map((d) => (
            <DebtCard key={d.id} debt={d} accounts={accounts} />
          ))}
        </div>
      )}
    </div>
  );
}

function DebtCard({ debt, accounts }: { debt: DbDebt; accounts: DbAccount[] }) {
  const [state, formAction, pending] = useActionState(payDebtAction, initialState);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<string>(
    accounts.find((a) => a.currency === debt.currency)?.id ?? ""
  );

  const matchingAccounts = accounts.filter((a) => a.currency === debt.currency);
  const ratio = debt.total_minor > 0 ? Math.min(debt.paid_minor / debt.total_minor, 1) : 0;
  const pct = Math.round(ratio * 100);
  const left = Math.max(debt.total_minor - debt.paid_minor, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-[22px] border border-border-default bg-bg-elevated px-5 py-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{ background: "rgba(216,84,71,0.16)" }}
          >
            <HandCoins
              className="h-5 w-5"
              strokeWidth={1.75}
              style={{ color: "var(--debt)" }}
            />
          </div>
          <div>
            <p className="text-sm font-medium">{debt.creditor}</p>
            <p className="text-xs text-text-muted">
              {debt.end_date ? `до ${debt.end_date}` : "без срока"}
              {debt.paid_off ? " · ✓ погашен" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold tabular-nums">{pct}%</p>
          <form action={deleteDebtAction}>
            <input type="hidden" name="id" value={debt.id} />
            <button
              type="submit"
              aria-label="Удалить"
              className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-bg-card hover:text-expense"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-bg-card">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "var(--accent)" }}
        />
      </div>
      <div className="mt-2 flex items-baseline justify-between text-sm tabular-nums">
        <span className="text-text-secondary">
          выплачено {formatMoney(debt.paid_minor, debt.currency)}
        </span>
        <span className="text-text-muted">
          из {formatMoney(debt.total_minor, debt.currency)}
        </span>
      </div>
      {!debt.paid_off ? (
        <p className="mt-1 text-xs" style={{ color: "var(--debt)" }}>
          Осталось {formatMoney(left, debt.currency)}
        </p>
      ) : null}

      {!debt.paid_off && matchingAccounts.length > 0 ? (
        <form
          action={async (fd) => {
            await formAction(fd);
            setAmount("");
          }}
          className="mt-4 rounded-2xl border border-border-subtle bg-bg-base/40 p-3"
        >
          <input type="hidden" name="debt_id" value={debt.id} />
          <input type="hidden" name="account_id" value={accountId} />
          <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
            Заплатить со счёта
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {matchingAccounts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccountId(a.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                  a.id === accountId
                    ? "border-accent bg-accent-soft text-text-primary"
                    : "border-border-default text-text-secondary hover:bg-bg-card"
                }`}
              >
                {a.name} · {a.bank}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              name="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="Сумма"
              className="flex-1 rounded-full border border-border-default bg-bg-elevated px-4 py-2 text-sm tabular-nums text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={pending || !amount || Number(amount) <= 0 || !accountId}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "…" : "Заплатить"}
            </button>
          </div>
          {state.error ? (
            <p className="mt-2 text-xs text-expense">{state.error}</p>
          ) : null}
        </form>
      ) : null}
    </motion.div>
  );
}
