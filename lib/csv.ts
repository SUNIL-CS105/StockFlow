import type { ExportPlatform } from "./types";
import { mapRowForPlatform, platformColumns, type ExportRow } from "./platforms";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(rows: ExportRow[], platform: ExportPlatform) {
  const columns = platformColumns[platform];
  const header = columns.map(escapeCsv).join(",");
  const body = rows.map((row) => {
    const mapped = mapRowForPlatform(row, platform) as Record<string, unknown>;
    return columns.map((column) => escapeCsv(mapped[column])).join(",");
  });

  return [header, ...body].join("\n");
}
