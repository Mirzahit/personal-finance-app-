import { redirect } from "next/navigation";
import { SpouseHome } from "@/components/SpouseHome";
import { getCurrentProfile, getMySpouseRequests } from "@/lib/supabase/queries";

export default async function MePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "spouse") redirect("/");
  const requests = await getMySpouseRequests();
  return <SpouseHome profile={profile} requests={requests} />;
}
