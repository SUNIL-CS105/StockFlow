import { notFound } from "next/navigation";
import { BatchWorkspace } from "@/components/batch-workspace";
import { SetupNotice } from "@/components/setup-notice";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { withSignedImageUrls } from "@/lib/storage";
import type { Batch, ImageMetadata, StockImage } from "@/lib/types";

export default async function BatchPage({ params }: { params: Promise<{ batchId: string }> }) {
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

  const signedImages = await withSignedImageUrls(
    supabase,
    ((imageRows ?? []) as (StockImage & { metadata: ImageMetadata[] | ImageMetadata | null })[]).map((image) => ({
      ...image,
      metadata: Array.isArray(image.metadata) ? image.metadata[0] ?? null : image.metadata,
    })),
  );

  return <BatchWorkspace batch={batch as Batch} images={signedImages} />;
}
