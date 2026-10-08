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

  /*
   * Scroll lock while the mobile menu is open.
   *
   * `body { overflow: hidden }` on its own does not hold on iOS Safari -- the
   * page still rubber-bands behind the menu, and when the lock is released the
   * browser has usually forgotten where you were and drops you at the top.
   * Pinning the body with `position: fixed` at a negative offset locks it
   * properly, and the offset is restored on close.
   */
  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
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

  /*
   * ALWAYS "dark", even while the header is transparent.
   *
   * `tone` used to follow `solidHeader`, so at the top of the home page it was
   * "light" — white logo text and white nav links. That is correct over a dark
   * hero image, and this hero is not one: `Hero.tsx` is `bg-light-grey
   * text-primary`. The result was #FFFFFF text on a #F4F6F9 background, a
   * contrast ratio of 1.05:1 — the wordmark and the whole nav were invisible
   * until you scrolled.
   *
   * The background still fades from transparent to cream glass on scroll; only
   * the text colour is pinned. If a dark hero is ever introduced, restore
   * `solidHeader ? "dark" : "light"` here.
   */
  const tone = "dark" as const;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[100]",
        "transition-all duration-300",
        // Pushes the bar below the status bar / notch when the site runs
        // full-screen from the iPhone home screen. Without it the logo and the
        // menu button sat underneath the clock.
        "pt-[var(--safe-top)]",

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
          "px-safe flex items-center justify-between gap-3",
          "transition-all duration-300",
          /*
            Height now comes from --header-h, the same variable <main>'s top
            padding and every hero's negative margin read. The old pair of
            class lists let the header grow 0.25rem taller at the top of the
            home page while nothing else moved, so the hero shifted by a few
            pixels on first scroll.
          */
          "h-[var(--header-h)]",
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