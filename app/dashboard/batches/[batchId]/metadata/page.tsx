import { notFound } from "next/navigation";
import { MetadataTable } from "@/components/metadata-table";
import { SetupNotice } from "@/components/setup-notice";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Batch, ImageMetadata, StockImage } from "@/lib/types";

export default async function MetadataPage({ params }: { params: Promise<{ batchId: string }> }) {
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

  const { data: imageRows } = await supabase
    .from("images")
    .select("*, metadata(*)")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true });

  const rows = ((imageRows ?? []) as (StockImage & { metadata: ImageMetadata[] | ImageMetadata | null })[]).map((image) => ({
    ...image,
    metadata: Array.isArray(image.metadata) ? image.metadata[0] ?? null : image.metadata,
  }));

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Spreadsheet review"
          title={`${(batch as Batch).batch_name} metadata`}
          description="Edit stock-friendly titles, factual descriptions, ordered keywords, categories, license recommendations, and warnings."
        />
        <div className="flex gap-3">
          <ButtonLink href={`/dashboard/batches/${batchId}`} variant="ghost">
            Back to batch
          </ButtonLink>
          <ButtonLink href={`/dashboard/batches/${batchId}/export`}>Export CSV</ButtonLink>
        </div>
      </div>
      <MetadataTable rows={rows} />
    </div>
  );
}
