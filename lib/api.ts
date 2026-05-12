import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "./supabase/config";
import { createSupabaseServerClient } from "./supabase/server";

export async function getRouteSession() {
  if (!isSupabaseConfigured) {
    return { error: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  return { supabase, user };
}

export function routeError(error: unknown, fallback: string, status = 500) {
  return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status });
}
