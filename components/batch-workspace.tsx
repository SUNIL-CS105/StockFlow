"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Sparkles, XCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button, ButtonLink } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import type { Batch, ImageMetadata, StockImage } from "@/lib/types";

type WorkspaceImage = StockImage & {
  signedOriginalUrl: string | null;
  signedEnhancedUrl: string | null;
  metadata: ImageMetadata | null;
};

export function BatchWorkspace({ batch, images }: { batch: Batch; images: WorkspaceImage[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"enhance" | "metadata" | null>(null);

  const metadataReady = images.filter((image) => image.metadata).length;
  const progress = images.length ? Math.round((metadataReady / images.length) * 100) : 0;

  async function runAction(action: "enhance" | "metadata") {
    setBusyAction(action);
    setError(null);
    setMessage(null);

    try {
      const endpoint =
        action === "enhance" ? `/api/batches/${batch.id}/enhance` : `/api/batches/${batch.id}/metadata/generate`;
      const response = await fetch(endpoint, { method: "POST" });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Batch action failed.");
      }

      setMessage(payload.message ?? "Batch updated.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Batch action failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function rejectImage(imageId: string) {
    setError(null);
    const response = await fetch(`/api/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });

    if (!response.ok) {
      setError("Could not remove weak image from batch.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <Badge tone="blue">{batch.status.replace("_", " ")}</Badge>
            <h1 className="mt-4 text-3xl font-bold text-slate-950">{batch.batch_name}</h1>
            <p className="mt-2 text-slate-600">Review warnings before submitting to stock platforms.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => runAction("enhance")} disabled={busyAction !== null || images.length === 0}>
              <Sparkles size={16} />
              {busyAction === "enhance" ? "Enhancing..." : "Auto Enhance All"}
            </Button>
            <Button type="button" onClick={() => runAction("metadata")} disabled={busyAction !== null || images.length === 0}>
              <FileSpreadsheet size={16} />
              {busyAction === "metadata" ? "Generating..." : "Generate Metadata"}
            </Button>
            <ButtonLink href={`/dashboard/batches/${batch.id}/metadata`} variant="ghost">
              Review Metadata
            </ButtonLink>
            <ButtonLink href={`/dashboard/batches/${batch.id}/export`} variant="ghost">
              <Download size={16} />
              Export CSV
            </ButtonLink>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm text-slate-600">
            <span>Metadata progress</span>
            <span>
              {metadataReady}/{images.length}
            </span>
          </div>
          <Progress value={progress} />
        </div>
        {message ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      </Card>

      {images.length === 0 ? (
        <Card className="text-center">
          <p className="text-xl font-bold text-slate-950">No images in this batch yet.</p>
          <p className="mt-2 text-slate-600">Upload images to see thumbnails, dimensions, and status.</p>
          <ButtonLink href="/dashboard/batches/new" className="mt-6">
            Upload Images
          </ButtonLink>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <Card key={image.id} className={image.status === "rejected" ? "opacity-60" : ""}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                {image.signedEnhancedUrl || image.signedOriginalUrl ? (
                  <Image
                    src={image.signedEnhancedUrl ?? image.signedOriginalUrl ?? ""}
                    alt={image.original_filename}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">Preview unavailable</div>
                )}
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-950">{image.original_filename}</p>
                    <p className="text-sm text-slate-500">
                      {image.width ?? "?"}x{image.height ?? "?"} - {image.file_size ? `${Math.round(image.file_size / 1024)} KB` : "size unknown"}
                    </p>
                  </div>
                  <Badge tone={image.status === "metadata_ready" ? "green" : image.status === "failed" ? "red" : "slate"}>
                    {image.status.replace("_", " ")}
                  </Badge>
                </div>

                {image.metadata ? (
                  <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-800">{image.metadata.title}</p>
                    {image.metadata.release_warning ? (
                      <p className="mt-2 flex gap-2 text-amber-700">
                        <AlertTriangle size={16} /> {image.metadata.release_warning}
                      </p>
                    ) : null}
                    {image.metadata.quality_warning ? (
                      <p className="mt-2 flex gap-2 text-rose-700">
                        <AlertTriangle size={16} /> {image.metadata.quality_warning}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-blue-50 p-3 text-sm text-blue-700">No metadata generated yet.</p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="rounded-xl bg-white p-2 ring-1 ring-slate-100">
                    <CheckCircle2 size={14} className="mb-1 text-emerald-500" />
                    Original preserved
                  </div>
                  <div className="rounded-xl bg-white p-2 ring-1 ring-slate-100">
                    <Sparkles size={14} className="mb-1 text-blue-500" />
                    {image.enhanced_url ? "Enhanced version ready" : "Enhanced version pending"}
                  </div>
                </div>

                <Button type="button" variant="danger" className="w-full" onClick={() => rejectImage(image.id)}>
                  <XCircle size={16} />
                  Reject/remove weak image
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
