import { useEffect, useState } from "react";

const SESSION_KEY = "zhagaram:splash-shown";

/**
 * App-style boot splash.
 *
 * Native apps show a branded screen while they start; the web equivalent is a
 * short overlay on first paint. It is shown once per browser session so
 * navigating around the site never triggers it again.
 *
 * Rendered only after mount, so SSR output is unchanged and the page is fully
 * usable even if JavaScript never runs.
 */
export function AppSplash() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Private mode or blocked storage: just skip the splash.
      seen = true;
    }
    if (seen) return;

    setVisible(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }

    const fade = setTimeout(() => setLeaving(true), 900);
    const hide = setTimeout(() => setVisible(false), 1350);
    return () => {
      clearTimeout(fade);
      clearTimeout(hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={[
        "fixed inset-0 z-[9999] grid place-items-center bg-[#f8f8f4]",
        "transition-opacity duration-450 ease-out",
        leaving ? "pointer-events-none opacity-0" : "opacity-100",
      ].join(" ")}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex flex-col items-center gap-5">
        <img
          src="/logo-mark.png"
          alt=""
          width={720}
          height={595}
          className="h-20 w-auto object-contain motion-safe:animate-[zhagaram-splash_1.1s_ease-out]"
        />
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#0B2D5B]">
          ZHAGARAM EXIM LLP
        </p>
        <span className="mt-1 block h-[3px] w-28 overflow-hidden rounded-full bg-[#0B2D5B]/10">
          <span className="block h-full w-1/3 rounded-full bg-[#F0B429] motion-safe:animate-[zhagaram-splash-bar_1.1s_ease-in-out_infinite]" />
        </span>
      </div>
    </div>
  );
}
