import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

import { Button } from "@/components/common/Button";
import { Container } from "@/components/common/Container";
import { Logo } from "@/components/common/Logo";
import { DesktopNavigation } from "@/components/layout/DesktopNavigation";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { ctaNavigation } from "@/data/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const isHome = pathname === "/";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /*
   * HOME
   * ─────────────────────────────────
   * Top      → transparent
   * Scrolled → cream glass
   *
   * INNER PAGES
   * ─────────────────────────────────
   * Always   → cream glass
   */

  const solidHeader = !isHome || scrolled || open;

  const tone = solidHeader ? "dark" : "light";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[100]",
        "transition-all duration-300",

        solidHeader
          ? [
              "border-b border-black/[0.06]",
              "bg-[#f8f8f4]/95",
              "shadow-[0_8px_30px_rgba(16,37,27,0.06)]",
              "backdrop-blur-xl",
            ]
          : [
              "border-b border-transparent",
              "bg-transparent",
            ],
      )}
    >
      <Container
  className={cn(
    "flex items-center justify-between",
    "transition-all duration-300",
    solidHeader
      ? "h-16 sm:h-[4.5rem] lg:h-[5rem] xl:h-[5.5rem]"
      : "h-16 sm:h-[4.75rem] lg:h-[5.25rem] xl:h-[5.75rem]",
  )}
>
        {/* LOGO */}
        <div className="shrink-0">
          <Logo tone={tone} />
        </div>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden lg:block">
          <DesktopNavigation tone={tone} />
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          {/* GET A QUOTE */}
          <div className="hidden lg:block">
            <Button
              href={ctaNavigation.href}
              size="sm"
              variant={solidHeader ? "primary" : "gold"}
              className="rounded-md px-6 font-semibold transition-all duration-300"
            >
              {ctaNavigation.label}
            </Button>
          </div>

          {/* MOBILE MENU */}
          <MobileNavigation
            open={open}
            onToggle={() => setOpen((value) => !value)}
            tone={tone}
          />
        </div>
      </Container>

      {/* MOBILE MENU */}
      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
      />
    </header>
  );
}