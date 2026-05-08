import { EnvelopesList } from "@/components/EnvelopesList";
import { getAccounts, getEnvelopes } from "@/lib/supabase/queries";

export default async function EnvelopesPage() {
  const [envelopes, accounts] = await Promise.all([getEnvelopes(), getAccounts()]);
  return <EnvelopesList envelopes={envelopes} accounts={accounts} />;
}
