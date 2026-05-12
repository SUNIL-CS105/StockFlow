import type { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKETS } from "./constants";
import type { StockImage } from "./types";

export async function withSignedImageUrls<T extends StockImage>(supabase: SupabaseClient, images: T[]) {
  return Promise.all(
    images.map(async (image) => {
      const original = await supabase.storage.from(STORAGE_BUCKETS.originals).createSignedUrl(image.stored_url, 60 * 60);
      const enhanced = image.enhanced_url
        ? await supabase.storage.from(STORAGE_BUCKETS.enhanced).createSignedUrl(image.enhanced_url, 60 * 60)
        : null;

      return {
        ...image,
        signedOriginalUrl: original.data?.signedUrl ?? null,
        signedEnhancedUrl: enhanced?.data?.signedUrl ?? null,
      };
    }),
  );
}
