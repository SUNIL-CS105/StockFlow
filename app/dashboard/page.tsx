import { FileSpreadsheet, Images, Sparkles, UploadCloud } from "lucide-react";
import { BatchCard } from "@/components/batch-card";
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
          title="Your stock photo workflow"
          description="Create batches, generate metadata, review warnings, and download CSV exports."
        />
        <div className="flex gap-3">
          <SignOutButton />
          <ButtonLink href="/dashboard/batches/new">Create New Batch</ButtonLink>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <UploadCloud className="text-blue-600" />
          <p className="mt-4 text-3xl font-bold text-slate-950">{summaries.length}</p>
          <p className="text-sm text-slate-500">batches</p>
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
          <p className="text-sm text-slate-500">ready for CSV</p>
        </Card>
        <Card>
          <Sparkles className="text-emerald-600" />
          <p className="mt-4 text-3xl font-bold text-slate-950">5</p>
          <p className="text-sm text-slate-500">platform templates</p>
        </Card>
      </section>

      <section id="workflow" className="grid gap-4 md:grid-cols-3">
        {[
          ["1", "Upload Images", "Drag-and-drop your first batch of stock photos."],
          ["2", "Generate Metadata", "AI suggests titles, descriptions, keywords, releases, and quality warnings."],
          ["3", "Export CSV", "Download master and platform-specific spreadsheets plus backup files."],
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
          <h2 className="text-2xl font-bold text-slate-950">Recent batches</h2>
          <ButtonLink href="/dashboard/batches/new" variant="secondary">
            Upload Images
          </ButtonLink>
        </div>
        {summaries.length === 0 ? (
          <Card className="text-center">
            <p className="text-xl font-bold text-slate-950">Upload your first batch of stock photos.</p>
            <p className="mt-2 text-slate-600">You will see thumbnails, progress, and metadata status here.</p>
            <ButtonLink href="/dashboard/batches/new" className="mt-6">
              Create New Batch
            </ButtonLink>
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
