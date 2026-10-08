import { useEffect, useRef, useState } from "react";

import { formNotice } from "@/data/site";
import { LogoSpinner } from "@/components/common/LogoSpinner";
import { fetchCatalogCategories } from "@/lib/catalog-api";
import {
  customerEnquirySchema,
  productOptions,
  submitCustomerEnquiry,
  submitSupplierEnquiry,
  supplierEnquirySchema,
  type CustomerEnquiryInput,
  type SupplierEnquiryInput,
} from "@/lib/enquiry";
import { cn } from "@/lib/utils";

type FormVariant = "supplier" | "customer";

type FormValues = Record<string, string>;

const emptySupplier: SupplierEnquiryInput = {
  name: "",
  email: "",
  phone: "",
  gstNumber: "",
  product: "",
  message: "",
};

const emptyCustomer: CustomerEnquiryInput = {
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  product: "",
  quantity: "",
  message: "",
};

/**
 * The order fields appear in, used to decide which invalid field to scroll to
 * when a submit is rejected. Without this, submitting an incomplete form on a
 * phone changed nothing on screen -- the first error was often above the fold.
 */
const fieldOrder: Record<FormVariant, string[]> = {
  supplier: ["name", "email", "phone", "gstNumber", "product", "message"],
  customer: [
    "name",
    "company",
    "email",
    "phone",
    "country",
    "product",
    "quantity",
    "message",
  ],
};

export function ContactForm({
  heading = "Send an enquiry",
  description,
  variant = "customer",
  submitLabel = "Submit enquiry",
}: {
  heading?: string;
  description?: string;
  variant?: FormVariant;
  submitLabel?: string;
}) {
  const isSupplier = variant === "supplier";
  const schema = isSupplier ? supplierEnquirySchema : customerEnquirySchema;
  const emptyValues = isSupplier ? emptySupplier : emptyCustomer;

  const [values, setValues] = useState<FormValues>(emptyValues as FormValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  // The API says exactly what went wrong ("You can only send testing emails to
  // your own email address", a missing key, a rejected sender). The form used to
  // throw that away and print one fixed sentence, which turned every mail
  // problem into a guessing game.
  const [errorMessage, setErrorMessage] = useState("");
  const [categoryOptions, setCategoryOptions] = useState(productOptions);

  /*
   * ───────────────────────────────────────────────────────────────────────────
   * THE "AFTER I SUBMIT I ONLY SEE THE FOOTER" BUG
   * ───────────────────────────────────────────────────────────────────────────
   *
   * The success panel is roughly 200px tall; the form it replaces is closer to
   * 1,100px on a phone. To press Submit you had to be scrolled near the bottom
   * of the form, so the moment the panel swapped in, the document got ~900px
   * shorter while the scroll position stayed put. The browser clamped that
   * offset to the new maximum -- which is the bottom of the page -- so the
   * confirmation scrolled off the top and the footer was all that was left on
   * screen. Nothing was broken; you were simply parked below the message.
   *
   * Two fixes, both needed:
   *   1. `panelRef` is scrolled into view (and focused) as soon as the status
   *      flips, so the confirmation is what you are looking at.
   *   2. The panel carries a `min-h` close to the form's own height, so the
   *      collapse is gentle rather than a 900px jump.
   *
   * `scroll-margin-top` on the panel keeps it clear of the fixed header, and
   * the same treatment is applied to the error message, which used to be just
   * as easy to miss.
   */
  const panelRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    let active = true;
    void fetchCatalogCategories()
      .then((categories) => {
        if (!active || !categories.length) return;
        // Value = the readable name, because this string is what the enquiry
        // email shows. A slug ("edible-oils") is not a useful thing to email.
        setCategoryOptions([
          ...categories.map((category) => ({ value: category.name, label: category.name })),
          { value: "General enquiry", label: "General enquiry" },
        ]);
      })
      .catch(() => {
        // Keep the verified static catalogue as a fallback when the API is unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  // Bring the confirmation into view and move focus to it, so the result of
  // pressing Submit is both visible and announced.
  useEffect(() => {
    if (status !== "success") return;
    const node = panelRef.current;
    if (!node) return;

    node.scrollIntoView({ behavior: "smooth", block: "start" });
    // Focus after the scroll is queued; focusing first would make the browser
    // jump instantly and fight the smooth scroll.
    const id = window.setTimeout(() => node.focus({ preventScroll: true }), 220);
    return () => window.clearTimeout(id);
  }, [status]);

  // Same courtesy for a failed send: the message sits above the button, which
  // on a phone is often just off the top of the screen.
  useEffect(() => {
    if (status !== "error") return;
    errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [status, errorMessage]);

  function update(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear a field's error as soon as it is edited, so the form stops
    // shouting about something you are in the middle of fixing.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  }

  function focusFirstInvalid(invalid: Record<string, string>) {
    const first = fieldOrder[variant].find((field) => invalid[field]);
    if (!first) return;
    const node = formRef.current?.querySelector<HTMLElement>(`#${first}`);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    // `preventScroll` so focusing does not override the smooth scroll above,
    // and no auto-focus on touch, where it would throw the keyboard open over
    // the error you are trying to read.
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (!isTouch) node.focus({ preventScroll: true });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !next[field]) {
          next[field] = issue.message;
        }
      }
      setErrors(next);
      setStatus("idle");
      focusFirstInvalid(next);
      return;
    }

    setErrors({});
    setErrorMessage("");
    setStatus("submitting");

    try {
      if (isSupplier) {
        await submitSupplierEnquiry(parsed.data as SupplierEnquiryInput);
      } else {
        await submitCustomerEnquiry(parsed.data as CustomerEnquiryInput);
      }
      setStatus("success");
      setValues(emptyValues as FormValues);
    } catch (submitError) {
      setErrorMessage(submitError instanceof Error ? submitError.message : "");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        ref={panelRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={cn(
          "scroll-mt-[calc(var(--header-offset)_+_1rem)] rounded-2xl bg-card p-6 shadow-[var(--shadow-border)] outline-none sm:p-8",
          // Softens the collapse from form height to panel height, which is
          // what used to fling the page down to the footer.
          "flex min-h-[22rem] flex-col justify-center sm:min-h-[26rem]",
        )}
      >
        <span
          className="grid size-12 place-items-center rounded-full bg-primary/10 text-2xl text-primary"
          aria-hidden
        >
          ✓
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">
          Enquiry recorded
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Thank you for your enquiry. Your request has been submitted successfully. Our
          team will review the details and get back to you.
        </p>
        <button
          type="button"
          data-touch-target
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-dark sm:w-auto"
          onClick={() => setStatus("idle")}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)] sm:p-8"
    >
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{heading}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description ?? formNotice}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {isSupplier ? (
          <>
            <Field
              id="name"
              label="Name"
              value={values.name ?? ""}
              error={errors.name}
              onChange={(v) => update("name", v)}
              autoComplete="name"
              enterKeyHint="next"
            />
            <Field
              id="email"
              label="Email"
              type="email"
              value={values.email ?? ""}
              error={errors.email}
              onChange={(v) => update("email", v)}
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
            />
            <Field
              id="phone"
              label="Phone Number"
              type="tel"
              value={values.phone ?? ""}
              error={errors.phone}
              onChange={(v) => update("phone", v)}
              autoComplete="tel"
              inputMode="tel"
              enterKeyHint="next"
            />
            <Field
              id="gstNumber"
              label="GST Number"
              value={values.gstNumber ?? ""}
              error={errors.gstNumber}
              onChange={(v) => update("gstNumber", v)}
              autoCapitalize="characters"
              autoComplete="off"
              enterKeyHint="next"
            />
            <div>
              <label htmlFor="product" className="mb-1.5 block text-sm font-medium">
                Product
              </label>
              <select
                id="product"
                value={values.product ?? ""}
                onChange={(e) => update("product", e.target.value)}
                className={inputClass(Boolean(errors.product))}
                aria-invalid={Boolean(errors.product)}
                aria-describedby={errors.product ? "product-error" : undefined}
              >
                <option value="">Select a category</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.product ? <ErrorText id="product-error">{errors.product}</ErrorText> : null}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                value={values.message ?? ""}
                onChange={(e) => update("message", e.target.value)}
                className={cn(inputClass(Boolean(errors.message)), "h-auto min-h-32 py-3")}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
                enterKeyHint="enter"
              />
              {errors.message ? <ErrorText id="message-error">{errors.message}</ErrorText> : null}
            </div>
          </>
        ) : (
          <>
            <Field
              id="name"
              label="Name"
              value={values.name ?? ""}
              error={errors.name}
              onChange={(v) => update("name", v)}
              autoComplete="name"
              enterKeyHint="next"
            />
            <Field
              id="company"
              label="Company Name (optional)"
              value={values.company ?? ""}
              error={errors.company}
              onChange={(v) => update("company", v)}
              autoComplete="organization"
              enterKeyHint="next"
            />
            <Field
              id="email"
              label="Email"
              type="email"
              value={values.email ?? ""}
              error={errors.email}
              onChange={(v) => update("email", v)}
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
            />
            <Field
              id="phone"
              label="Phone"
              type="tel"
              value={values.phone ?? ""}
              error={errors.phone}
              onChange={(v) => update("phone", v)}
              autoComplete="tel"
              inputMode="tel"
              enterKeyHint="next"
            />
            <Field
              id="country"
              label="Country (optional)"
              value={values.country ?? ""}
              error={errors.country}
              onChange={(v) => update("country", v)}
              autoComplete="country-name"
              enterKeyHint="next"
            />
            <div>
              <label htmlFor="product" className="mb-1.5 block text-sm font-medium">
                Product
              </label>
              <select
                id="product"
                value={values.product ?? ""}
                onChange={(e) => update("product", e.target.value)}
                className={inputClass(Boolean(errors.product))}
                aria-invalid={Boolean(errors.product)}
                aria-describedby={errors.product ? "product-error" : undefined}
              >
                <option value="">Select a category</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.product ? <ErrorText id="product-error">{errors.product}</ErrorText> : null}
            </div>
            <Field
              id="quantity"
              label="Quantity"
              value={values.quantity ?? ""}
              error={errors.quantity}
              onChange={(v) => update("quantity", v)}
              autoComplete="off"
              enterKeyHint="next"
            />
            <div className="sm:col-span-2">
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
                Description
              </label>
              <textarea
                id="message"
                rows={5}
                value={values.message ?? ""}
                onChange={(e) => update("message", e.target.value)}
                className={cn(inputClass(Boolean(errors.message)), "h-auto min-h-32 py-3")}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
                enterKeyHint="enter"
              />
              {errors.message ? <ErrorText id="message-error">{errors.message}</ErrorText> : null}
            </div>
          </>
        )}
      </div>

      {status === "error" ? (
        <p
          ref={errorRef}
          className="mt-4 scroll-mt-[calc(var(--header-offset)_+_1rem)] rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage || "We couldn't send your enquiry right now. Please try again."}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        data-touch-target
        className={cn(
          "mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6",
          "text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60",
          // Full width under `sm`: a thumb-sized target is the point on a
          // phone, and a 140px button floating left of a full-width form reads
          // as unfinished.
          "w-full sm:w-auto",
        )}
      >
        {status === "submitting" ? (
          <>
            <LogoSpinner size="sm" label="Sending enquiry" className="scale-75" />
            Sending…
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  className,
  autoComplete,
  inputMode,
  enterKeyHint,
  autoCapitalize,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  className?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal" | "search" | "url";
  enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  autoCapitalize?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(Boolean(error))}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        // iOS shows the matching keyboard and offers autofill only when these
        // are present. Without them every field got the plain alphabet
        // keyboard and no saved-contact suggestions.
        autoComplete={autoComplete}
        inputMode={inputMode}
        enterKeyHint={enterKeyHint}
        autoCapitalize={autoCapitalize}
      />
      {error ? <ErrorText id={`${id}-error`}>{error}</ErrorText> : null}
    </div>
  );
}

function inputClass(invalid: boolean) {
  return cn(
    // `text-base` (16px), NOT `text-sm`.
    //
    // Under 16px, iOS Safari zooms the viewport the moment the field takes
    // focus and never zooms back out -- the "the form zooms when I tap it" bug.
    // styles.css enforces a 16px floor on top of this as a safety net; this
    // class is what keeps the markup honest about it.
    "h-12 w-full rounded-md bg-background px-3 text-base",
    "scroll-mt-[calc(var(--header-offset)_+_1rem)]",
    "shadow-[var(--shadow-border)] outline-none transition-[box-shadow] duration-150",
    "focus-visible:shadow-[0_0_0_3px_rgb(30_71_56/0.25)]",
    invalid && "shadow-[0_0_0_1px_rgb(159_46_46)]",
  );
}

function ErrorText({ children, id }: { children: string; id?: string }) {
  return (
    <p id={id} className="mt-1 text-xs text-red-800" role="alert">
      {children}
    </p>
  );
}
