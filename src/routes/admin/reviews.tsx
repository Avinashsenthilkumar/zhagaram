import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Inbox, RotateCcw, ShieldCheck, Star, Trash2 } from "lucide-react";
import { z } from "zod";
import { apiResourceUrl, apiUrl } from "@/lib/api";
const reviewStatusSchema = z.enum(["PENDING", "APPROVED", "DECLINED"]);
type ReviewStatus = z.infer<typeof reviewStatusSchema>;

export const Route = createFileRoute("/admin/reviews")({
  validateSearch: z.object({ status: reviewStatusSchema.optional() }),
  component: ReviewModeration,
});

type AdminReview = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  reviewedAt: string | null;
  // Reviews do not require an account, so most rows have `user: null` and the
  // name the visitor typed lives here. Leaving it out of the type meant the
  // moderation list showed every guest review as "Verified customer" -- the
  // admin could not tell submissions apart.
  reviewerName: string | null;
  user: { id: string; name: string | null; email: string } | null;
  product: { id: string; name: string; slug: string; image: string | null } | null;
};

type ApiResult<T> = { success: boolean; data?: T; message?: string };

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  // `...options` has to come BEFORE `headers`, otherwise it re-applies
  // `options.headers` over the merged object and throws away the
  // Content-Type this helper just set.
  const response = await fetch(apiUrl(path), {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const result = (await response.json()) as ApiResult<T>;
  if (!response.ok || !result.success) throw new Error(result.message || "Request failed.");
  return result.data as T;
}

const tabs = [
  { key: null as ReviewStatus | null, label: "All" },
  { key: "PENDING" as const, label: "Pending" },
  { key: "APPROVED" as const, label: "Approved" },
  { key: "DECLINED" as const, label: "Declined" },
];

const statusStyles: Record<ReviewStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-800" },
  APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-800" },
  DECLINED: { label: "Declined", className: "bg-red-50 text-red-800" },
};

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function ReviewModeration() {
  const navigate = useNavigate();
  const { status } = Route.useSearch();

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadReviews() {
    const items = await api<AdminReview[]>("/api/admin/reviews");
    setReviews(items);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const session = await api<{ user: { role: string } }>("/api/auth/me");
        if (session.user.role !== "ADMIN") {
          if (active) await navigate({ to: "/403" });
          return;
        }
        if (!active) return;
        await loadReviews();
      } catch {
        if (active) await navigate({ to: "/login", search: { returnTo: "/admin/reviews" } });
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  async function runAction(action: () => Promise<void>, successMessage: string, reviewId: string) {
    setError("");
    setNotice("");
    setPendingId(reviewId);
    try {
      await action();
      await loadReviews();
      setNotice(successMessage);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update the review.");
    } finally {
      setPendingId(null);
    }
  }

  function moderate(review: AdminReview, nextStatus: ReviewStatus) {
    void runAction(
      () => api(`/api/admin/reviews/${review.id}/status`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) }).then(() => undefined),
      nextStatus === "APPROVED"
        ? "Review approved and published to the product page."
        : nextStatus === "DECLINED"
          ? "Review declined."
          : "Review moved back to pending.",
      review.id,
    );
  }

  function removeReview(review: AdminReview) {
    if (!window.confirm("Delete this review permanently? This cannot be undone.")) return;
    void runAction(() => api(`/api/admin/reviews/${review.id}`, { method: "DELETE" }).then(() => undefined), "Review deleted.", review.id);
  }

  const counts = {
    total: reviews.length,
    PENDING: reviews.filter((review) => review.status === "PENDING").length,
    APPROVED: reviews.filter((review) => review.status === "APPROVED").length,
    DECLINED: reviews.filter((review) => review.status === "DECLINED").length,
  };
  const filtered = status ? reviews.filter((review) => review.status === status) : reviews;

  if (isLoading) {
    return <div className="grid min-h-[50vh] place-items-center text-sm text-slate-600">Loading reviews...</div>;
  }

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b7b18]">ZHAGARAM EXIM</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Review moderation</h1>
        <p className="mt-1 text-sm text-slate-600">Approve or decline customer feedback before it appears on product pages.</p>
      </header>

      {notice ? <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}
      {error ? <p className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle size={16} />{error}</p> : null}

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = status === tab.key;
          const count = tab.key ? counts[tab.key] : counts.total;
          const inner = (
            <>
              {tab.label}
              <span className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? "bg-white/20 text-white" : "bg-[#edf4ee] text-[#075333]"}`}>{count}</span>
            </>
          );
          return tab.key ? (
            <Link
              key={tab.key}
              to="/admin/reviews"
              search={{ status: tab.key }}
              className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-[#123d2b] text-white" : "border border-[#dbe5dc] bg-white text-[#123d2b] hover:border-[#9ab7a2]"}`}
            >
              {inner}
            </Link>
          ) : (
            <Link
              key="ALL"
              to="/admin/reviews"
              className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-[#123d2b] text-white" : "border border-[#dbe5dc] bg-white text-[#123d2b] hover:border-[#9ab7a2]"}`}
            >
              {inner}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="grid min-h-[40vh] place-items-center rounded-2xl border border-dashed border-[#c9d8cc] bg-white px-6 py-16 text-center">
          <div>
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#edf4ee] text-[#075333]">
              <Inbox size={22} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#123d2b]">No reviews here</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
              {status
                ? `There are no ${status.toLowerCase()} reviews right now. Customer submissions will show up here for moderation.`
                : "No reviews have been submitted yet. Once customers leave feedback, it will appear here."}
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              busy={pendingId === review.id}
              onModerate={(nextStatus) => moderate(review, nextStatus)}
              onDelete={() => removeReview(review)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewCard({ review, busy, onModerate, onDelete }: { review: AdminReview; busy: boolean; onModerate: (status: ReviewStatus) => void; onDelete: () => void }) {
  const product = review.product;
  const badge = statusStyles[review.status];
  return (
    <li className="rounded-2xl border border-[#dbe5dc] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-0.5 text-[#d4a017]" aria-label={`${review.rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className={`size-4 ${index < review.rating ? "fill-current" : "text-slate-300"}`} />
          ))}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${badge.className}`}>{badge.label}</span>
        <span className="text-xs text-slate-500">{formatDate(review.createdAt)}</span>
      </div>

      <div className="mt-4 flex items-start gap-3">
        {product?.image ? (
          <img loading="lazy" decoding="async" src={apiResourceUrl(product.image) ?? ""} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#edf4ee] text-sm font-semibold text-[#075333]">{product?.name?.charAt(0)?.toUpperCase() || "R"}</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="font-semibold text-[#123d2b]">{review.title}</h2>
            {product ? (
              <Link to="/products/$slug" params={{ slug: product.slug }} className="text-xs text-slate-500 underline-offset-2 hover:text-[#075333] hover:underline">
                {product.name}
              </Link>
            ) : null}
          </div>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-600">{review.comment}</p>
          <p className="mt-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600">{review.reviewerName || review.user?.name || "Verified customer"}</span>
            {review.user?.email ? <span> · {review.user.email}</span> : <span> · guest</span>}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {review.status !== "APPROVED" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onModerate("APPROVED")}
            className="inline-flex items-center gap-2 rounded-lg bg-[#075333] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#064229] disabled:cursor-wait disabled:opacity-60"
          >
            <ShieldCheck size={16} /> {review.status === "DECLINED" ? "Re-approve" : "Approve"}
          </button>
        ) : null}
        {review.status !== "DECLINED" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onModerate("DECLINED")}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
          >
            Decline
          </button>
        ) : null}
        {review.status !== "PENDING" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onModerate("PENDING")}
            className="inline-flex items-center gap-2 rounded-lg border border-[#c9d8cc] px-4 py-2 text-sm font-semibold text-[#123d2b] transition hover:bg-[#edf4ee] disabled:cursor-wait disabled:opacity-60"
          >
            <RotateCcw size={15} /> Back to pending
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
        >
          <Trash2 size={15} /> Delete
        </button>
      </div>
    </li>
  );
}