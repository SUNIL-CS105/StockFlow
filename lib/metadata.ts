import OpenAI from "openai";
import { z } from "zod";
import { cleanKeywords } from "./keywords";
import type { LicenseSuggestion } from "./types";

const metadataSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  keywords: z.array(z.string()).min(10).max(60),
  category: z.string().min(1),
  license_type_suggestion: z.enum(["commercial", "editorial", "auto"]),
  release_warning: z.string().nullable(),
  quality_warning: z.string().nullable(),
  ai_confidence_score: z.number().min(0).max(1),
});

export type GeneratedMetadata = z.infer<typeof metadataSchema> & {
  license_type_suggestion: LicenseSuggestion;
};

export async function generateImageMetadata({
  imageUrl,
  filename,
  keywordLimit,
  strictQualityWarnings,
  includeScientificNames,
}: {
  imageUrl: string;
  filename: string;
  keywordLimit: 30 | 50;
  strictQualityWarnings: boolean;
  includeScientificNames: boolean;
}): Promise<GeneratedMetadata> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackMetadata(filename, keywordLimit);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini";

  const response = await openai.responses.create({
    model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              "Generate stock photo contributor metadata as strict JSON.",
              "Rules: descriptive stock-friendly title; factual simple description; exactly the requested number of relevant comma-safe keywords ordered by relevance; avoid copyrighted brand names unless editorial.",
              "Flag releases when recognizable people, hands, logos, private property, artwork, pets, or events appear.",
              "Flag quality issues if blurry, underexposed, overexposed, noisy, duplicate-looking, or weak composition.",
              "Suggest commercial for clean nature, flower, landscape, object, or generic scenes without people/logos/property risks.",
              "Suggest editorial for public events, unreleased people, logos, newsworthy scenes, or risky commercial licensing.",
              `Keyword count: ${keywordLimit}.`,
              `Strict quality warnings: ${strictQualityWarnings}.`,
              `Include scientific plant/animal names when possible: ${includeScientificNames}.`,
              "Return keys: title, description, keywords, category, license_type_suggestion, release_warning, quality_warning, ai_confidence_score.",
            ].join(" "),
          },
          {
            type: "input_image",
            image_url: imageUrl,
            detail: "high",
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "stockflow_metadata",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            category: { type: "string" },
            license_type_suggestion: { type: "string", enum: ["commercial", "editorial", "auto"] },
            release_warning: { type: ["string", "null"] },
            quality_warning: { type: ["string", "null"] },
            ai_confidence_score: { type: "number" },
          },
          required: [
            "title",
            "description",
            "keywords",
            "category",
            "license_type_suggestion",
            "release_warning",
            "quality_warning",
            "ai_confidence_score",
          ],
        },
      },
    },
  });

  const parsed = metadataSchema.parse(JSON.parse(response.output_text));
  return {
    ...parsed,
    keywords: cleanKeywords(parsed.keywords, keywordLimit),
  };
}

function fallbackMetadata(filename: string, keywordLimit: 30 | 50): GeneratedMetadata {
  const baseName = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "stock photo";
  const title = titleCase(baseName).slice(0, 120);
  const baseKeywords = [
    ...baseName.split(/\s+/),
    "stock photo",
    "image",
    "copy space",
    "natural",
    "simple",
    "background",
    "detail",
    "outdoor",
    "travel",
    "lifestyle",
    "commercial",
    "horizontal",
    "vertical",
    "color",
    "daylight",
    "texture",
    "scene",
    "fresh",
    "clean",
    "creative",
    "visual",
    "photo",
    "photography",
    "generic",
    "subject",
    "close up",
    "environment",
    "design",
    "marketing",
    "publication",
    "editorial review",
  ];

  return {
    title,
    description: `Factual stock photo showing ${baseName}. Review visual details before submitting to a stock marketplace.`,
    keywords: cleanKeywords(baseKeywords, keywordLimit),
    category: "Other",
    license_type_suggestion: "auto",
    release_warning: "OpenAI key is not configured, so release risks were not visually verified.",
    quality_warning: "OpenAI key is not configured, so quality risks were not visually verified.",
    ai_confidence_score: 0.25,
  };
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
