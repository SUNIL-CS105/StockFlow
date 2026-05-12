"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { Button } from "./ui/button";

export function DemoBatchButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createDemoBatch() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/demo", { method: "POST" });
      const payload = (await response.json()) as { batch?: { id: string }; error?: string };

      if (!response.ok || !payload.batch) {
        throw new Error(payload.error ?? "Could not create the demo batch.");
      }

      router.push(`/dashboard/batches/${payload.batch.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the demo batch.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button type="button" variant="secondary" onClick={createDemoBatch} disabled={loading}>
        <PlayCircle size={16} />
        {loading ? "Making demo..." : "Try with sample photos"}
      </Button>
      {error ? <p className="mt-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
