import { createFileRoute, Link } from "@tanstack/react-router";
import { handleEscaped } from "@/lib/proxy/handler";

const h = ({ request }: { request: Request }) => handleEscaped(request);

export const Route = createFileRoute("/$")({
  server: { handlers: { GET: h, POST: h, HEAD: h } },
  head: () => ({ meta: [
    { title: "Page not found — Math Study Helper" },
    { name: "description", content: "This study resource could not be found." },
    { property: "og:title", content: "Page not found — Math Study Helper" },
    { property: "og:description", content: "This study resource could not be found." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Missing,
});

function Missing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
      <div>
        <p className="font-mono text-6xl text-muted-foreground">404</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">Back to University Study Tools</Link>
      </div>
    </div>
  );
}
