import { Link, useRouterState } from "@tanstack/react-router";
import { mainNavigation } from "@/data/navigation";
import { cn } from "@/lib/utils";

export function DesktopNavigation({
  tone = "dark",
}: {
  tone?: "dark" | "light";
}) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  return (
    <nav
      aria-label="Primary"
      className="hidden items-center gap-2 lg:flex"
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
            className={cn(
              "relative rounded-md px-3.5 py-2.5 text-sm font-medium tracking-[0.01em]",
              "transition-all duration-200",
              tone === "light"
                ? active
                  ? "text-primary"
                  : "text-primary/75 hover:text-secondary"
                : active
                  ? "text-primary"
                  : "text-primary/75 hover:text-secondary",
            )}
          >
            {item.label}

            {active && (
              <span className="absolute -bottom-1 left-3 right-3 h-[2px] rounded-full bg-accent" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}