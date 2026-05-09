import { redirect } from "next/navigation";
import { LeilaRequestsList } from "@/components/LeilaRequestsList";
import {
  getAccounts,
  getCurrentProfile,
  getMySpouseRequests,
} from "@/lib/supabase/queries";

export default async function LeilaPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "owner") redirect("/me");

  const [requests, accounts] = await Promise.all([
    getMySpouseRequests(),
    getAccounts(),
  ]);

  return <LeilaRequestsList requests={requests} accounts={accounts} />;
}
