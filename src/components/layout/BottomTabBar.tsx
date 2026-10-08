import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Package, Phone, Route as RouteIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * `primary` is spelled out on EVERY entry on purpose.
 *
 * With `as const` and the flag on only one entry, this array's element type is a
 * union in which four members have no `primary` property at all, so every
 * `tab.primary` below is a type error (TS2339). Declaring it on all five keeps
 * the literal `href` values that <Link to=...> needs, without widening anything.
 */
const tabs = [
  { label: "Home", href: "/", icon: Home, primary: false },
  { label: "Products", href: "/products", icon: Package, primary: false },
  { label: "Quote", href: "/get-a-quote", icon: FileText, primary: true },
  { label: "Process", href: "/export-process", icon: RouteIcon, primary: false },
  { label: "Contact", href: "/contact", icon: Phone, primary: false },
] as const;

/**
 * Fixed bottom navigation, phones only.
 *
 * This is the single biggest thing that makes a site read as an app: the
 * primary destinations sit under the thumb instead of behind a hamburger.
 * Hidden from `lg` up, where the normal header nav takes over.
 */
export function BottomTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[90] lg:hidden",
        "border-t border-black/[0.06] bg-[#f8f8f4]/95 backdrop-blur-xl",
        "shadow-[0_-8px_30px_rgba(16,37,27,0.08)]",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 sm:px-2">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          return (
            <li key={tab.href} className="flex-1">
              <Link
                to={tab.href}
                preload="intent"
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[var(--tabbar-h)] flex-col items-center justify-center gap-1 rounded-xl px-0.5",
                  /*
                    0.625rem used to compute to 9.4px against the old 15px
                    root -- below the ~11px floor where a label stops being
                    readable at arm's length. At a 16px root it is 10px, and
                    bumping it to 0.6875rem lands on 11px. `truncate` keeps
                    "Products" and "Process" on one line on a 320px screen
                    instead of wrapping and shoving the icons out of line.
                  */
                  "w-full text-[0.6875rem] font-semibold leading-none tracking-tight transition-colors duration-200",
                  active ? "text-[#0B2D5B]" : "text-[#6B7280]",
                )}
              >
                <span
                  className={cn(
                    "grid place-items-center rounded-full transition-all duration-200",
                    tab.primary
                      ? "-mt-5 size-11 bg-[#0B2D5B] text-white shadow-[0_8px_20px_rgba(11,45,91,0.32)]"
                      : "size-7",
                    active && !tab.primary && "bg-[#0B2D5B]/10",
                  )}
                >
                  <Icon className={tab.primary ? "size-5" : "size-[1.15rem]"} />
                </span>
                <span
                  className={cn(
                    "block w-full truncate text-center",
                    tab.primary && "mt-0.5",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
