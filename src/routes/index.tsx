import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, RotateCw, House, Maximize, Minimize, Search, X, Users, LogOut,
} from "lucide-react";
import { fromProxyPath, normalizeUserInput, toProxyPath } from "@/lib/proxy/url";
import { getViewer, signOut } from "@/lib/auth/auth.functions";
import { Button } from "@/components/ui/button";
import { StudyBrand, StudyDiagram } from "@/components/study-brand";

type Search = { url?: string };

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => (typeof s["url"] === "string" ? { url: s["url"] } : {}),
  head: () => ({
    meta: [
      { title: "Study workspace — Math Study Helper" },
      { name: "description", content: "Search math projects and study resources in your student workspace." },
      { property: "og:title", content: "Study workspace — Math Study Helper" },
      { property: "og:description", content: "Search math projects and study resources in your student workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    const viewer = await getViewer();
    if (!viewer) throw redirect({ to: "/login" });
    return { viewer };
  },
  component: Browser,
});

function Browser() {
  const { viewer } = Route.useLoaderData();
  const router = useRouter();
  const logout = async () => {
    await signOut();
    await router.navigate({ to: "/login", replace: true });
  };
  const search = Route.useSearch();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [current, setCurrent] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [full, setFull] = useState(false);

  const go = useCallback((raw: string) => {
    const url = normalizeUserInput(raw);
    if (!url) return;
    setError(null);
    setLoading(true);
    setCurrent(url);
    setAddress(url);
    setSrc(toProxyPath(url));
  }, []);

  useEffect(() => {
    if (search.url) go(search.url);
  }, [search.url, go]);

  // messages from the injected runtime inside proxied pages
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== location.origin || !e.data?.__proxy) return;
      if (e.source !== frameRef.current?.contentWindow) return;
      if (e.data.type === "nav") {
        setCurrent(e.data.url);
        setAddress(e.data.url);
        if (e.data.title) setTitle(e.data.title);
        setError(null);
      } else if (e.data.type === "error") {
        setError(`${e.data.status} · ${e.data.title}`);
        setLoading(false);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const onLoad = () => {
    setLoading(false);
    try {
      const w = frameRef.current?.contentWindow;
      if (!w) return;
      const t = fromProxyPath(w.location.pathname + w.location.search + w.location.hash);
      if (t) {
        setCurrent(t.href);
        setAddress(t.href);
      }
      setTitle(w.document.title || "");
    } catch {
      /* cross-origin (shouldn't happen) */
    }
  };

  const win = () => frameRef.current?.contentWindow ?? null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    go(address);
  };
  const home = () => {
    setSrc(null);
    setCurrent(null);
    setAddress("");
    setTitle("");
    setLoading(false);
    setError(null);
  };
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else shellRef.current?.requestFullscreen?.();
  };

  return (
    <div ref={shellRef} className="study-theme flex h-dvh flex-col bg-background text-foreground">
      <header className="relative z-10 border-b border-border bg-chrome">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4">
          <StudyBrand />
          <div className="flex items-center gap-1">
            {viewer.role === "admin" && <Button asChild variant="ghost" size="sm"><Link to="/admin" title="Manage accounts"><Users /><span className="hidden sm:inline">Accounts</span></Link></Button>}
            <NavBtn label={`Sign out (${viewer.username})`} onClick={logout}><LogOut /></NavBtn>
          </div>
        </div>
        {src && <div className="flex items-center gap-1 px-2 pb-2 sm:gap-2 sm:px-4">
          <NavBtn label="Back" onClick={() => win()?.history.back()} disabled={!src}><ArrowLeft /></NavBtn>
          <NavBtn label="Forward" onClick={() => win()?.history.forward()} disabled={!src}><ArrowRight /></NavBtn>
          <NavBtn
            label={loading ? "Stop" : "Reload"}
            disabled={!src}
            onClick={() => {
              if (loading) { win()?.stop(); setLoading(false); }
              else { setLoading(true); win()?.location.reload(); }
            }}
          >
            {loading ? <X /> : <RotateCw />}
          </NavBtn>
          <NavBtn label="Home" onClick={home} className="hidden sm:inline-flex"><House /></NavBtn>

          <form onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-1 focus-within:border-ring">
            <input value={address} onChange={(e) => setAddress(e.target.value)} aria-label="Search math projects" placeholder="Search math projects and resources" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            <Button type="submit" variant="ghost" size="icon" aria-label="Search"><Search /></Button>
          </form>
          <NavBtn label={full ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFull}>{full ? <Minimize /> : <Maximize />}</NavBtn>
        </div>}
        {loading && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden" role="progressbar" aria-label="Loading">
            <div className="h-full w-2/5 animate-progress bg-primary" />
          </div>
        )}
        {(title || error) && src && (
          <div className="flex items-center gap-2 border-t border-border px-4 py-1 text-xs text-muted-foreground">
            {error ? <span className="font-medium text-destructive">{error}</span> : <span className="truncate">{title}</span>}
          </div>
        )}
      </header>

      <main className="relative flex-1 overflow-hidden">
        {src ? (
          <iframe
            ref={frameRef}
            key={src}
            src={src}
            onLoad={onLoad}
            title={title || "Proxied page"}
            className="size-full border-0 bg-card"
            allow="fullscreen; autoplay; picture-in-picture; clipboard-write"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-presentation allow-pointer-lock allow-orientation-lock"
          />
        ) : (
          <StartPage onGo={go} sites={viewer.allSites ? undefined : viewer.sites} />
        )}
      </main>
    </div>
  );
}

function NavBtn({ children, label, onClick, disabled, className = "" }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <Button variant="ghost" size="icon"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-[18px] ${className}`}
    >
      {children}
    </Button>
  );
}

function StartPage({ onGo, sites }: { onGo: (u: string) => void; sites?: string[] }) {
  const [q, setQ] = useState("");
  return (
    <div className="size-full overflow-auto px-5 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-2xl">
        <StudyDiagram />
        <h1 className="mt-6 text-center text-3xl font-semibold">Math Study Helper</h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">Your workspace for math projects and study resources.</p>
        <form onSubmit={(e) => { e.preventDefault(); onGo(q); }} className="mt-8 flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-input bg-card px-3 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search math projects and resources" aria-label="Search math projects" spellCheck={false} autoCapitalize="off" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </div>
          <Button type="submit" className="h-11">Search</Button>
        </form>
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"><span>Algebra</span><span>Geometry</span><span>Calculus</span><span>Statistics</span></div>
        {sites && <section className="mt-10"><h2 className="text-sm font-semibold">Assigned resources</h2><div className="mt-3 flex flex-wrap gap-2">{sites.map(site => <Button key={site} variant="outline" onClick={() => onGo("https://" + site)}>{site}<ArrowRight /></Button>)}</div>{sites.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No resources assigned yet. Contact your study administrator.</p>}</section>}
      </div>
    </div>
  );
}
