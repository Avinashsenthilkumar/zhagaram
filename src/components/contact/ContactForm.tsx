import { useEffect, useState } from "react";

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

  function update(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
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
      <div className="rounded-2xl bg-card p-8 shadow-[var(--shadow-border)]">
        <h2 className="text-2xl font-semibold tracking-tight">Enquiry recorded</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thank you for your enquiry. Your request has been submitted successfully. Our team will review the details and get back to you.
        </p>
        <button
          type="button"
          className="mt-6 text-sm font-medium text-primary hover:underline"
          onClick={() => setStatus("idle")}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-8"
    >
      <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description ?? formNotice}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {isSupplier ? (
          <>
            <Field id="name" label="Name" value={values.name ?? ""} error={errors.name} onChange={(v) => update("name", v)} />
            <Field id="email" label="Email" type="email" value={values.email ?? ""} error={errors.email} onChange={(v) => update("email", v)} />
            <Field id="phone" label="Phone Number" type="tel" value={values.phone ?? ""} error={errors.phone} onChange={(v) => update("phone", v)} />
            <Field id="gstNumber" label="GST Number" value={values.gstNumber ?? ""} error={errors.gstNumber} onChange={(v) => update("gstNumber", v)} />
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
              >
                <option value="">Select a category</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.product ? <ErrorText>{errors.product}</ErrorText> : null}
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
                className={cn(inputClass(Boolean(errors.message)), "min-h-32 py-3")}
                aria-invalid={Boolean(errors.message)}
              />
              {errors.message ? <ErrorText>{errors.message}</ErrorText> : null}
            </div>
          </>
        ) : (
          <>
          <Field id="name" label="Name" value={values.name ?? ""} error={errors.name} onChange={(v) => update("name", v)} />
<Field id="company" label="Company Name (optional)" value={values.company ?? ""} error={errors.company} onChange={(v) => update("company", v)} />
<Field id="email" label="Email" type="email" value={values.email ?? ""} error={errors.email} onChange={(v) => update("email", v)} />
<Field id="phone" label="Phone" type="tel" value={values.phone ?? ""} error={errors.phone} onChange={(v) => update("phone", v)} />
<Field id="country" label="Country (optional)" value={values.country ?? ""} error={errors.country} onChange={(v) => update("country", v)} />
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
              >
                <option value="">Select a category</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.product ? <ErrorText>{errors.product}</ErrorText> : null}
            </div>
            <Field id="quantity" label="Quantity" value={values.quantity ?? ""} error={errors.quantity} onChange={(v) => update("quantity", v)} />
            <div className="sm:col-span-2">
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
                Description
              </label>
              <textarea
                id="message"
                rows={5}
                value={values.message ?? ""}
                onChange={(e) => update("message", e.target.value)}
                className={cn(inputClass(Boolean(errors.message)), "min-h-32 py-3")}
                aria-invalid={Boolean(errors.message)}
              />
              {errors.message ? <ErrorText>{errors.message}</ErrorText> : null}
            </div>
          </>
        )}
      </div>

      {status === "error" ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {errorMessage || "We couldn't send your enquiry right now. Please try again."}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  className?: string;
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
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
    </div>
  );
}

function inputClass(invalid: boolean) {
  return cn(
    "h-11 w-full rounded-md bg-background px-3 text-sm shadow-[var(--shadow-border)] outline-none transition-[box-shadow] duration-150 focus-visible:shadow-[0_0_0_3px_rgb(30_71_56/0.25)]",
    invalid && "shadow-[0_0_0_1px_rgb(159_46_46)]",
  );
}

function ErrorText({ children }: { children: string }) {
  return (
    <p className="mt-1 text-xs text-red-800" role="alert">
      {children}
    </p>
  );
}
