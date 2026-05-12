import { notFound } from "next/navigation";
import { ExportPanel } from "@/components/export-panel";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionHeading } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { platformLabels } from "@/lib/platforms";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Batch, ExportPlatform } from "@/lib/types";

export default async function ExportPage({ params }: { params: Promise<{ batchId: string }> }) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { batchId } = await params;
  const session = await requireUser();
  if (!session) {
    return <SetupNotice />;
  }

  const { supabase, user } = session;
  const { data: batch } = await supabase.from("batches").select("*").eq("id", batchId).eq("user_id", user.id).single();

  if (!batch) {
    notFound();
  }

  const platforms: ExportPlatform[] = ["master", "getty", "adobe", "shutterstock", "alamy", "dreamstime"];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Export/download"
          title={`Download files for ${(batch as Batch).batch_name}`}
          description="Pick a spreadsheet format, download the files, then upload them manually to a stock website when you are ready."
        />
        <ButtonLink href={`/dashboard/batches/${batchId}/metadata`} variant="ghost">
          Check words first
        </ButtonLink>
      </div>

      <Card>
        <p className="font-semibold text-slate-950">Available templates</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <Badge key={platform} tone={platform === "master" ? "green" : "blue"}>
              {platformLabels[platform]}
            </Badge>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
          Tip: check model/property warnings before submitting to stock platforms.
        </p>
      </Card>

      <ExportPanel batchId={batchId} />
    </div>
  );
}
