import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { AppSplash } from "@/components/common/AppSplash";
import { useRouterState } from "@tanstack/react-router";

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLogin = pathname === "/login";
  const isStandalone = isAdmin || isLogin;

  if (isStandalone) {
    return (
      <>
        {children}
        <ScrollToTop />
      </>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <AppSplash />
      <Header />
      {/* has-tabbar reserves room for the fixed mobile tab bar. */}
      <main className="has-tabbar flex-1 pt-[4.25rem]">{children}</main>
      <Footer />
      <ScrollToTop />
      <BottomTabBar />
    </div>
  );
}
