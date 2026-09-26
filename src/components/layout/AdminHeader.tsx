import { RefreshCw, LogOut } from "lucide-react";

export function AdminHeader({
  email,
  onRefresh,
  refreshing,
  onSignOut,
}: {
  email?: string | null;
  onRefresh: () => void;
  refreshing: boolean;
  onSignOut: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#dbe5dc] bg-white">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        
        {/* Logo + Admin Details */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 shrink-0 items-center rounded-md bg-white px-2">
            <img
              loading="lazy"
              decoding="async"
              src="/logo.png"
              alt="ZHAGARAM EXIM LLP"
              className="h-9 w-auto object-contain"
            />
          </div>

          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-[#123d2b]">
              Admin Dashboard
            </p>

            <p className="truncate text-xs text-slate-500">
              {email || "Administrator"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-[#c9d8cc] px-3 py-2 text-sm font-semibold text-[#123d2b] transition hover:bg-[#edf4ee] disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />

            <span className="hidden sm:inline">
              {refreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            <LogOut size={16} />

            <span className="hidden sm:inline">
              Sign out
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}