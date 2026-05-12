import JSZip from "jszip";
import { NextResponse } from "next/server";
import { getRouteSession, routeError } from "@/lib/api";
import { buildCsv } from "@/lib/csv";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { getPlatformFilename } from "@/lib/platforms";
import type { Batch, ExportPlatform, ImageMetadata, StockImage } from "@/lib/types";

const platforms: ExportPlatform[] = ["master", "getty", "adobe", "shutterstock", "alamy", "dreamstime"];

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  try {
    const { batchId } = await params;
    const { batch, rows } = await getEverythingRows(session.supabase, batchId, session.user.id);
    const zip = new JSZip();

    platforms.forEach((platform) => {
      zip.file(`csv/${getPlatformFilename(batch.batch_name, platform)}`, buildCsv(rows, platform));
    });

    zip.file("metadata/stockflow-backup.json", JSON.stringify({ batch, images: rows }, null, 2));

    for (const image of rows) {
      const bucket = image.enhanced_url ? STORAGE_BUCKETS.enhanced : STORAGE_BUCKETS.originals;
      const path = image.enhanced_url ?? image.stored_url;
      const { data: signedUrlData } = await session.supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);

      if (!signedUrlData?.signedUrl) {
        continue;
      }

      const response = await fetch(signedUrlData.signedUrl);
      if (!response.ok) {
        continue;
      }

      const folder = image.enhanced_url ? "enhanced-images" : "original-images";
      zip.file(`${folder}/${image.original_filename.replace(/\.[^.]+$/, "")}.jpg`, await response.arrayBuffer());
    }

    const archive = await zip.generateAsync({ type: "uint8array" });
    return new NextResponse(archive, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${batch.batch_name.replace(/[^a-z0-9]+/gi, "-")}-stockflow.zip"`,
      },
    });
  } catch (error) {
    return routeError(error, "Download everything failed.", 400);
  }
}

async function getEverythingRows(supabase: any, batchId: string, userId: string) {
  const { data: batch } = await supabase.from("batches").select("*").eq("id", batchId).eq("user_id", userId).maybeSingle();
  if (!batch) {
    throw new Error("Batch not found.");
  }

  const { data: images, error } = await supabase
    .from("images")
    .select("*, metadata(*)")
    .eq("batch_id", batchId)
    .neq("status", "rejected")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = ((images ?? []) as (StockImage & { metadata: ImageMetadata[] | ImageMetadata | null })[]).map((image) => ({
    ...image,
    metadata: Array.isArray(image.metadata) ? image.metadata[0] ?? null : image.metadata,
  }));

  return { batch: batch as Batch, rows };
}
