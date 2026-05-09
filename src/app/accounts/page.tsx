import { AccountsList } from "@/components/AccountsList";
import { getAccounts } from "@/lib/supabase/queries";

export default async function AccountsPage() {
  const accounts = await getAccounts();
  return <AccountsList accounts={accounts} />;
}
