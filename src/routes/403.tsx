import { createFileRoute, Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";

export const Route = createFileRoute("/403")({
  component: ForbiddenPage,
});

function ForbiddenPage() {
  return (
    <main className="grid min-h-[70vh] bg-[#f5f7f2] px-6 py-20 text-[#18352a]">
      <div className="mx-auto my-auto w-full max-w-md rounded-2xl border border-[#dbe5dc] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-red-50 text-red-700">
          <LockKeyhole size={26} />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#9b7b18]">403 · Restricted</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#123d2b]">Access denied</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This area is reserved for the site owner. If you believe this is a mistake, please sign in with an administrator account.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-[#123d2b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d2f20]"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}