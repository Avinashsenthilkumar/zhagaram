import { Link, useRouterState } from "@tanstack/react-router";
import { ctaNavigation, mainNavigation } from "@/data/navigation";
import { cn } from "@/lib/utils";

export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  return (
    <div
      id="mobile-menu"
      hidden={!open}
      className={cn(
        "border-t border-primary/10 bg-white lg:hidden",
        /*
          The menu lives inside the fixed header, so it has no page scroll to
          borrow. With six destinations plus the CTA it ran past the bottom of
          a small phone -- and in landscape past almost any phone -- with no
          way to reach the last items. It now scrolls within whatever height is
          left below the header, and `overscroll-contain` stops that scroll
          from chaining into the locked page behind it.
        */
        "max-h-[calc(100dvh_-_var(--header-offset))] overflow-y-auto overscroll-contain",
        open ? "block" : "hidden",
      )}
    >
      <nav
        aria-label="Mobile"
        className="flex flex-col px-5 pb-[calc(1.25rem_+_var(--safe-bottom))] pt-5"
      >
        {mainNavigation.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              to={item.href}
              preload="intent"
              onClick={onClose}
              className={cn(
                "rounded-md px-4 py-3 text-base font-medium",
                "transition-all duration-200",

                active
                  ? "bg-primary text-white"
                  : "text-primary hover:bg-light-grey hover:text-secondary",
              )}
            >
              {item.label}
            </Link>
          );
        })}

        {/* CTA */}

        <Link
          to={ctaNavigation.href}
          preload="intent"
          onClick={onClose}
          className={cn(
            "mt-4 inline-flex h-12 items-center justify-center",
            "rounded-lg bg-accent px-5",
            "text-sm font-semibold text-dark-navy",
            "transition-colors duration-200",
            "hover:brightness-95",
          )}
        >
          {ctaNavigation.label}
        </Link>
      </nav>
    </div>
  );
}