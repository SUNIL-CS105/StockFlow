import { NextResponse } from "next/server";
import { z } from "zod";
import { getRouteSession, routeError } from "@/lib/api";

const updateImageSchema = z.object({
  status: z.enum(["pending", "uploaded", "enhancing", "enhanced", "metadata_ready", "rejected", "failed"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ imageId: string }> }) {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  try {
    const { imageId } = await params;
    const payload = updateImageSchema.parse(await request.json());

    const { data: image } = await session.supabase
      .from("images")
      .select("id, batches!inner(user_id)")
      .eq("id", imageId)
      .eq("batches.user_id", session.user.id)
      .maybeSingle();

    if (!image) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    const { data, error } = await session.supabase.from("images").update(payload).eq("id", imageId).select("*").single();
    if (error) {
      throw error;
    }

    return NextResponse.json({ image: data });
  } catch (error) {
    return routeError(error, "Unable to update image.", 400);
  }
}
