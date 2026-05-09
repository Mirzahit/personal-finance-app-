import { notFound } from "next/navigation";
import { TransactionEditForm } from "@/components/TransactionEditForm";
import { getTransaction } from "@/lib/supabase/getTransaction";
import { getAccounts, getEnvelopes } from "@/lib/supabase/queries";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tx, accounts, envelopes] = await Promise.all([
    getTransaction(id),
    getAccounts(),
    getEnvelopes(),
  ]);
  if (!tx) notFound();
  return (
    <TransactionEditForm tx={tx} accounts={accounts} envelopes={envelopes} />
  );
}
