import { SettingsForm } from "@/components/settings-form";
import { SetupNotice } from "@/components/setup-notice";
import { Card, SectionHeading } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { defaultSettings } from "@/lib/settings";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserSettings } from "@/lib/types";

export default async function SettingsPage() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const session = await requireUser();
  if (!session) {
    return <SetupNotice />;
  }

  const { supabase, user } = session;
  const { data } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
  const settings = (data as UserSettings | null) ?? defaultSettings(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <SectionHeading
        eyebrow="Settings"
        title="Tune StockFlow defaults"
        description="Choose default platforms, keyword count, license preference, scientific names, quality strictness, and beginner explanations."
      />
      <Card>
        <SettingsForm settings={settings} />
      </Card>
    </div>
  );
}
