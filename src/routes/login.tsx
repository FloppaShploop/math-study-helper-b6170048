import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { getViewer, signIn } from "@/lib/auth/auth.functions";
import { Button } from "@/components/ui/button";
import { StudyBrand, StudyDiagram } from "@/components/study-brand";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Math Study Helper" },
      { name: "description", content: "Sign in to your math study workspace and project resources." },
      { property: "og:title", content: "Sign in — Math Study Helper" },
      { property: "og:description", content: "Sign in to your math study workspace and project resources." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => {
    if (await getViewer()) throw redirect({ to: "/" });
  },
  component: Login,
});

function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await signIn({ data: { username, password } });
      if (!r.ok) setError(r.error);
      else await router.navigate({ to: "/", replace: true });
    } catch {
      setError("Couldn't sign in. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="study-theme flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card px-6 py-4"><div className="mx-auto max-w-5xl"><StudyBrand /></div></header>
      <main className="flex flex-1 items-center justify-center px-5 py-8">
      <form onSubmit={submit} className="w-full max-w-sm">
        <StudyDiagram />
        <h1 className="mt-5 text-center text-2xl font-semibold">Sign in to your study space</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Math projects, notes, and study resources.</p>
        <label className="mt-6 block text-sm font-medium">Username
          <input required value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="off"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
        </label>
        <label className="mt-4 block text-sm font-medium">Password
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
        </label>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <Button disabled={busy} className="mt-6 h-11 w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <p className="mt-5 text-center text-xs text-muted-foreground">Need an account? Contact your study administrator.</p>
      </form>
      </main>
      <footer className="px-5 py-5 text-center text-xs text-muted-foreground">Math Study Helper · Student workspace</footer>
    </div>
  );
}
