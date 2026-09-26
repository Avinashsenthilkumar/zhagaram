import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "zhagaram:install-dismissed";

/**
 * Registers the service worker and offers "Add to Home Screen".
 *
 * Registration is what turns the site into an installable app and is also what
 * makes repeat visits fast -- the worker serves the shell and product images
 * from cache. In dev it actively unregisters instead, because a stale worker
 * intercepting Vite's module requests is a miserable thing to debug.
 */
export function PwaProvider() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    // Escape hatch: visiting any page with ?sw=off tears the worker down and
    // empties its caches. A service worker that has cached a broken deploy is
    // otherwise very hard to clear from a phone, and "it's still blank after
    // you fixed it" is almost always a stale worker. Dev always unregisters.
    const killSwitch =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("sw") === "off";

    if (import.meta.env.DEV || killSwitch) {
      void navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => undefined);

      if (killSwitch && typeof caches !== "undefined") {
        void caches
          .keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .catch(() => undefined);
      }
      return;
    }

    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    };

    // Registering after load keeps the worker off the critical path.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = true;
    }
    if (dismissed) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      // Let the person look around first rather than interrupting on arrival.
      setTimeout(() => setVisible(true), 6000);
    };

    const onInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setVisible(false);
    setInstallEvent(null);
  }

  if (!visible || !installEvent) return null;

  return (
    <div
      className="fixed inset-x-3 z-[95] lg:hidden"
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
      role="dialog"
      aria-label="Install app"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white/95 p-3 shadow-[0_12px_40px_rgba(16,37,27,0.18)] backdrop-blur-xl">
        <img src="/icons/icon-192.png" alt="" className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#0B2D5B]">Install ZHAGARAM EXIM</p>
          <p className="truncate text-xs text-[#6B7280]">Full screen, works offline</p>
        </div>
        <button
          type="button"
          onClick={() => void install()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0B2D5B] px-3.5 py-2.5 text-xs font-semibold text-white"
        >
          <Download className="size-3.5" />
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="inline-grid size-8 shrink-0 place-items-center rounded-lg text-[#6B7280]"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
