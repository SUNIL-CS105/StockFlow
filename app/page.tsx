import { ArrowRight, CheckCircle2, Download, FileSpreadsheet, Sparkles, UploadCloud } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { futurePlatformIntegrations } from "@/lib/future-integrations";

const workflow = [
  { title: "Upload a batch", description: "Drag in stock photo candidates and keep originals organized.", icon: UploadCloud },
  { title: "Enhance lightly", description: "Apply natural brightness, contrast, sharpening, and mild noise cleanup.", icon: Sparkles },
  { title: "Generate metadata", description: "Create titles, factual descriptions, 50 ordered keywords, categories, and warnings.", icon: FileSpreadsheet },
  { title: "Export safely", description: "Download CSVs, JSON backup, and enhanced images instead of direct platform uploads.", icon: Download },
];

export default function LandingPage() {
  return (
    <main>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 p-2 text-white">
            <FileSpreadsheet size={24} />
          </div>
          <span className="text-xl font-bold text-slate-950">StockFlow</span>
        </div>
        <div className="flex gap-3">
          <ButtonLink href="/auth" variant="ghost">
            Sign in
          </ButtonLink>
          <ButtonLink href="/dashboard">
            Open dashboard <ArrowRight size={16} />
          </ButtonLink>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-600">Beginner stock workflow</p>
          <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">
            Turn photo batches into stock-ready exports.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            StockFlow helps new contributors upload images, lightly enhance them, generate marketplace-ready metadata,
            review warnings, and export clean CSV files for major stock platforms.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/dashboard/batches/new">
              Create New Batch <ArrowRight size={18} />
            </ButtonLink>
            <ButtonLink href="#platforms" variant="secondary">
              View exports
            </ButtonLink>
          </div>
        </div>

        <Card className="relative overflow-hidden">
          <div className="absolute right-8 top-8 h-24 w-24 rounded-full bg-emerald-200 blur-3xl" />
          <div className="relative">
            <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold">Spring flowers batch</span>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-200">82% ready</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["Nature", "Macro", "Garden", "Leaf", "Bloom", "Texture"].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/10 p-3">
                    <div className="mb-3 h-20 rounded-xl bg-gradient-to-br from-emerald-200 to-blue-200" />
                    <p className="text-xs text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Warnings to review</p>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>Release: no people or logos detected.</p>
                <p>Quality: one image may be underexposed.</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-4 md:grid-cols-4">
          {workflow.map((item) => (
            <Card key={item.title}>
              <item.icon className="text-blue-600" />
              <h2 className="mt-4 text-lg font-bold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="platforms" className="mx-auto max-w-7xl px-6 py-16">
        <Card>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">CSV-first MVP</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950">No brittle auto-upload in phase 1.</h2>
              <p className="mt-4 text-slate-600">
                StockFlow exports marketplace templates and organized downloads now, with a clean connector boundary for
                future compliant integrations.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {futurePlatformIntegrations.map((integration) => (
                <div key={integration.platform} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    {integration.displayName}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{integration.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
