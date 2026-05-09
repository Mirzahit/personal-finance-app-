import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { SpouseHome } from "@/components/SpouseHome";
import {
  getCurrentProfile,
  getDashboardData,
  getMonthAnalytics,
  getMySpouseRequests,
} from "@/lib/supabase/queries";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (profile.role === "spouse") {
    const requests = await getMySpouseRequests();
    return <SpouseHome profile={profile} requests={requests} />;
  }

  const [data, analytics] = await Promise.all([
    getDashboardData(),
    getMonthAnalytics(),
  ]);
  return <Dashboard data={data} analytics={analytics} />;
}
