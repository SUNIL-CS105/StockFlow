import { NextResponse } from "next/server";
import { getRouteSession, routeError } from "@/lib/api";
import { enhancedFilename, lightlyEnhanceImage } from "@/lib/image-processing";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKETS } from "@/lib/constants";
import type { StockImage } from "@/lib/types";

export async function POST(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  if (!isServiceRoleConfigured) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for server-side image enhancement." },
      { status: 503 },
    );
  }

  try {
    const { batchId } = await params;
    const { data: batch } = await session.supabase
      .from("batches")
      .select("id")
      .eq("id", batchId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!batch) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    const { data: images, error: imageError } = await session.supabase
      .from("images")
      .select("*")
      .eq("batch_id", batchId)
      .neq("status", "rejected");

    if (imageError) {
      throw imageError;
    }

    const admin = createSupabaseAdminClient();
    const failures: string[] = [];

    for (const image of (images ?? []) as StockImage[]) {
      try {
        await session.supabase.from("images").update({ status: "enhancing" }).eq("id", image.id);

        const originalBlob = image.stored_url.startsWith("http")
          ? await fetch(image.stored_url).then((response) => (response.ok ? response.blob() : null))
          : (
              await admin.storage
                .from(STORAGE_BUCKETS.originals)
                .download(image.stored_url)
            ).data;
        const downloadError = originalBlob ? null : new Error("Unable to download original image.");

        if (downloadError) {
          throw downloadError;
        }

        const enhancedBuffer = await lightlyEnhanceImage(await originalBlob.arrayBuffer());
        const enhancedPath = `${session.user.id}/${batchId}/enhanced/${image.id}-${enhancedFilename(image.original_filename)}`;
        const { error: uploadError } = await admin.storage
          .from(STORAGE_BUCKETS.enhanced)
          .upload(enhancedPath, enhancedBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        await session.supabase
          .from("images")
          .update({
            enhanced_url: enhancedPath,
            status: "enhanced",
          })
          .eq("id", image.id);
      } catch (error) {
        failures.push(`${image.original_filename}: ${error instanceof Error ? error.message : "Enhancement failed"}`);
        await session.supabase.from("images").update({ status: "failed" }).eq("id", image.id);
      }
    }

    await session.supabase.from("batches").update({ status: failures.length ? "uploaded" : "enhanced" }).eq("id", batchId);

    return NextResponse.json({
      message: failures.length ? `Enhancement finished with ${failures.length} failure(s).` : "All images enhanced lightly.",
      failures,
    });
  } catch (error) {
    return routeError(error, "Image enhancement failed.");
  }
}
