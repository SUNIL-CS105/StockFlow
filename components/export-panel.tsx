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
        <h2 className="mt-4 text-xl font-bold text-slate-950">Spreadsheet downloads</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Choose the stock website you want. StockFlow makes the spreadsheet file for you.
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
        <h2 className="mt-4 text-xl font-bold text-slate-950">Photo and backup downloads</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Save improved photos as a ZIP and keep a backup of your words.
        </p>
        <div className="mt-5 grid gap-2">
          <Button type="button" variant="secondary" onClick={() => download(`/api/batches/${batchId}/exports/images`)}>
            <Archive size={16} />
            Download improved photos
          </Button>
          <Button type="button" variant="ghost" onClick={() => download(`/api/batches/${batchId}/exports?platform=master&format=json`)}>
            <FileJson size={16} />
            Words backup
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
