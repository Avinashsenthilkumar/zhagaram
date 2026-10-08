import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteShell } from "@/components/layout/SiteShell";
import { PwaProvider } from "@/components/common/PwaProvider";
import { ThemeController } from "@/components/common/ThemeController";
import { NotFound } from "@/components/common/NotFound";
import { pageTitle, pageDescription } from "@/lib/metadata";
import appCss from "../styles.css?url";
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        /*
         * `maximum-scale=5` stays: pinch-zoom is an accessibility right, and
         * clamping it to 1 is the wrong way to stop the form zoom -- iOS
         * ignores it for focus zoom anyway on recent versions, and it breaks
         * zoom for everyone else. The focus zoom is fixed properly in
         * styles.css, by keeping every form control at 16px or larger.
         *
         * `interactive-widget=resizes-content` makes the layout viewport
         * shrink when the on-screen keyboard appears, so a focused field is
         * scrolled into the remaining space instead of being covered by the
         * keyboard.
         */
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5, interactive-widget=resizes-content",
      },
      { title: pageTitle() },
      { name: "description", content: pageDescription() },
      { name: "theme-color", content: "#0B2D5B" },
      // iOS still needs its own tags to run full-screen from the home screen.
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "ZHAGARAM" },
      { name: "format-detection", content: "telephone=no" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
    ],
  }),
  notFoundComponent: NotFound,
  component: RootDocument,
});

function RootDocument() {
  return (
    <html
      lang="en"
      className="antialiased"
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>

      <body className="overflow-x-clip" suppressHydrationWarning>
        <PreviewHostBridge />
        <PwaProvider />
        <ThemeController />

        <AuthProvider>
          <SiteShell>
            <Outlet />
          </SiteShell>
        </AuthProvider>


        <Scripts />
      </body>
    </html>
  );
}
