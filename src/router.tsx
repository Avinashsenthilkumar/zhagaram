import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { NotFound } from "@/components/common/NotFound";
import { PageLoader } from "@/components/common/LogoSpinner";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: NotFound,
    // Brand spinner for every route transition.
    defaultPendingComponent: PageLoader,
    // Show it only if the route actually takes a moment -- flashing a spinner
    // for 80ms looks worse than showing nothing.
    defaultPendingMs: 220,
    defaultPendingMinMs: 320,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
  });
}
