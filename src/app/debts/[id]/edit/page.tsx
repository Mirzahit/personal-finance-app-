import { notFound } from "next/navigation";
import { DebtEditForm } from "@/components/DebtEditForm";
import { createClient } from "@/lib/supabase/server";
import type { DbDebt } from "@/lib/supabase/queries";

export default async function EditDebtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("debts")
    .select(
      "id, creditor, total_minor, paid_minor, currency, start_date, end_date, paid_off, shared_with_spouse"
    )
    .eq("id", id)
    .maybeSingle<DbDebt>();
  if (!data) notFound();
  return <DebtEditForm debt={data} />;
}
