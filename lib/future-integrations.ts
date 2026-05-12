import type { ExportPlatform } from "./types";

export type PlatformIntegration = {
  platform: Exclude<ExportPlatform, "master">;
  displayName: string;
  status: "planned";
  notes: string;
};

export const futurePlatformIntegrations: PlatformIntegration[] = [
  {
    platform: "getty",
    displayName: "Getty Images",
    status: "planned",
    notes: "CSV export is supported now. Direct upload can be added if a compliant partner API is available.",
  },
  {
    platform: "adobe",
    displayName: "Adobe Stock",
    status: "planned",
    notes: "Keep credentials out of the browser and add OAuth/API review before enabling direct publishing.",
  },
  {
    platform: "shutterstock",
    displayName: "Shutterstock",
    status: "planned",
    notes: "Future connector should validate login/API rules and contributor agreement constraints.",
  },
  {
    platform: "alamy",
    displayName: "Alamy",
    status: "planned",
    notes: "CSV-first workflow avoids brittle browser automation and respects platform upload policy changes.",
  },
  {
    platform: "dreamstime",
    displayName: "Dreamstime",
    status: "planned",
    notes: "Connector boundary is ready for a future server-side queue and audit log.",
  },
];
