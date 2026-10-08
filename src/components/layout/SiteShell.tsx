import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
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
      {/*
        `pt-header` and `has-tabbar` both come from styles.css and read the
        --header-offset / --tabbar-offset variables, which include the iPhone's
        safe-area insets. The old `pt-[4.25rem]` was a hard-coded guess that
        disagreed with the header's own `h-16` by 4px and knew nothing about
        the notch.
      */}
      <main className="pt-header has-tabbar flex-1">{children}</main>
      <Footer />
      <ScrollToTop />
      <WhatsAppButton />
      <BottomTabBar />
    </div>
  );
}
