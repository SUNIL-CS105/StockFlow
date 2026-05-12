"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, UploadCloud, X } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES, STORAGE_BUCKETS } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type UploadItem = {
  id: string;
  file: File;
  status: "ready" | "uploading" | "uploaded" | "failed";
  error?: string;
  width?: number;
  height?: number;
};

export function UploadDropzone() {
  const router = useRouter();
  const [batchName, setBatchName] = useState("");
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const progress = useMemo(() => {
    if (items.length === 0) {
      return 0;
    }
    return Math.round((items.filter((item) => item.status === "uploaded").length / items.length) * 100);
  }, [items]);

  function addFiles(files: FileList | File[]) {
    setError(null);
    const nextItems: UploadItem[] = [];

    Array.from(files).forEach((file) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        nextItems.push({ id: crypto.randomUUID(), file, status: "failed", error: "Unsupported file type" });
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        nextItems.push({ id: crypto.randomUUID(), file, status: "failed", error: "File too large (25MB max)" });
        return;
      }

      nextItems.push({ id: crypto.randomUUID(), file, status: "ready" });
    });

    setItems((current) => [...current, ...nextItems]);
  }

  async function startUpload() {
    setBusy(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Please sign in before uploading images.");
      }

      const batchResponse = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_name: batchName || "Untitled stock batch" }),
      });

      if (!batchResponse.ok) {
        throw new Error("Unable to create batch.");
      }

      const { batch } = (await batchResponse.json()) as { batch: { id: string } };

      for (const item of items) {
        if (item.status === "failed") {
          continue;
        }

        setItems((current) =>
          current.map((currentItem) => (currentItem.id === item.id ? { ...currentItem, status: "uploading" } : currentItem)),
        );

        try {
          const dimensions = await getImageDimensions(item.file);
          const safeFilename = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
          const storagePath = `${user.id}/${batch.id}/originals/${crypto.randomUUID()}-${safeFilename}`;
          const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKETS.originals)
            .upload(storagePath, item.file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            throw uploadError;
          }

          const imageResponse = await fetch(`/api/batches/${batch.id}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              original_filename: item.file.name,
              stored_url: storagePath,
              width: dimensions.width,
              height: dimensions.height,
              file_size: item.file.size,
            }),
          });

          if (!imageResponse.ok) {
            throw new Error("Upload saved, but database insert failed.");
          }

          setItems((current) =>
            current.map((currentItem) =>
              currentItem.id === item.id
                ? { ...currentItem, status: "uploaded", width: dimensions.width, height: dimensions.height }
                : currentItem,
            ),
          );
        } catch (caught) {
          setItems((current) =>
            current.map((currentItem) =>
              currentItem.id === item.id
                ? { ...currentItem, status: "failed", error: caught instanceof Error ? caught.message : "Upload failed" }
                : currentItem,
            ),
          );
        }
      }

      router.push(`/dashboard/batches/${batch.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="batchName" className="text-sm font-semibold text-slate-700">
          Batch name
        </label>
        <input
          id="batchName"
          value={batchName}
          onChange={(event) => setBatchName(event.target.value)}
          placeholder="Spring garden shoot"
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-blue-500/20 transition focus:ring-4"
        />
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={`rounded-3xl border-2 border-dashed p-10 text-center transition ${
          dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white"
        }`}
      >
        <UploadCloud className="mx-auto text-blue-600" size={36} />
        <p className="mt-4 text-lg font-bold text-slate-950">Drag-and-drop upload</p>
        <p className="mt-2 text-sm text-slate-500">JPEG, PNG, and WebP images up to 25MB each.</p>
        <label className="mt-5 inline-flex cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Choose files
          <input type="file" multiple accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(event) => event.target.files && addFiles(event.target.files)} />
        </label>
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          <Progress value={progress} />
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{item.file.name}</p>
                  <p className="text-sm text-slate-500">
                    {Math.round(item.file.size / 1024)} KB {item.width && item.height ? `- ${item.width}x${item.height}` : ""}
                  </p>
                  {item.error ? <p className="mt-1 text-sm text-rose-600">{item.error}</p> : null}
                </div>
                {item.status === "uploaded" ? <CheckCircle2 className="text-emerald-500" /> : null}
                {item.status === "failed" ? <AlertCircle className="text-rose-500" /> : null}
                {item.status === "ready" ? (
                  <button
                    type="button"
                    onClick={() => setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <Button type="button" onClick={startUpload} disabled={busy || items.every((item) => item.status === "failed") || items.length === 0}>
        {busy ? "Uploading..." : "Upload Images"}
      </Button>
    </div>
  );
}

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions."));
    };
    image.src = url;
  });
}
