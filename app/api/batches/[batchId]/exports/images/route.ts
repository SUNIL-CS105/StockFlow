import JSZip from "jszip";
import { NextResponse } from "next/server";
import { getRouteSession, routeError } from "@/lib/api";
import { STORAGE_BUCKETS } from "@/lib/constants";
import type { Batch, StockImage } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  try {
    const { batchId } = await params;
    const { batch, images } = await getImages(session.supabase, batchId, session.user.id);
    const zip = new JSZip();

    for (const image of images) {
      const bucket = image.enhanced_url ? STORAGE_BUCKETS.enhanced : STORAGE_BUCKETS.originals;
      const path = image.enhanced_url ?? image.stored_url;
      const { data: signedUrlData, error } = await session.supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);
      if (error || !signedUrlData?.signedUrl) {
        continue;
      }

      const response = await fetch(signedUrlData.signedUrl);
      if (!response.ok) {
        continue;
      }

      const suffix = image.enhanced_url ? "enhanced" : "original";
      zip.file(`${suffix}/${image.original_filename.replace(/\.[^.]+$/, "")}-${suffix}.jpg`, await response.arrayBuffer());
    }

    const archive = await zip.generateAsync({ type: "uint8array" });
    return new NextResponse(archive, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${batch.batch_name.replace(/[^a-z0-9]+/gi, "-")}-images.zip"`,
      },
    });
  } catch (error) {
    return routeError(error, "ZIP download failed.", 400);
  }
}

async function getImages(supabase: any, batchId: string, userId: string) {
  const { data: batch } = await supabase.from("batches").select("*").eq("id", batchId).eq("user_id", userId).maybeSingle();
  if (!batch) {
    throw new Error("Batch not found.");
  }

  const { data, error } = await supabase
    .from("images")
    .select("*")
    .eq("batch_id", batchId)
    .neq("status", "rejected")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return { batch: batch as Batch, images: (data ?? []) as StockImage[] };
}
