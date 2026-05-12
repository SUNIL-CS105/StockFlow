export type BatchStatus = "draft" | "uploading" | "uploaded" | "enhanced" | "metadata_ready" | "exported";
export type ImageStatus = "pending" | "uploaded" | "enhancing" | "enhanced" | "metadata_ready" | "rejected" | "failed";
export type LicenseSuggestion = "commercial" | "editorial" | "auto";
export type ExportPlatform = "master" | "getty" | "adobe" | "shutterstock" | "alamy" | "dreamstime";

export type Batch = {
  id: string;
  user_id: string;
  batch_name: string;
  created_at: string;
  status: BatchStatus;
};

export type StockImage = {
  id: string;
  batch_id: string;
  original_filename: string;
  stored_url: string;
  enhanced_url: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  status: ImageStatus;
  created_at: string;
};

export type ImageMetadata = {
  id: string;
  image_id: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  license_type_suggestion: LicenseSuggestion;
  release_warning: string | null;
  quality_warning: string | null;
  ai_confidence_score: number | null;
  user_edited: boolean;
  created_at: string;
  updated_at: string;
};

export type ImageWithMetadata = StockImage & {
  metadata: ImageMetadata | null;
};

export type UserSettings = {
  id: string;
  user_id: string;
  default_export_platforms: ExportPlatform[];
  default_keyword_count: 30 | 50;
  default_license_preference: LicenseSuggestion;
  include_scientific_names: boolean;
  strict_quality_warnings: boolean;
  beginner_mode_explanations: boolean;
  updated_at: string;
};
