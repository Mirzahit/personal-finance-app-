import { DebtsList } from "@/components/DebtsList";
import { getAccounts, getDebts } from "@/lib/supabase/queries";

export default async function DebtsPage() {
  const [debts, accounts] = await Promise.all([getDebts(), getAccounts()]);
  return <DebtsList debts={debts} accounts={accounts} />;
}
