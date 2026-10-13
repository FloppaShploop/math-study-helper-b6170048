// Server-only database bridge. Uses only the public URL + publishable key plus a
// shared DB_BRIDGE_KEY, so it works on any host (Lovable, Netlify, ...).
import { createClient } from "@supabase/supabase-js";

export async function db<T = unknown>(op: string, args: Record<string, unknown> = {}): Promise<T> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const bridge = process.env["DB_BRIDGE_KEY"];
  if (!url || !key || !bridge) throw new Error("Missing SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY or DB_BRIDGE_KEY");
  const client = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const call = () => client.rpc("app_db" as never, { p_key: bridge, p_op: op, p_args: args } as never);
  let { data, error } = await call();
  if (error && /unauthorized/i.test(error.message) && process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
    // First run on a fresh backend: register the bridge key's hash (service role, server-only).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bridge));
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const { count } = await supabaseAdmin.from("app_config").select("name", { count: "exact", head: true }).eq("name", "bridge_key_sha256");
    if (!count) {
      await supabaseAdmin.from("app_config").insert({ name: "bridge_key_sha256", value: hex });
      ({ data, error } = await call());
    }
  }
  if (error) throw new Error(`Database error (${op}): ${error.message}`);
  return data as T;
}
