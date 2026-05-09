import { redirect } from "next/navigation";
import { SettingsView } from "@/components/SettingsView";
import { getCurrentProfile, getPermissionsData } from "@/lib/supabase/queries";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "owner") {
    return (
      <div className="rounded-[22px] border border-border-default bg-bg-elevated p-8 text-center">
        <p className="text-sm text-text-secondary">
          Настройки доступны только владельцу семьи.
        </p>
      </div>
    );
  }
  const data = await getPermissionsData();
  return <SettingsView data={data} />;
}
