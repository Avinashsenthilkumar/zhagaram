import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNavigation({
  open,
  onToggle,
  tone = "dark",
}: {
  open: boolean;
  onToggle: () => void;
  tone?: "dark" | "light";
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-md lg:hidden",
        "transition-colors duration-200",
        tone === "light"
          ? "text-primary-foreground hover:text-accent"
          : "text-primary hover:text-primary-dark",
      )}
      aria-expanded={open}
      aria-controls="mobile-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={onToggle}
    >
      {open ? (
        <X className="size-5" />
      ) : (
        <Menu className="size-5" />
      )}
    </button>
  );
}