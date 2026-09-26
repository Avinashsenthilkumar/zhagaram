import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Package, Phone, Route as RouteIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", href: "/", icon: Home },
  { label: "Products", href: "/products", icon: Package },
  { label: "Quote", href: "/get-a-quote", icon: FileText, primary: true },
  { label: "Process", href: "/export-process", icon: RouteIcon },
  { label: "Contact", href: "/contact", icon: Phone },
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
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
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
                  "flex h-[4.25rem] flex-col items-center justify-center gap-1 rounded-xl px-1",
                  "text-[0.625rem] font-semibold tracking-wide transition-colors duration-200",
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
                <span className={tab.primary ? "mt-0.5" : undefined}>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
