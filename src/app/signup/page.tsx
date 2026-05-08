"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "../auth/actions";

const initialState: AuthState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-white">
            <Wallet className="h-6 w-6" strokeWidth={2} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Создай семью</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Один аккаунт на семью — потом пригласишь Лейлу
          </p>
        </div>

        <form action={formAction} className="rounded-[22px] border border-border-default bg-bg-elevated p-5 lg:p-6">
          <Field label="Как тебя зовут">
            <input
              type="text"
              name="display_name"
              autoComplete="name"
              required
              placeholder="Мирзахит"
              className="w-full rounded-[14px] border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </Field>
          <Field label="Название семьи">
            <input
              type="text"
              name="household_name"
              required
              defaultValue="Семья"
              className="w-full rounded-[14px] border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="ты@example.com"
              className="w-full rounded-[14px] border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </Field>
          <Field label="Пароль">
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="не меньше 6 символов"
              className="w-full rounded-[14px] border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </Field>

          {state.error ? (
            <p className="mt-3 text-sm text-expense">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 w-full rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Создаю…" : "Создать аккаунт"}
          </button>

          <p className="mt-5 text-center text-sm text-text-secondary">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Войти
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
