import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      data-touch-target
      className={cn(
        // Stacked above the WhatsApp button, which itself sits one gap above
        // the tab bar. All three now derive from --tabbar-offset, so they stay
        // in a tidy column on a notched phone instead of overlapping.
        "fixed right-4 z-40 flex size-11 items-center justify-center rounded-full",
        "bottom-[calc(var(--tabbar-offset)_+_5.5rem)] sm:right-6 lg:bottom-28 lg:right-8",
        "bg-primary text-primary-foreground shadow-[var(--shadow-border-hover)] transition-opacity duration-200",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <ArrowUp className="size-4" />
    </button>
  );
}
