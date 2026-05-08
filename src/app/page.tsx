import { Dashboard } from "@/components/Dashboard";
import { getDashboardData } from "@/lib/supabase/queries";

export default async function HomePage() {
  const data = await getDashboardData();
  return <Dashboard data={data} />;
}
