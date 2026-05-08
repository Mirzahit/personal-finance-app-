import { redirect } from "next/navigation";
import { EnvelopeForm } from "@/components/EnvelopeForm";
import { getAccounts } from "@/lib/supabase/queries";

export default async function NewEnvelopePage() {
  const accounts = await getAccounts();
  if (accounts.length === 0) redirect("/accounts/new");
  return <EnvelopeForm accounts={accounts} />;
}
