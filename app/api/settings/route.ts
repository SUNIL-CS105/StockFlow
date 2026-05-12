import { NextResponse } from "next/server";
import { z } from "zod";
import { getRouteSession, routeError } from "@/lib/api";
import { defaultSettings } from "@/lib/settings";

const settingsSchema = z.object({
  default_export_platforms: z.array(z.enum(["master", "getty", "adobe", "shutterstock", "alamy", "dreamstime"])).min(1),
  default_keyword_count: z.union([z.literal(30), z.literal(50)]),
  default_license_preference: z.enum(["commercial", "editorial", "auto"]),
  include_scientific_names: z.boolean(),
  strict_quality_warnings: z.boolean(),
  beginner_mode_explanations: z.boolean(),
});

export async function GET() {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  const { data } = await session.supabase.from("user_settings").select("*").eq("user_id", session.user.id).maybeSingle();
  return NextResponse.json({ settings: data ?? defaultSettings(session.user.id) });
}

export async function PATCH(request: Request) {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  try {
    const payload = settingsSchema.parse(await request.json());
    const { data, error } = await session.supabase
      .from("user_settings")
      .upsert(
        {
          user_id: session.user.id,
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    return routeError(error, "Unable to save settings.", 400);
  }
}
