"use client";

import { Archive, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { platformLabels } from "@/lib/platforms";
import type { ExportPlatform } from "@/lib/types";

const platforms: ExportPlatform[] = ["master", "getty", "adobe", "shutterstock", "alamy", "dreamstime"];

export function ExportPanel({ batchId }: { batchId: string }) {
  function download(url: string) {
    window.location.href = url;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <FileSpreadsheet className="text-blue-600" />
        <h2 className="mt-4 text-xl font-bold text-slate-950">CSV exports</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Download spreadsheet-ready files for each marketplace. Review warnings before uploading anywhere.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {platforms.map((platform) => (
            <Button key={platform} type="button" variant={platform === "master" ? "primary" : "ghost"} onClick={() => download(`/api/batches/${batchId}/exports?platform=${platform}`)}>
              <Download size={16} />
              {platformLabels[platform]}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <Archive className="text-emerald-600" />
        <h2 className="mt-4 text-xl font-bold text-slate-950">Download files</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Export enhanced images as a ZIP and keep a JSON backup of every metadata field.
        </p>
        <div className="mt-5 grid gap-2">
          <Button type="button" variant="secondary" onClick={() => download(`/api/batches/${batchId}/exports/images`)}>
            <Archive size={16} />
            Download Enhanced Images
          </Button>
          <Button type="button" variant="ghost" onClick={() => download(`/api/batches/${batchId}/exports?platform=master&format=json`)}>
            <FileJson size={16} />
            Metadata JSON backup
          </Button>
          <Button type="button" onClick={() => download(`/api/batches/${batchId}/exports/everything`)}>
            <Download size={16} />
            Download Everything
          </Button>
        </div>
      </Card>
    </div>
  );
}
