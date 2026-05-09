import { notFound } from "next/navigation";
import { EnvelopeDetail } from "@/components/EnvelopeDetail";
import { getAccounts, getEnvelopeDetail } from "@/lib/supabase/queries";

export default async function EnvelopeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, accounts] = await Promise.all([
    getEnvelopeDetail(id),
    getAccounts(),
  ]);
  if (!data || !data.envelope) notFound();
  return (
    <EnvelopeDetail
      envelope={data.envelope}
      transactions={data.transactions}
      accounts={accounts}
    />
  );
}
