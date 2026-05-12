"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" onClick={signOut}>
      Sign out
    </Button>
  );
}
