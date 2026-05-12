import { UploadDropzone } from "@/components/upload-dropzone";
import { SetupNotice } from "@/components/setup-notice";
import { Card, SectionHeading } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function NewBatchPage() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const session = await requireUser();
  if (!session) {
    return <SetupNotice />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <SectionHeading
        eyebrow="Batch upload"
        title="Upload your first batch of stock photos."
        description="StockFlow preserves originals, records dimensions, and prepares each image for enhancement and metadata generation."
      />
      <Card>
        <UploadDropzone />
      </Card>
    </div>
  );
}
