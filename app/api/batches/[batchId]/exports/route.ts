import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCsv } from "@/lib/csv";
import { getRouteSession, routeError } from "@/lib/api";
import { getPlatformFilename } from "@/lib/platforms";
import type { Batch, ExportPlatform, ImageMetadata, StockImage } from "@/lib/types";

const platformSchema = z.enum(["master", "getty", "adobe", "shutterstock", "alamy", "dreamstime"]);

export async function GET(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  try {
    const { batchId } = await params;
    const url = new URL(request.url);
    const platform = platformSchema.parse(url.searchParams.get("platform") ?? "master") as ExportPlatform;
    const format = url.searchParams.get("format");

    const { batch, rows } = await getExportRows(session.supabase, batchId, session.user.id);

    if (format === "json") {
      return new NextResponse(JSON.stringify({ batch, images: rows }, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${batch.batch_name.replace(/[^a-z0-9]+/gi, "-")}-metadata.json"`,
        },
      });
    }

    const csv = buildCsv(rows, platform);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${getPlatformFilename(batch.batch_name, platform)}"`,
      },
    });
  } catch (error) {
    return routeError(error, "CSV export failure.", 400);
  }
}

async function getExportRows(supabase: any, batchId: string, userId: string) {
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
