import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getRouteSession, routeError } from "@/lib/api";

const imageSchema = z.object({
  original_filename: z.string().min(1).max(255),
  stored_url: z.string().min(1),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  file_size: z.number().int().positive().nullable().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  const { batchId } = await params;
  const ownsBatch = await verifyBatch(session.supabase, batchId, session.user.id);
  if (!ownsBatch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  const { data, error } = await session.supabase
    .from("images")
    .select("*, metadata(*)")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true });

  if (error) {
    return routeError(error, "Unable to load images.");
  }

  return NextResponse.json({ images: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  try {
    const { batchId } = await params;
    const ownsBatch = await verifyBatch(session.supabase, batchId, session.user.id);
    if (!ownsBatch) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    const payload = imageSchema.parse(await request.json());
    const { data, error } = await session.supabase
      .from("images")
      .insert({
        ...payload,
        batch_id: batchId,
        status: "uploaded",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await session.supabase.from("batches").update({ status: "uploaded" }).eq("id", batchId);
    return NextResponse.json({ image: data }, { status: 201 });
  } catch (error) {
    return routeError(error, "Unable to save image.", 400);
  }
}

async function verifyBatch(supabase: SupabaseClient, batchId: string, userId: string) {
  const { data } = await supabase.from("batches").select("id").eq("id", batchId).eq("user_id", userId).maybeSingle();
  return Boolean(data);
}
