import { FormEvent, useEffect, useState } from "react";
import { LogoSpinner } from "@/components/common/LogoSpinner";
import { Star, X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

import type { Product } from "@/types/product";
import { apiUrl } from "@/lib/api-url";
import { cachedJson } from "@/lib/api-cache";

type Testimonial = {
  id: string;
  name: string;
  rating: number;
  content: string;
  role?: string | null;
  productName?: string | null;
};

type ReviewResponse = {
  success: boolean;
  message?: string;
};

export function ProductReviews({
  product,
}: {
  product: Product;
}) {
  /*
   * Testimonials shown on the product page.
   * These come from the real testimonial API.
   */
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    [],
  );

  /*
   * Review modal state.
   */
  const [open, setOpen] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [reviewerName, setReviewerName] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /*
   * Load real testimonials.
   *
   * IMPORTANT:
   * Display API:
   * GET /api/testimonials
   *
   * Review submission API remains:
   * POST /api/products/:slug/reviews
   */
 useEffect(() => {
  let active = true;

  const loadTestimonials = async () => {
    try {
      const result = await cachedJson<{
        success: boolean;
        data?: Testimonial[];
      }>("/api/testimonials");

      if (active && result.success) {
        setTestimonials(result.data ?? []);
      }
    } catch {
      if (active) {
        setTestimonials([]);
      }
    }
  };

  void loadTestimonials();

  return () => {
    active = false;
  };
}, []);

  function resetReviewForm() {
    setRating(0);
    setHoverRating(0);
    setReviewerName("");
    setTitle("");
    setComment("");
    setMessage("");
  }

  function closeModal() {
    if (submitting) {
      return;
    }

    setOpen(false);
    resetReviewForm();
  }

  async function submitReview(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!reviewerName.trim() || !rating || submitting) {
      return;
    }

    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch(
        apiUrl(`/api/products/${encodeURIComponent(product.slug)}/reviews`),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reviewerName: reviewerName.trim(),
            rating,
            title: title.trim(),
            comment: comment.trim(),
          }),
        },
      );

      const result =
        (await response.json()) as ReviewResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to submit review.",
        );
      }

      /*
       * Review needs admin approval before it appears
       * in the public testimonial API.
       */
      setReviewerName("");
      setTitle("");
      setComment("");
      setRating(0);
      setHoverRating(0);

      setMessage(
        "Thank you! Your review has been submitted and is waiting for approval.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit review.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* =========================================================
          CUSTOMER REVIEWS
      ========================================================= */}
      <div className="mt-12 border-t border-border pt-10 sm:mt-16 sm:pt-12">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Customer feedback
            </p>

            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Customer Reviews
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              See what our customers say about their experience.
            </p>
          </div>

          {/* Write Review */}
          <button
            type="button"
            onClick={() => {
              setMessage("");
              setOpen(true);
            }}
            className="inline-flex w-fit shrink-0 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Write a Review
          </button>
        </div>

        {/* =======================================================
            TESTIMONIAL SWIPER
        ======================================================== */}
        <div className="mt-8">
  {testimonials.length > 0 ? (
    <Swiper
      modules={[Autoplay, Pagination]}
      spaceBetween={18}
      slidesPerView={1}
      grabCursor
      loop={testimonials.length > 1}
      autoplay={{
        delay: 4500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }}
      pagination={{
        clickable: true,
      }}
      breakpoints={{
        0: {
          slidesPerView: 1,
          spaceBetween: 14,
        },
        768: {
          slidesPerView: 2,
          spaceBetween: 18,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 20,
        },
      }}
      className="customer-review-swiper !pb-12"
    >
      {testimonials.map((testimonial) => (
        <SwiperSlide
          key={testimonial.id}
          className="!h-auto"
        >
          <article
            className="
              group
              relative
              flex
              h-full
              min-h-[300px]
              flex-col
              overflow-hidden
              rounded-[22px]
              border
              border-[#dbe4ee]
              bg-white
              p-6
              shadow-[0_10px_35px_rgba(8,42,82,0.07)]
              transition-all
              duration-300
              hover:-translate-y-1
              hover:border-[#c8d7e8]
              hover:shadow-[0_18px_45px_rgba(8,42,82,0.12)]
              sm:p-7
            "
          >
            {/* Soft navy background decoration */}
            <div
              className="
                pointer-events-none
                absolute
                right-0
                top-0
                h-28
                w-40
                rounded-bl-[100%]
                bg-gradient-to-bl
                from-[#edf4fb]
                to-transparent
                opacity-80
              "
            />

            {/* Gold decorative corner */}
            <div
              className="
                pointer-events-none
                absolute
                bottom-0
                right-0
                h-20
                w-28
                rounded-tl-[100%]
                border-l
                border-t
                border-[#dcae32]/40
                bg-[#f7f9fc]
              "
            />

            {/* Quote mark */}
            <div
              className="
                pointer-events-none
                absolute
                right-5
                top-4
                select-none
                font-serif
                text-6xl
                font-bold
                leading-none
                text-[#d9e7f6]
              "
            >
              “
            </div>

            {/* Rating */}
            <div
              className="
                relative
                z-10
                flex
                items-center
                gap-1
                text-[#dcae32]
              "
              aria-label={`${testimonial.rating} out of 5 stars`}
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`
                    size-[18px]
                    ${
                      index < testimonial.rating
                        ? "fill-current"
                        : "fill-transparent"
                    }
                  `}
                />
              ))}
            </div>

            {/* Product */}
            {testimonial.productName ? (
              <h4
                className="
                  relative
                  z-10
                  mt-5
                  line-clamp-1
                  text-base
                  font-semibold
                  text-[#0b315b]
                "
              >
                {testimonial.productName}
              </h4>
            ) : null}

            {/* Review */}
            <p
              className="
                relative
                z-10
                mt-4
                line-clamp-5
                text-[14px]
                leading-7
                text-[#5f6f82]
                sm:text-[15px]
              "
            >
              {testimonial.content}
            </p>

            {/* Divider */}
            <div
              className="
                relative
                z-10
                mt-auto
                pt-6
              "
            >
              <div className="mb-5 h-px bg-[#e4eaf1]" />

              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="
                    flex
                    size-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-[#e7f0fa]
                    text-base
                    font-bold
                    text-[#0b315b]
                  "
                >
                  {(testimonial.name || "V")
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </div>

                {/* Customer */}
                <div className="min-w-0">
                  <p
                    className="
                      truncate
                      text-sm
                      font-bold
                      text-[#0b315b]
                    "
                  >
                    {testimonial.name || "Verified customer"}
                  </p>

                  <p className="mt-0.5 text-xs text-[#7a8796]">
                    {testimonial.role || "Verified customer"}
                  </p>
                </div>
              </div>
            </div>

            {/* Gold accent line */}
            <div
              className="
                absolute
                bottom-0
                left-6
                h-[3px]
                w-12
                rounded-full
                bg-[#dcae32]
                transition-all
                duration-300
                group-hover:w-20
              "
            />
          </article>
        </SwiperSlide>
      ))}
    </Swiper>
  ) : (
    <div
      className="
        rounded-2xl
        border
        border-dashed
        border-[#cbd8e6]
        bg-white
        px-5
        py-10
        text-center
        text-sm
        text-[#64748b]
      "
    >
      No customer reviews available yet.
    </div>
  )}
</div>
      </div>

      {/* =========================================================
          WRITE REVIEW MODAL
      ========================================================= */}
      {open ? (
        <div
          className="fixed inset-0 z-[120] grid place-items-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Write a review"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-background shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  Customer review
                </p>

                <h3 className="mt-1 text-xl font-semibold">
                  Write a Review
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-card disabled:opacity-50"
                aria-label="Close review dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={submitReview}
              className="space-y-5 p-5 sm:p-6"
            >
              <p className="text-sm leading-6 text-muted-foreground">
                Share your experience with{" "}
                <span className="font-medium text-foreground">
                  {product.title}
                </span>
                . Your review will be published after approval.
              </p>

              {/* Rating */}
              <fieldset>
                <legend className="text-sm font-medium">
                  Rating
                </legend>

                <div
                  className="mt-2 flex gap-1"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {Array.from(
                    { length: 5 },
                    (_, index) => {
                      const value = index + 1;

                      const active =
                        value <=
                        (hoverRating || rating);

                      return (
                        <button
                          key={value}
                          type="button"
                          aria-label={`Rate ${value} star${
                            value === 1 ? "" : "s"
                          }`}
                          onMouseEnter={() =>
                            setHoverRating(value)
                          }
                          onFocus={() =>
                            setHoverRating(value)
                          }
                          onClick={() =>
                            setRating(value)
                          }
                          className="rounded-md p-1 text-accent transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent/40"
                        >
                          <Star
                            className={`size-8 sm:size-9 ${
                              active
                                ? "fill-current"
                                : ""
                            }`}
                          />
                        </button>
                      );
                    },
                  )}
                </div>

                {rating > 0 ? (
                  <p className="mt-1 text-sm font-medium text-accent">
                    {"★".repeat(rating)}{" "}
                    <span className="text-muted-foreground">
                      {rating} out of 5
                    </span>
                  </p>
                ) : null}
              </fieldset>

              {/* Review Title */}
              <label className="block text-sm font-medium">
                Your Name
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={reviewerName}
                  onChange={(event) => setReviewerName(event.target.value)}
                  placeholder="Enter your name"
                  className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>

              <label className="block text-sm font-medium">
                Review Title

                <input
                  required
                  value={title}
                  maxLength={120}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Give your review a short title"
                  className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>

              {/* Review Comment */}
              <label className="block text-sm font-medium">
                Your Review

                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  value={comment}
                  onChange={(event) =>
                    setComment(event.target.value)
                  }
                  placeholder="Tell us about your experience with this product..."
                  className="mt-2 w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>

              {/* Message */}
              {message ? (
                <div
                  className="rounded-lg bg-primary/5 px-4 py-3 text-sm text-primary"
                  role="status"
                >
                  {message}
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-card disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !reviewerName.trim() ||
                    !rating ||
                    !title.trim() ||
                    comment.trim().length < 10
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <LogoSpinner size="sm" label="Submitting review" className="scale-75" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                Your review will be reviewed before being published.
              </p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}