# AGENTS.md

## Cursor Cloud specific instructions

### Overview

StockFlow is a full-stack Next.js 16 (App Router) application for stock photo batch metadata and export workflows. It uses Supabase for auth/DB/storage, OpenAI Vision API for metadata generation, and `sharp` for image processing.

### Running services

- **Next.js dev server**: `npm run dev` (port 3000)
- **Local Supabase**: `npx supabase start` (requires Docker; provides Postgres, Auth, Storage, Mailpit)

### Lint / Typecheck / Build

Standard commands in `package.json`:
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — production build

### Local Supabase setup

1. Docker must be running before `npx supabase start`.
2. After Supabase starts, apply the schema: `docker exec -i supabase_db_workspace psql -U postgres -d postgres < supabase/schema.sql`
3. Supabase status (with JWT keys): `npx supabase status -o env`
4. Mailpit (captures magic link emails): http://127.0.0.1:54324
5. Supabase Studio: http://127.0.0.1:54323

### Environment variables

Copy `.env.example` to `.env.local`. For local Supabase, use keys from `npx supabase status -o env`:
- `NEXT_PUBLIC_SUPABASE_URL` = `http://127.0.0.1:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ANON_KEY from status
- `SUPABASE_SERVICE_ROLE_KEY` = SERVICE_ROLE_KEY from status
- `OPENAI_API_KEY` is optional; the app returns fallback metadata without it

### Auth gotcha

The middleware file is `proxy.ts` (not `middleware.ts`), so Supabase cookie refresh middleware may not activate in Next.js. For testing, you can create a test user with password via the admin API and sign in through the browser console using `createBrowserClient` from `@supabase/ssr`:

```javascript
const { createBrowserClient } = await import('https://esm.sh/@supabase/ssr@0.10.3');
const sb = createBrowserClient('http://127.0.0.1:54321', '<ANON_KEY>');
await sb.auth.signInWithPassword({ email: 'test@stockflow.dev', password: 'testpassword123' });
```

Create the test user first:
```bash
curl -X POST http://127.0.0.1:54321/auth/v1/admin/users \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@stockflow.dev","password":"testpassword123","email_confirm":true}'
```

### Docker in Cloud Agent VMs

Docker requires special setup in Cloud Agent VMs (fuse-overlayfs, iptables-legacy). See the Docker installation steps in the system prompt. After Docker is running, `npx supabase start` pulls images on first run (~2-3 minutes).
