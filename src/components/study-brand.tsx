import { Sigma } from "lucide-react";

export function StudyBrand() {
  return <div className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><Sigma className="size-6" /></span><span className="text-base font-semibold">Math Study Helper</span></div>;
}

export function StudyDiagram() {
  return (
    <svg viewBox="0 0 240 130" role="img" aria-label="A quadratic function on a coordinate graph" className="mx-auto h-32 w-60 text-muted-foreground">
      <g stroke="currentColor" strokeWidth="0.5" opacity="0.2">{[30, 60, 90, 120, 150, 180, 210].map(x => <path key={x} d={`M${x} 10V120`} />)}{[20, 45, 70, 95, 120].map(y => <path key={y} d={`M20 ${y}H225`} />)}</g>
      <g stroke="currentColor" strokeWidth="1"><path d="M20 95H225M120 120V10" /></g>
      <path d="M45 15 Q120 175 195 15" fill="none" stroke="var(--primary)" strokeWidth="2.5" />
      <g fill="currentColor" fontFamily="Arial, sans-serif" fontSize="10"><text x="228" y="98">x</text><text x="125" y="12">y</text><text x="150" y="118">y = x²</text></g>
    </svg>
  );
}