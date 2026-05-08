import Link from "next/link";
import { redirect } from "next/navigation";
import { ExpenseForm } from "@/components/ExpenseForm";
import { getAccounts, getEnvelopes } from "@/lib/supabase/queries";

export default async function NewExpensePage() {
  const [accounts, envelopes] = await Promise.all([getAccounts(), getEnvelopes()]);

  if (accounts.length === 0) {
    redirect("/accounts/new");
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-bg-base/85 px-5 py-3 backdrop-blur-md lg:px-10 lg:py-4">
        <div className="mx-auto flex w-full max-w-[640px] items-center gap-3">
          <Link
            href="/"
            aria-label="Назад"
            className="grid h-10 w-10 place-items-center rounded-full border border-border-default bg-bg-elevated transition-colors hover:bg-bg-card"
          >
            ←
          </Link>
          <h1 className="flex-1 text-base font-semibold tracking-tight lg:text-lg">
            Новый расход
          </h1>
        </div>
      </header>
      <ExpenseForm accounts={accounts} envelopes={envelopes} />
    </div>
  );
}
