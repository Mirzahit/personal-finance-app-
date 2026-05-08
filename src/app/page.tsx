import { Dashboard } from "@/components/Dashboard";
import { getDashboardData, getMonthAnalytics } from "@/lib/supabase/queries";

export default async function HomePage() {
  const [data, analytics] = await Promise.all([
    getDashboardData(),
    getMonthAnalytics(),
  ]);
  return <Dashboard data={data} analytics={analytics} />;
}
