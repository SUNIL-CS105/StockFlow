"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!isSupabaseConfigured) {
        throw new Error("Supabase environment variables are missing.");
      }

      const supabase = createSupabaseBrowserClient();
      const emailValue = String(formData.get("email") ?? "");
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: emailValue,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (signInError) {
        throw signInError;
      }

      setMessage("Check your inbox for a StockFlow magic link.");
      setEmail("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send magic link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={submit} className="space-y-5">
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="you@example.com"
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-blue-500/20 transition focus:ring-4"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send magic link"}
      </Button>
      {message ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
