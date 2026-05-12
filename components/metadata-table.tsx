"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Save, Sparkles, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { HelpTip } from "./ui/help-tip";
import { cleanKeywords, parseKeywords } from "@/lib/keywords";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import type { ImageMetadata, LicenseSuggestion, StockImage } from "@/lib/types";

type Row = StockImage & {
  metadata: ImageMetadata | null;
};

type MetadataDraft = {
  title: string;
  description: string;
  keywords: string;
  category: string;
  license_type_suggestion: LicenseSuggestion;
  release_warning: string;
  quality_warning: string;
};

export function MetadataTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState(
    () =>
      new Map(
        rows
          .filter((row) => row.metadata)
          .map((row) => [
            row.metadata?.id ?? "",
            {
              title: row.metadata?.title ?? "",
              description: row.metadata?.description ?? "",
              keywords: row.metadata?.keywords.join(", ") ?? "",
              category: row.metadata?.category ?? "Other",
              license_type_suggestion: row.metadata?.license_type_suggestion ?? "auto",
              release_warning: row.metadata?.release_warning ?? "",
              quality_warning: row.metadata?.quality_warning ?? "",
            },
          ]),
      ),
  );
  const [bulkKeyword, setBulkKeyword] = useState("");
  const [replaceFrom, setReplaceFrom] = useState("");
  const [replaceTo, setReplaceTo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateDraft<K extends keyof MetadataDraft>(metadataId: string, field: K, value: MetadataDraft[K]) {
    setDrafts((current) => {
      const next = new Map(current);
      const draft = next.get(metadataId);
      if (!draft) {
        return next;
      }
      next.set(metadataId, { ...draft, [field]: value });
      return next;
    });
  }

  function applyBulkKeyword() {
    const keyword = bulkKeyword.trim();
    if (!keyword) {
      return;
    }

    setDrafts((current) => {
      const next = new Map(current);
      next.forEach((draft, id) => {
        const keywords = cleanKeywords([...parseKeywords(draft.keywords), keyword], 50);
        next.set(id, { ...draft, keywords: keywords.join(", ") });
      });
      return next;
    });
    setBulkKeyword("");
  }

  function replaceKeyword() {
    if (!replaceFrom.trim()) {
      return;
    }

    setDrafts((current) => {
      const next = new Map(current);
      next.forEach((draft, id) => {
        const keywords = parseKeywords(draft.keywords).map((keyword) =>
          keyword === replaceFrom.trim().toLowerCase() ? replaceTo.trim().toLowerCase() : keyword,
        );
        next.set(id, { ...draft, keywords: cleanKeywords(keywords, 50).join(", ") });
      });
      return next;
    });
  }

  function cleanAllKeywords() {
    setDrafts((current) => {
      const next = new Map(current);
      next.forEach((draft, id) => {
        next.set(id, { ...draft, keywords: cleanKeywords(parseKeywords(draft.keywords), 50).join(", ") });
      });
      return next;
    });
  }

  async function saveAll() {
    setMessage(null);
    setError(null);

    try {
      await Promise.all(
        Array.from(drafts.entries()).map(async ([metadataId, draft]) => {
          const response = await fetch(`/api/metadata/${metadataId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...draft,
              keywords: parseKeywords(draft.keywords),
              release_warning: draft.release_warning || null,
              quality_warning: draft.quality_warning || null,
            }),
          });

          if (!response.ok) {
            throw new Error("Unable to save one or more metadata rows.");
          }
        }),
      );

      setMessage("Metadata saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed.");
    }
  }

  async function updateImageStatus(imageId: string, status: string) {
    const response = await fetch(`/api/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setError("Unable to update image status.");
      return;
    }

    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-xl font-bold text-slate-950">No metadata generated yet.</p>
        <p className="mt-2 text-slate-600">Generate metadata from the batch review page to start editing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Simple editing tools</h2>
        <p className="mt-2 text-sm text-slate-600">
          Use these if you want to add or replace a keyword across every photo at once.
          <HelpTip label="Keyword relevance explanation">
            Relevant keywords are words a buyer would actually search for. Put the clearest subject words first, such
            as flower, garden, laptop, student, or city.
          </HelpTip>
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
        <input
          value={bulkKeyword}
          onChange={(event) => setBulkKeyword(event.target.value)}
          placeholder="Add one keyword to all photos"
          className="rounded-2xl border border-slate-200 px-4 py-2 outline-none focus:ring-4 focus:ring-blue-100"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={replaceFrom}
            onChange={(event) => setReplaceFrom(event.target.value)}
            placeholder="Find keyword"
            className="rounded-2xl border border-slate-200 px-4 py-2 outline-none focus:ring-4 focus:ring-blue-100"
          />
          <input
            value={replaceTo}
            onChange={(event) => setReplaceTo(event.target.value)}
            placeholder="New keyword"
            className="rounded-2xl border border-slate-200 px-4 py-2 outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>
        <Button type="button" variant="secondary" onClick={applyBulkKeyword}>
          Add to all
        </Button>
        <Button type="button" variant="ghost" onClick={replaceKeyword}>
          Replace
        </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="ghost" onClick={cleanAllKeywords}>
          <Sparkles size={16} />
          Clean keyword list
        </Button>
        <Button type="button" onClick={saveAll}>
          <Save size={16} />
          Save changes
        </Button>
      </div>

      {message ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="sheet-scrollbar overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="min-w-[1400px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-4">File</th>
              <th className="p-4">Title</th>
              <th className="p-4">Description</th>
              <th className="p-4">
                Keywords
                <HelpTip label="Keyword relevance explanation">
                  The first 10 keywords matter most. Start with the visible subject, setting, and use case. Avoid random
                  or unrelated words.
                </HelpTip>
              </th>
              <th className="p-4">Category</th>
              <th className="p-4">
                Commercial/editorial
                <HelpTip label="Commercial versus editorial explanation">
                  Choose commercial for safe photos without people, logos, private property, or events. Choose editorial
                  when the image is better for news, education, travel, or documentary use.
                </HelpTip>
              </th>
              <th className="p-4">
                Release warning
                <HelpTip label="Model and property release explanation">
                  A model release is permission from a recognizable person. A property release is permission for private
                  property, artwork, pets, or distinctive branded items.
                </HelpTip>
              </th>
              <th className="p-4">Quality warning</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const metadata = row.metadata;
              const draft = metadata ? drafts.get(metadata.id) : null;
              return (
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  <td className="p-4">
                    <p className="font-semibold text-slate-900">{row.original_filename}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.width ?? "?"}x{row.height ?? "?"}
                    </p>
                    <Badge tone={row.status === "rejected" ? "red" : "slate"}>{row.status.replace("_", " ")}</Badge>
                  </td>
                  {!metadata || !draft ? (
                    <td colSpan={7} className="p-4 text-slate-500">
                      No metadata generated yet.
                    </td>
                  ) : (
                    <>
                      <td className="p-4">
                        <textarea value={draft.title} onChange={(event) => updateDraft(metadata.id, "title", event.target.value)} className="h-28 w-52 rounded-xl border border-slate-200 p-3" />
                      </td>
                      <td className="p-4">
                        <textarea value={draft.description} onChange={(event) => updateDraft(metadata.id, "description", event.target.value)} className="h-28 w-72 rounded-xl border border-slate-200 p-3" />
                      </td>
                      <td className="p-4">
                        <textarea value={draft.keywords} onChange={(event) => updateDraft(metadata.id, "keywords", event.target.value)} className="h-28 w-80 rounded-xl border border-slate-200 p-3" />
                        <p className="mt-1 text-xs text-slate-500">{parseKeywords(draft.keywords).length}/50 keywords</p>
                      </td>
                      <td className="p-4">
                        <select value={draft.category} onChange={(event) => updateDraft(metadata.id, "category", event.target.value)} className="rounded-xl border border-slate-200 p-3">
                          {CATEGORY_OPTIONS.map((category) => (
                            <option key={category}>{category}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select value={draft.license_type_suggestion} onChange={(event) => updateDraft(metadata.id, "license_type_suggestion", event.target.value as LicenseSuggestion)} className="rounded-xl border border-slate-200 p-3">
                          <option value="commercial">Commercial</option>
                          <option value="editorial">Editorial</option>
                          <option value="auto">Auto</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <textarea value={draft.release_warning} onChange={(event) => updateDraft(metadata.id, "release_warning", event.target.value)} className="h-28 w-64 rounded-xl border border-slate-200 p-3" />
                      </td>
                      <td className="p-4">
                        <textarea value={draft.quality_warning} onChange={(event) => updateDraft(metadata.id, "quality_warning", event.target.value)} className="h-28 w-64 rounded-xl border border-slate-200 p-3" />
                      </td>
                    </>
                  )}
                  <td className="space-y-2 p-4">
                    {metadata?.release_warning || metadata?.quality_warning ? (
                      <p className="flex gap-2 text-xs text-amber-700">
                        <AlertTriangle size={14} /> Review warnings
                      </p>
                    ) : (
                      <p className="flex gap-2 text-xs text-emerald-700">
                        <CheckCircle2 size={14} /> No warnings
                      </p>
                    )}
                    <Button type="button" variant="danger" onClick={() => updateImageStatus(row.id, "rejected")}>
                      <XCircle size={16} />
                      Reject
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
