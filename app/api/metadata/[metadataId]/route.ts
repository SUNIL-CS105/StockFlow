import { NextResponse } from "next/server";
import { z } from "zod";
import { getRouteSession, routeError } from "@/lib/api";
import { cleanKeywords } from "@/lib/keywords";

const updateMetadataSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  keywords: z.array(z.string()).min(1).max(60),
  category: z.string().trim().min(1),
  license_type_suggestion: z.enum(["commercial", "editorial", "auto"]),
  release_warning: z.string().nullable().optional(),
  quality_warning: z.string().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ metadataId: string }> }) {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  try {
    const { metadataId } = await params;
    const payload = updateMetadataSchema.parse(await request.json());

    const { data: existing } = await session.supabase
      .from("metadata")
      .select("id, images!inner(batches!inner(user_id))")
      .eq("id", metadataId)
      .eq("images.batches.user_id", session.user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Metadata not found." }, { status: 404 });
    }

    const { data, error } = await session.supabase
      .from("metadata")
      .update({
        ...payload,
        keywords: cleanKeywords(payload.keywords, 50),
        user_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", metadataId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ metadata: data });
  } catch (error) {
    return routeError(error, "Unable to update metadata.", 400);
  }
}
