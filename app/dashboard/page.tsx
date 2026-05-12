import { FileSpreadsheet, Images, Sparkles, UploadCloud } from "lucide-react";
import { BatchCard } from "@/components/batch-card";
import { DemoBatchButton } from "@/components/demo-batch-button";
import { SetupNotice } from "@/components/setup-notice";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionHeading } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Batch } from "@/lib/types";

type BatchSummary = Batch & { image_count: number };

export default async function DashboardPage() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const session = await requireUser();
  if (!session) {
    return <SetupNotice />;
  }

  const { supabase, user } = session;
  const { data: batches } = await supabase
    .from("batches")
    .select("*, images(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const summaries: BatchSummary[] =
    batches?.map((batch) => ({
      ...(batch as Batch),
      image_count: Array.isArray(batch.images) ? batch.images[0]?.count ?? 0 : 0,
    })) ?? [];

  const imageTotal = summaries.reduce((total, batch) => total + batch.image_count, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Dashboard"
          title="Start with one simple choice"
          description="Try the sample batch first, or upload your own photos when you are ready."
        />
        <div className="flex flex-wrap gap-3">
          <SignOutButton />
          <DemoBatchButton />
          <ButtonLink href="/dashboard/batches/new">Upload my photos</ButtonLink>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-100">Student mode</p>
            <h2 className="mt-3 text-3xl font-bold">Learn the stock photo workflow without fear.</h2>
            <p className="mt-3 max-w-3xl text-blue-50">
              The sample batch already has photos and metadata, so you can practice editing keywords, checking warnings,
              and downloading CSV files before uploading your own images.
            </p>
          </div>
          <DemoBatchButton className="[&_button]:bg-white [&_button]:text-blue-700 [&_button]:hover:bg-blue-50" />
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <UploadCloud className="text-blue-600" />
          <p className="mt-4 text-3xl font-bold text-slate-950">{summaries.length}</p>
          <p className="text-sm text-slate-500">photo projects</p>
        </Card>
        <Card>
          <Images className="text-emerald-600" />
          <p className="mt-4 text-3xl font-bold text-slate-950">{imageTotal}</p>
          <p className="text-sm text-slate-500">images uploaded</p>
        </Card>
        <Card>
          <FileSpreadsheet className="text-blue-600" />
          <p className="mt-4 text-3xl font-bold text-slate-950">
            {summaries.filter((batch) => batch.status === "metadata_ready").length}
          </p>
          <p className="text-sm text-slate-500">ready to download</p>
        </Card>
        <Card>
          <Sparkles className="text-emerald-600" />
          <p className="mt-4 text-3xl font-bold text-slate-950">5</p>
          <p className="text-sm text-slate-500">platform templates</p>
        </Card>
      </section>

      <section id="workflow" className="grid gap-4 md:grid-cols-3">
        {[
          ["1", "Add photos", "Use the demo batch or drag in your own pictures."],
          ["2", "Check the words", "Edit the title, description, and keywords like a simple spreadsheet."],
          ["3", "Download files", "Export CSV files that stock websites can read."],
        ].map(([step, title, description]) => (
          <Card key={step}>
            <Badge tone="green">Step {step}</Badge>
            <h2 className="mt-4 text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </Card>
        ))}
      </section>

      <section id="batches" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-950">Your photo projects</h2>
          <ButtonLink href="/dashboard/batches/new" variant="secondary">
            Upload photos
          </ButtonLink>
        </div>
        {summaries.length === 0 ? (
          <Card className="text-center">
            <p className="text-xl font-bold text-slate-950">Try StockFlow with sample photos.</p>
            <p className="mt-2 text-slate-600">No upload needed. Practice reviewing metadata and exporting CSV files.</p>
            <div className="mt-6 flex justify-center gap-3">
              <DemoBatchButton />
              <ButtonLink href="/dashboard/batches/new" variant="ghost">
                Upload my photos
              </ButtonLink>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {summaries.map((batch) => (
              <BatchCard key={batch.id} batch={batch} imageCount={batch.image_count} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
