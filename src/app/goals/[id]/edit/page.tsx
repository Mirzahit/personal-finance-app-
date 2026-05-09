import { notFound } from "next/navigation";
import { GoalEditForm } from "@/components/GoalEditForm";
import { createClient } from "@/lib/supabase/server";
import type { DbGoal } from "@/lib/supabase/queries";

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select(
      "id, name, target_minor, saved_minor, currency, due_date, achieved, shared_with_spouse"
    )
    .eq("id", id)
    .maybeSingle<DbGoal>();
  if (!data) notFound();
  return <GoalEditForm goal={data} />;
}
