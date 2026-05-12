import { NextResponse } from "next/server";
import { getRouteSession, routeError } from "@/lib/api";
import { demoImages } from "@/lib/demo-data";

export async function POST() {
  const session = await getRouteSession();
  if ("error" in session) {
    return session.error;
  }

  try {
    const { data: batch, error: batchError } = await session.supabase
      .from("batches")
      .insert({
        user_id: session.user.id,
        batch_name: "Practice demo batch",
        status: "metadata_ready",
      })
      .select("*")
      .single();

    if (batchError) {
      throw batchError;
    }

    for (const demoImage of demoImages) {
      const { data: image, error: imageError } = await session.supabase
        .from("images")
        .insert({
          batch_id: batch.id,
          original_filename: demoImage.filename,
          stored_url: demoImage.url,
          enhanced_url: demoImage.url,
          width: demoImage.width,
          height: demoImage.height,
          file_size: demoImage.fileSize,
          status: "metadata_ready",
        })
        .select("*")
        .single();

      if (imageError) {
        throw imageError;
      }

      const { error: metadataError } = await session.supabase.from("metadata").insert({
        image_id: image.id,
        ...demoImage.metadata,
      });

      if (metadataError) {
        throw metadataError;
      }
    }

    return NextResponse.json({ batch }, { status: 201 });
  } catch (error) {
    return routeError(error, "Unable to create demo batch.", 400);
  }
}
