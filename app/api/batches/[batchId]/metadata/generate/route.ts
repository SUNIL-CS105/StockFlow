import { NextResponse } from "next/server";
import { getRouteSession, routeError } from "@/lib/api";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { generateImageMetadata } from "@/lib/metadata";
import { defaultSettings } from "@/lib/settings";
import type { StockImage, UserSettings } from "@/lib/types";

export async function POST(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  try {
    const { batchId } = await params;
    const { data: batch } = await session.supabase
      .from("batches")
      .select("*")
      .eq("id", batchId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!batch) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    const { data: settingsRow } = await session.supabase.from("user_settings").select("*").eq("user_id", session.user.id).maybeSingle();
    const settings = (settingsRow as UserSettings | null) ?? defaultSettings(session.user.id);

    const { data: imageRows, error: imageError } = await session.supabase
      .from("images")
      .select("*")
      .eq("batch_id", batchId)
      .neq("status", "rejected")
      .order("created_at", { ascending: true });

    if (imageError) {
      throw imageError;
    }

    const failures: string[] = [];

    for (const image of (imageRows ?? []) as StockImage[]) {
      try {
        const bucket = image.enhanced_url ? STORAGE_BUCKETS.enhanced : STORAGE_BUCKETS.originals;
        const path = image.enhanced_url ?? image.stored_url;
        const { data: signedUrlData, error: signedUrlError } = await session.supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 10);

        if (signedUrlError || !signedUrlData?.signedUrl) {
          throw signedUrlError ?? new Error("Unable to create signed image URL.");
        }

        const generated = await generateImageMetadata({
          imageUrl: signedUrlData.signedUrl,
          filename: image.original_filename,
          keywordLimit: settings.default_keyword_count,
          strictQualityWarnings: settings.strict_quality_warnings,
          includeScientificNames: settings.include_scientific_names,
        });

        const { error: metadataError } = await session.supabase.from("metadata").upsert(
          {
            image_id: image.id,
            ...generated,
            user_edited: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "image_id" },
        );

        if (metadataError) {
          throw metadataError;
        }

        await session.supabase.from("images").update({ status: "metadata_ready" }).eq("id", image.id);
      } catch (error) {
        failures.push(`${image.original_filename}: ${error instanceof Error ? error.message : "AI metadata failure"}`);
        await session.supabase.from("images").update({ status: "failed" }).eq("id", image.id);
      }
    }

    await session.supabase.from("batches").update({ status: failures.length ? "uploaded" : "metadata_ready" }).eq("id", batchId);

    return NextResponse.json({
      message: failures.length
        ? `Metadata generated with ${failures.length} failure(s).`
        : "Metadata generated for every image.",
      failures,
    });
  } catch (error) {
    return routeError(error, "AI metadata failure.");
  }
}
