import type { ExportPlatform, ImageMetadata, StockImage } from "./types";

export type ExportRow = StockImage & {
  metadata: ImageMetadata | null;
};

export const platformLabels: Record<ExportPlatform, string> = {
  master: "Master CSV",
  getty: "Getty CSV",
  adobe: "Adobe Stock CSV",
  shutterstock: "Shutterstock CSV",
  alamy: "Alamy CSV",
  dreamstime: "Dreamstime CSV",
};

export const platformColumns: Record<ExportPlatform, string[]> = {
  master: [
    "filename",
    "title",
    "description",
    "keywords",
    "category",
    "license_type_suggestion",
    "release_warning",
    "quality_warning",
  ],
  getty: [
    "filename",
    "title",
    "description",
    "keywords",
    "category",
    "editorial_or_commercial",
    "release_notes",
  ],
  adobe: ["filename", "title", "keywords", "category", "releases_needed"],
  shutterstock: ["filename", "description", "keywords", "categories", "editorial"],
  alamy: ["filename", "caption", "keywords", "license_type", "location_optional"],
  dreamstime: ["filename", "title", "description", "keywords", "category"],
};

export function mapRowForPlatform(row: ExportRow, platform: ExportPlatform) {
  const metadata = row.metadata;
  const keywords = metadata?.keywords.join(", ") ?? "";
  const license = metadata?.license_type_suggestion ?? "auto";
  const releaseWarning = metadata?.release_warning ?? "";

  switch (platform) {
    case "getty":
      return {
        filename: row.original_filename,
        title: metadata?.title ?? "",
        description: metadata?.description ?? "",
        keywords,
        category: metadata?.category ?? "",
        editorial_or_commercial: license,
        release_notes: releaseWarning,
      };
    case "adobe":
      return {
        filename: row.original_filename,
        title: metadata?.title ?? "",
        keywords,
        category: metadata?.category ?? "",
        releases_needed: releaseWarning ? "Yes - review notes" : "No obvious releases flagged",
      };
    case "shutterstock":
      return {
        filename: row.original_filename,
        description: metadata?.description ?? "",
        keywords,
        categories: metadata?.category ?? "",
        editorial: license === "editorial" ? "yes" : "no",
      };
    case "alamy":
      return {
        filename: row.original_filename,
        caption: metadata?.description ?? metadata?.title ?? "",
        keywords,
        license_type: license,
        location_optional: "",
      };
    case "dreamstime":
      return {
        filename: row.original_filename,
        title: metadata?.title ?? "",
        description: metadata?.description ?? "",
        keywords,
        category: metadata?.category ?? "",
      };
    case "master":
    default:
      return {
        filename: row.original_filename,
        title: metadata?.title ?? "",
        description: metadata?.description ?? "",
        keywords,
        category: metadata?.category ?? "",
        license_type_suggestion: license,
        release_warning: releaseWarning,
        quality_warning: metadata?.quality_warning ?? "",
      };
  }
}

export function getPlatformFilename(batchName: string, platform: ExportPlatform) {
  const safeBatchName = batchName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${safeBatchName || "stockflow"}-${platform}.csv`;
}
