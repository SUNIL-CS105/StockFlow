import type { UserSettings } from "./types";

export function defaultSettings(userId: string): UserSettings {
  return {
    id: "new",
    user_id: userId,
    default_export_platforms: ["master", "adobe", "shutterstock"],
    default_keyword_count: 50,
    default_license_preference: "auto",
    include_scientific_names: true,
    strict_quality_warnings: true,
    beginner_mode_explanations: true,
    updated_at: new Date().toISOString(),
  };
}
