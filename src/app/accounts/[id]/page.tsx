import { notFound } from "next/navigation";
import { AccountDetail } from "@/components/AccountDetail";
import { getAccountDetail } from "@/lib/supabase/queries";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAccountDetail(id);
  if (!data || !data.account) notFound();
  return <AccountDetail account={data.account} transactions={data.transactions} />;
}
