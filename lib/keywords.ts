export function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase().replace(/\s+/g, " ");
}

export function cleanKeywords(keywords: string[], limit = 50) {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const keyword of keywords) {
    const normalized = normalizeKeyword(keyword);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    cleaned.push(normalized);
    if (cleaned.length === limit) {
      break;
    }
  }

  return cleaned;
}

export function parseKeywords(value: string | string[]) {
  if (Array.isArray(value)) {
    return cleanKeywords(value);
  }

  return cleanKeywords(value.split(","));
}
