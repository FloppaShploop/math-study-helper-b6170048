import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Maximize, Search, X, Users, LogOut } from "lucide-react";
import { normalizeUserInput, toProxyPath } from "@/lib/proxy/url";
import { hostAllowed } from "@/lib/auth/sites";
import { getViewer, signOut } from "@/lib/auth/auth.functions";
import { Button } from "@/components/ui/button";
import { StudyBrand } from "@/components/study-brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study workspace — Math Study Helper" },
      { name: "description", content: "Algebra, geometry, calculus and statistics notes in your math study workspace." },
      { property: "og:title", content: "Study workspace — Math Study Helper" },
      { property: "og:description", content: "Algebra, geometry, calculus and statistics notes in your math study workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    const viewer = await getViewer();
    if (!viewer) throw redirect({ to: "/login" });
    return { viewer };
  },
  component: Workspace,
});

const TABS = {
  Algebra: [
    ["Quadratic formula", "x = (−b ± √(b² − 4ac)) / 2a"],
    ["Slope", "m = (y₂ − y₁) / (x₂ − x₁)"],
    ["Slope-intercept form", "y = mx + b"],
    ["Difference of squares", "a² − b² = (a + b)(a − b)"],
    ["Exponent rule", "aᵐ · aⁿ = aᵐ⁺ⁿ"],
  ],
  Geometry: [
    ["Pythagorean theorem", "a² + b² = c²"],
    ["Area of a circle", "A = πr²"],
    ["Circumference", "C = 2πr"],
    ["Triangle area", "A = ½ · b · h"],
    ["Interior angles", "(n − 2) · 180°"],
  ],
  Trigonometry: [
    ["SOH CAH TOA", "sin = opp/hyp · cos = adj/hyp · tan = opp/adj"],
    ["Pythagorean identity", "sin²θ + cos²θ = 1"],
    ["Law of sines", "a/sin A = b/sin B = c/sin C"],
    ["Law of cosines", "c² = a² + b² − 2ab·cos C"],
  ],
  Calculus: [
    ["Power rule", "d/dx xⁿ = n·xⁿ⁻¹"],
    ["Product rule", "(fg)′ = f′g + fg′"],
    ["Chain rule", "(f∘g)′ = f′(g(x)) · g′(x)"],
    ["Integral of xⁿ", "∫xⁿ dx = xⁿ⁺¹/(n+1) + C"],
  ],
  Statistics: [
    ["Mean", "x̄ = Σx / n"],
    ["Standard deviation", "σ = √(Σ(x − μ)² / N)"],
    ["Z-score", "z = (x − μ) / σ"],
    ["Probability (and)", "P(A ∩ B) = P(A) · P(B)  (independent)"],
  ],
} as const;
type Tab = keyof typeof TABS;

type Panel = { kind: "frame"; src: string } | { kind: "none"; query: string; canSearch: boolean } | { kind: "blocked"; host: string } | null;

function Workspace() {
  const { viewer } = Route.useLoaderData();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Algebra");
  const [q, setQ] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [full, setFull] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const allowed = useCallback(
    (host: string) => viewer.allSites || hostAllowed(host, viewer.sites),
    [viewer],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const s = q.trim();
    if (!s) return;
    const url = normalizeUserInput(s);
    if (!url) return;
    const u = new URL(url);
    if (u.hostname === "html.duckduckgo.com") {
      setPanel({ kind: "none", query: s, canSearch: allowed("duckduckgo.com") });
    } else if (allowed(u.hostname)) {
      setPanel({ kind: "frame", src: toProxyPath(url) });
    } else {
      setPanel({ kind: "blocked", host: u.hostname.replace(/^www\./, "") });
    }
  };

  const openResults = (query: string) =>
    setPanel({ kind: "frame", src: toProxyPath("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query)) });

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === boxRef.current && !!boxRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const win = () => frameRef.current?.contentWindow ?? null;
  const logout = async () => {
    await signOut();
    await router.navigate({ to: "/login", replace: true });
  };

  return (
    <div className="study-theme flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border bg-chrome">
        <div className="flex items-center gap-3 px-3 py-2">
          <form onSubmit={submit} className="flex w-40 items-center gap-1 rounded-md border border-input bg-background px-2 focus-within:border-ring sm:w-48">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" placeholder="Search…" spellCheck={false} autoCapitalize="off" className="h-7 min-w-0 flex-1 bg-transparent text-xs outline-none" />
          </form>
          <div className="flex-1"><StudyBrand /></div>
          {viewer.role === "admin" && (
            <Button asChild variant="ghost" size="sm"><Link to="/admin"><Users /><span className="hidden sm:inline">Accounts</span></Link></Button>
          )}
          <Button variant="ghost" size="icon" onClick={logout} aria-label={`Sign out (${viewer.username})`} title={`Sign out (${viewer.username})`}><LogOut /></Button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3">
          {(Object.keys(TABS) as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm transition ${tab === t ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <h1 className="text-3xl font-semibold">{tab}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Key formulas and rules to review.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {TABS[tab].map(([name, f]) => (
            <div key={name} className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{name}</div>
              <div className="mt-2 font-mono text-lg">{f}</div>
            </div>
          ))}
        </div>
      </main>

      {panel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" onClick={() => setPanel(null)}>
          <div ref={boxRef} onClick={(e) => e.stopPropagation()}
            className={full ? "size-full bg-card" : "flex h-[65vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"}>
            {!full && (
              <div className="flex items-center gap-1 border-b border-border px-2 py-1">
                {panel.kind === "frame" && (<>
                  <Button variant="ghost" size="icon" aria-label="Back" onClick={() => win()?.history.back()}><ArrowLeft /></Button>
                  <Button variant="ghost" size="icon" aria-label="Forward" onClick={() => win()?.history.forward()}><ArrowRight /></Button>
                  <Button variant="ghost" size="icon" aria-label="Full screen" onClick={() => boxRef.current?.requestFullscreen?.()}><Maximize /></Button>
                </>)}
                <div className="flex-1" />
                <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setPanel(null)}><X /></Button>
              </div>
            )}
            {panel.kind === "frame" ? (
              <iframe ref={frameRef} key={panel.src} src={panel.src} title="Results" className="w-full flex-1 border-0 bg-card" style={full ? { height: "100%" } : undefined}
                allow="fullscreen; autoplay; clipboard-write" allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-presentation allow-pointer-lock" />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                {panel.kind === "none" ? (<>
                  <p className="text-lg">No results for “{panel.query}”</p>
                  {panel.canSearch && <Button onClick={() => openResults(panel.query)}>Results</Button>}
                </>) : (
                  <p className="text-lg">No results for “{panel.host}”</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
