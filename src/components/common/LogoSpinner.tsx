import { cn } from "@/lib/utils";

/**
 * The brand mark spinning inside a rotating ring.
 *
 * Used for every loading state in the app: route transitions, product grids,
 * review lists, admin tables and form submits.
 *
 * The ring spins; the logo itself only breathes (a gentle pulse). Rotating the
 * mark makes the ship and plane read upside-down, which looks broken rather
 * than busy.
 */
export function LogoSpinner({
  size = "md",
  label = "Loading",
  className,
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}) {
  const box = {
    sm: "size-10",
    md: "size-16",
    lg: "size-24",
  }[size];

  const mark = {
    sm: "size-6",
    md: "size-10",
    lg: "size-14",
  }[size];

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("relative inline-grid place-items-center", box, className)}
    >
      {/* Rotating ring */}
      <svg
        className="absolute inset-0 size-full animate-spin [animation-duration:1.1s]"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="currentColor"
          strokeWidth="6"
          className="text-[#0B2D5B]/10"
        />
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="url(#zhagaram-spinner-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="70 206"
        />
        <defs>
          <linearGradient id="zhagaram-spinner-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F0B429" />
            <stop offset="100%" stopColor="#0B2D5B" />
          </linearGradient>
        </defs>
      </svg>

      {/* Brand mark */}
      <img
        src="/logo-mark.png"
        alt=""
        aria-hidden="true"
        className={cn(
          "relative object-contain motion-safe:animate-pulse [animation-duration:1.6s]",
          mark,
        )}
      />

      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Full-viewport loader shown while a route resolves.
 */
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-[60vh] w-full place-items-center px-6 py-24">
      <div className="flex flex-col items-center gap-5 text-center">
        <LogoSpinner size="lg" label={label} />
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

/**
 * Inline loader for a section of a page (a product grid, a review list).
 */
export function SectionLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid w-full place-items-center py-16">
      <LogoSpinner size="md" label={label} />
    </div>
  );
}
