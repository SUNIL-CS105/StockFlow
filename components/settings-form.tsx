"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import type { ExportPlatform, LicenseSuggestion, UserSettings } from "@/lib/types";

const platformOptions: Exclude<ExportPlatform, "master">[] = ["getty", "adobe", "shutterstock", "alamy", "dreamstime"];

export function SettingsForm({ settings }: { settings: UserSettings }) {
  const [draft, setDraft] = useState(settings);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setMessage(null);
    setError(null);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      setError("Unable to save settings.");
      return;
    }

    setMessage("Settings saved.");
  }

  function togglePlatform(platform: ExportPlatform) {
    setDraft((current) => {
      const exists = current.default_export_platforms.includes(platform);
      return {
        ...current,
        default_export_platforms: exists
          ? current.default_export_platforms.filter((item) => item !== platform)
          : [...current.default_export_platforms, platform],
      };
    });
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-slate-950">Default export platforms</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {platformOptions.map((platform) => (
            <label key={platform} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 font-semibold capitalize text-slate-700">
              <input
                type="checkbox"
                checked={draft.default_export_platforms.includes(platform)}
                onChange={() => togglePlatform(platform)}
                className="h-4 w-4"
              />
              {platform}
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="font-semibold text-slate-700">
          Default keyword count
          <select
            value={draft.default_keyword_count}
            onChange={(event) => setDraft((current) => ({ ...current, default_keyword_count: Number(event.target.value) as 30 | 50 }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 p-3"
          >
            <option value={30}>30 keywords</option>
            <option value={50}>50 keywords</option>
          </select>
        </label>
        <label className="font-semibold text-slate-700">
          Default license preference
          <select
            value={draft.default_license_preference}
            onChange={(event) => setDraft((current) => ({ ...current, default_license_preference: event.target.value as LicenseSuggestion }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 p-3"
          >
            <option value="commercial">Commercial</option>
            <option value="editorial">Editorial</option>
            <option value="auto">Auto</option>
          </select>
        </label>
      </section>

      <section className="grid gap-3">
        {[
          ["include_scientific_names", "Include scientific plant/animal names when possible"],
          ["strict_quality_warnings", "Strict quality warnings"],
          ["beginner_mode_explanations", "Beginner mode explanations"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 font-semibold text-slate-700">
            {label}
            <input
              type="checkbox"
              checked={Boolean(draft[key as keyof UserSettings])}
              onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.checked }))}
              className="h-5 w-5"
            />
          </label>
        ))}
      </section>

      {message ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <Button type="button" onClick={save}>
        Save settings
      </Button>
    </div>
  );
}
