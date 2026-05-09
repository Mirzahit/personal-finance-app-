import { createClient } from "./server";
import type { DbTx } from "./queries";

export async function getTransaction(id: string): Promise<DbTx | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select(
      "id, title, account_id, envelope_id, user_id, amount_minor, currency, type, occurred_at, from_leila"
    )
    .eq("id", id)
    .maybeSingle<DbTx>();
  return data ?? null;
}
