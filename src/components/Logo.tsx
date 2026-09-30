import { Link } from "@tanstack/react-router";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-accent font-display text-sm font-bold text-accent-foreground">C</span>
      <span className={`font-display text-lg font-bold tracking-tight ${inverted ? "text-sidebar-foreground" : "text-foreground"}`}>
        CAMPUS<span className="text-accent">LINK</span>
      </span>
    </Link>
  );
}
