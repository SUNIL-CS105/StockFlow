import { NextResponse } from "next/server";
import { z } from "zod";
import { getRouteSession, routeError } from "@/lib/api";

const createBatchSchema = z.object({
  batch_name: z.string().trim().min(1).max(120),
});

export async function GET() {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  const { data, error } = await session.supabase
    .from("batches")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return routeError(error, "Unable to load batches.");
  }

  return NextResponse.json({ batches: data });
}

export async function POST(request: Request) {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  try {
    const payload = createBatchSchema.parse(await request.json());
    const { data, error } = await session.supabase
      .from("batches")
      .insert({
        user_id: session.user.id,
        batch_name: payload.batch_name,
        status: "uploading",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ batch: data }, { status: 201 });
  } catch (error) {
    return routeError(error, "Unable to create batch.", 400);
  }
}
