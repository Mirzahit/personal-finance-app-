import { GoalsList } from "@/components/GoalsList";
import { getAccounts, getGoals } from "@/lib/supabase/queries";

export default async function GoalsPage() {
  const [goals, accounts] = await Promise.all([getGoals(), getAccounts()]);
  return <GoalsList goals={goals} accounts={accounts} />;
}
