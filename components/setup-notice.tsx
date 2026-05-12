import { Card } from "./ui/card";

export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Setup needed</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Connect Supabase to run StockFlow</h1>
        <p className="mt-3 text-slate-600">
          Copy <code className="rounded bg-slate-100 px-1 py-0.5">.env.example</code> to{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5">.env.local</code>, add your Supabase URL and anon key,
          then run the SQL migration in <code className="rounded bg-slate-100 px-1 py-0.5">supabase/schema.sql</code>.
        </p>
      </Card>
    </main>
  );
}
