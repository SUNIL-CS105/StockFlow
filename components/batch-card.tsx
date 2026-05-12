import { CalendarDays, ImageIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { ButtonLink } from "./ui/button";
import { Card } from "./ui/card";
import type { Batch } from "@/lib/types";

export function BatchCard({ batch, imageCount }: { batch: Batch; imageCount: number }) {
  return (
    <Card className="flex flex-col justify-between gap-5">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950">{batch.batch_name}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays size={16} />
              {new Date(batch.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge tone={batch.status === "metadata_ready" ? "green" : "blue"}>{batch.status.replace("_", " ")}</Badge>
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm text-slate-600">
          <ImageIcon size={16} />
          {imageCount} images
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href={`/dashboard/batches/${batch.id}`} variant="ghost">
          Review Metadata
        </ButtonLink>
        <ButtonLink href={`/dashboard/batches/${batch.id}/export`} variant="secondary">
          Export CSV
        </ButtonLink>
      </div>
    </Card>
  );
}
