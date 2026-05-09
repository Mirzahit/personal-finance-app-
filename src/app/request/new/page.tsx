import { redirect } from "next/navigation";
import { SpouseRequestForm } from "@/components/SpouseRequestForm";
import { getAccounts, getCurrentProfile, getEnvelopes } from "@/lib/supabase/queries";

export default async function NewRequestPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "spouse") redirect("/expense/new");

  const [accounts, envelopes] = await Promise.all([getAccounts(), getEnvelopes()]);

  if (accounts.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base px-5">
        <div className="rounded-[22px] border border-border-default bg-bg-elevated p-6 text-center max-w-md">
          <p className="text-sm text-text-primary">
            Мирзахит ещё не открыл тебе доступ ни к одному счёту. Попроси его открыть нужный счёт в Настройках.
          </p>
        </div>
      </div>
    );
  }

  return <SpouseRequestForm accounts={accounts} envelopes={envelopes} />;
}
