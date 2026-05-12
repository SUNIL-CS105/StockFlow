export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const STORAGE_BUCKETS = {
  originals: "stockflow-originals",
  enhanced: "stockflow-enhanced",
} as const;

export const DEFAULT_KEYWORD_COUNT = 50;

export const CATEGORY_OPTIONS = [
  "Animals",
  "Architecture",
  "Business",
  "Food",
  "Lifestyle",
  "Nature",
  "People",
  "Science",
  "Sports",
  "Technology",
  "Travel",
  "Other",
] as const;
