# StockFlow

StockFlow is a full-stack Next.js app for beginner stock photo contributors. It helps users upload image batches, lightly enhance photos, generate stock-platform-ready metadata with an OpenAI vision model, review/edit metadata in a spreadsheet-style table, and export CSV/spreadsheet files for Getty, Adobe Stock, Shutterstock, Alamy, and Dreamstime.

The MVP intentionally does **not** auto-upload to stock platforms. It produces clean CSV files, JSON backups, and organized image ZIP downloads. Future direct integrations are isolated behind a placeholder connector architecture in `lib/future-integrations.ts`.

## Tech stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Storage, and Row Level Security
- OpenAI Vision API via the Responses API
- `sharp` for mild server-side stock-photo enhancement
- `jszip` for ZIP downloads
- CSV export utilities with platform-specific templates

## Core workflow

1. User signs in with Supabase magic link auth.
2. User creates a batch and uploads multiple images.
3. StockFlow records filenames, dimensions, file sizes, thumbnails, and upload status.
4. User clicks **Auto Enhance All** for light brightness, contrast, sharpening, and natural JPEG output.
5. User clicks **Generate Metadata**.
6. AI generates title, factual description, ordered keywords, category, commercial/editorial suggestion, release warnings, quality warnings, and confidence score.
7. User reviews and edits metadata in a spreadsheet-style table.
8. User exports master CSV, Getty CSV, Adobe Stock CSV, Shutterstock CSV, Alamy CSV, Dreamstime CSV, enhanced images ZIP, and metadata JSON backup.

## Pages

- `/` landing page
- `/auth` magic link sign-in
- `/dashboard`
- `/dashboard/batches/new`
- `/dashboard/batches/[batchId]`
- `/dashboard/batches/[batchId]/metadata`
- `/dashboard/batches/[batchId]/export`
- `/dashboard/settings`

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-for-server-routes-only
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_VISION_MODEL=gpt-4o-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`OPENAI_API_KEY` is required for real visual metadata. Without it, StockFlow returns low-confidence fallback metadata so the UI can still be explored. `SUPABASE_SERVICE_ROLE_KEY` is required for server-side image enhancement and storage ZIP jobs.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Confirm these private buckets exist:
   - `stockflow-originals`
   - `stockflow-enhanced`
4. In Authentication settings, add your local and deployed URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-vercel-domain.vercel.app/auth/callback`
5. Keep Row Level Security enabled. The migration includes policies so users can only access their own batches, images, metadata, settings, and storage folders.

## Deployment to Vercel

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add the environment variables from `.env.example` to Vercel Project Settings.
4. Deploy.
5. Add the Vercel callback URL to Supabase Auth redirect URLs.
6. Run a smoke test:
   - sign in
   - create a batch
   - upload images
   - generate metadata
   - export a master CSV

## Security notes

- OpenAI and Supabase service-role keys are server-only environment variables.
- Browser uploads use Supabase Auth and storage RLS folder policies.
- Database policies restrict all user content by `auth.uid()`.
- Direct stock platform uploading is not implemented in the MVP to avoid API/login policy issues.

## MVP phases

### Phase 1

- Upload images
- Store images
- Generate metadata
- Review table
- Export CSV

### Phase 2

- Auto enhancement
- ZIP download
- Platform-specific CSV templates

### Phase 3

- Duplicate detection
- Similar image warnings
- Earnings tracker
- Future compliant API integrations
