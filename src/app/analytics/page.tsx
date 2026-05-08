import { AnalyticsView } from "@/components/AnalyticsView";
import { getMonthAnalytics } from "@/lib/supabase/queries";

export default async function AnalyticsPage() {
  const data = await getMonthAnalytics();
  return <AnalyticsView data={data} />;
}
