import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Check, Image as ImageIcon, Loader2, Lock, Moon, Palette, Sun, Trash2 } from "lucide-react";

import { apiUrl } from "@/lib/api-url";
import { compressImageFile, formatBytes } from "@/lib/image-compress";
import { setSiteSettings, type SiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

type ApiResult<T> = { success: boolean; data?: T; message?: string };

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const result = (await response.json()) as ApiResult<T>;
  if (!response.ok || !result.success) throw new Error(result.message || "Request failed.");
  return result.data as T;
}

/** Everything the form edits, as strings — empty string means "not set". */
type Form = {
  companyName: string;
  shortName: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  linkedin: string;
  instagram: string;
  facebook: string;
  theme: "light" | "dark";
};

const emptyForm: Form = {
  companyName: "",
  shortName: "",
  tagline: "",
  description: "",
  phone: "",
  email: "",
  address: "",
  whatsapp: "",
  linkedin: "",
  instagram: "",
  facebook: "",
  theme: "light",
};

function toForm(settings: SiteSettings): Form {
  return {
    companyName: settings.companyName ?? "",
    shortName: settings.shortName ?? "",
    tagline: settings.tagline ?? "",
    description: settings.description ?? "",
    phone: settings.phone ?? "",
    email: settings.email ?? "",
    address: settings.address ?? "",
    whatsapp: settings.whatsapp ?? "",
    linkedin: settings.linkedin ?? "",
    instagram: settings.instagram ?? "",
    facebook: settings.facebook ?? "",
    theme: settings.theme === "dark" ? "dark" : "light",
  };
}

function SettingsPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<Form>(emptyForm);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [newLogo, setNewLogo] = useState<{ data: string; mimeType: string } | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const settings = await api<SiteSettings>("/api/admin/settings");
        if (!active) return;
        setForm(toForm(settings));
        setCurrentLogo(settings.logo ?? null);
      } catch (loadError) {
        // requireAdmin answers 401/403; anything else is a real failure worth showing.
        const message = loadError instanceof Error ? loadError.message : "";
        if (/unauthor/i.test(message)) {
          if (active) await navigate({ to: "/login", search: { returnTo: "/admin/settings" } });
          return;
        }
        if (/forbidden/i.test(message)) {
          if (active) await navigate({ to: "/403" });
          return;
        }
        if (active) setError(message || "Unable to load settings.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);

    try {
      // Only send logo fields when the owner actually changed the logo, so an
      // ordinary save of the contact details cannot wipe it.
      const logoPayload = newLogo
        ? { logoData: newLogo.data, logoMimeType: newLogo.mimeType }
        : removeLogo
          ? { logoData: null, logoMimeType: null }
          : {};

      const settings = await api<SiteSettings>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ ...form, ...logoPayload }),
      });

      setForm(toForm(settings));
      setCurrentLogo(settings.logo ?? null);
      setNewLogo(null);
      setRemoveLogo(false);
      // Push the saved values straight into the shared store. The header logo,
      // the company name and the theme all update immediately — no reload, and
      // no second request, because the PATCH response is the new state.
      setSiteSettings(settings);
      setNotice("Settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-sm text-slate-600">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" /> Loading settings…
        </span>
      </div>
    );
  }

  const logoPreview = newLogo?.data ?? (removeLogo ? null : currentLogo);

  return (
    <div className="pb-16">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b7b18]">ZHAGARAM EXIM</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Your brand, contact details and account. Changes go live on the public site as soon as you save.
        </p>
      </header>

      {notice ? (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Check size={16} /> {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} /> {error}
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={save}>
        <Card title="Brand" description="The name and wording used across the site, emails and browser tab.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" value={form.companyName} onChange={(value) => update("companyName", value)} required />
            <Field label="Short name" value={form.shortName} onChange={(value) => update("shortName", value)} hint="Used where space is tight, e.g. the app icon." />
            <div className="sm:col-span-2">
              <Field label="Tagline" value={form.tagline} onChange={(value) => update("tagline", value)} />
            </div>
            <div className="sm:col-span-2">
              <TextArea label="Description" value={form.description} onChange={(value) => update("description", value)} hint="Shown to search engines and when the site is shared." />
            </div>
          </div>
        </Card>

        <Card title="Logo" description="Replaces the mark in the header, the footer and the admin bar. JPEG, PNG, WebP or SVG, up to 3 MB.">
          <LogoField
            preview={logoPreview}
            onPick={(data, mimeType) => {
              setNewLogo({ data, mimeType });
              setRemoveLogo(false);
            }}
            onRemove={() => {
              setNewLogo(null);
              setRemoveLogo(true);
            }}
          />
        </Card>

        <Card title="Contact" description="Shown in the footer and on the contact page.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" value={form.phone} onChange={(value) => update("phone", value)} placeholder="+91 79040 06912" />
            <Field label="Email" value={form.email} onChange={(value) => update("email", value)} placeholder="sales@zhagaramexim.com" type="email" />
            <Field label="WhatsApp number" value={form.whatsapp} onChange={(value) => update("whatsapp", value)} placeholder="+91 79040 06912" />
            <Field label="LinkedIn URL" value={form.linkedin} onChange={(value) => update("linkedin", value)} placeholder="https://linkedin.com/company/…" />
            <Field label="Instagram URL" value={form.instagram} onChange={(value) => update("instagram", value)} placeholder="https://instagram.com/…" />
            <Field label="Facebook URL" value={form.facebook} onChange={(value) => update("facebook", value)} placeholder="https://facebook.com/…" />
            <div className="sm:col-span-2">
              <TextArea label="Address" value={form.address} onChange={(value) => update("address", value)} />
            </div>
          </div>
        </Card>

        <Card title="Appearance" description="Controls the admin console today. The public site follows in the next update.">
          <div className="flex flex-wrap gap-3">
            <ThemeChoice active={form.theme === "light"} icon={<Sun size={16} />} label="Light" onClick={() => update("theme", "light")} />
            <ThemeChoice active={form.theme === "dark"} icon={<Moon size={16} />} label="Dark" onClick={() => update("theme", "dark")} />
          </div>
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#123d2b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0e3122] disabled:cursor-wait disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {isSaving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>

      <PasswordCard />
    </div>
  );
}

/* ---------------------------------------------------------------- password */

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");

    if (newPassword.length < 8) {
      setError("The new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The two new passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await api<{ updated: boolean }>("/api/admin/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Password changed. It applies the next time you sign in.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to change the password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-6" onSubmit={submit}>
      <Card
        title="Change password"
        description="You need your current password. Everyone stays signed in — existing sessions are not ended."
        icon={<Lock size={16} />}
      >
        {notice ? (
          <p className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <Check size={16} /> {notice}
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={16} /> {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" required autoComplete="current-password" />
          <Field label="New password" value={newPassword} onChange={setNewPassword} type="password" required autoComplete="new-password" hint="At least 8 characters." />
          <Field label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} type="password" required autoComplete="new-password" />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-[#c9d8cc] bg-white px-5 py-2.5 text-sm font-semibold text-[#123d2b] transition hover:bg-[#edf4ee] disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {busy ? "Changing…" : "Change password"}
          </button>
        </div>
      </Card>
    </form>
  );
}

/* ------------------------------------------------------------------ pieces */

function Card({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#dbe5dc] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#123d2b]">
          {icon} {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  hint,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#075333] focus:ring-2 focus:ring-[#075333]/15"
      />
      {hint ? <span className="mt-1.5 block text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#075333] focus:ring-2 focus:ring-[#075333]/15"
      />
      {hint ? <span className="mt-1.5 block text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}

function ThemeChoice({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
        active
          ? "border-[#123d2b] bg-[#123d2b] text-white"
          : "border-[#dbe5dc] bg-white text-[#123d2b] hover:border-[#9ab7a2]"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function LogoField({
  preview,
  onPick,
  onRemove,
}: {
  preview: string | null;
  onPick: (data: string, mimeType: string) => void;
  onRemove: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [problem, setProblem] = useState("");

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setProblem("");
    setNote("");

    try {
      if (file.type === "image/svg+xml") {
        // An SVG must NOT go through the raster compressor — that would rasterise
        // it and throw away the reason to use a vector in the first place.
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result ?? ""));
          reader.onerror = () => reject(new Error("Could not read that file."));
          reader.readAsDataURL(file);
        });
        if (file.size > 3 * 1024 * 1024) throw new Error("The logo must be smaller than 3 MB.");
        onPick(dataUrl, "image/svg+xml");
        setNote(`SVG, ${formatBytes(file.size)}.`);
      } else {
        const result = await compressImageFile(file);
        onPick(result.dataUrl, result.mimeType);
        setNote(
          result.compressedBytes < result.originalBytes
            ? `Optimised ${formatBytes(result.originalBytes)} → ${formatBytes(result.compressedBytes)}.`
            : formatBytes(result.compressedBytes),
        );
      }
    } catch (fileError) {
      setProblem(fileError instanceof Error ? fileError.message : "Could not read that image.");
    } finally {
      setBusy(false);
      // Let the same file be chosen again after a failure.
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#dbe5dc] bg-[#f7faf8]">
        {preview ? (
          <img src={preview} alt="Logo preview" className="size-full object-contain p-2" />
        ) : (
          <ImageIcon className="size-7 text-slate-300" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#c9d8cc] bg-white px-4 py-2.5 text-sm font-semibold text-[#123d2b] transition hover:bg-[#edf4ee]">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Palette size={16} />}
            {busy ? "Reading…" : preview ? "Replace logo" : "Upload logo"}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => void handleFile(event)} />
          </label>

          {preview ? (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              <Trash2 size={16} /> Remove
            </button>
          ) : null}
        </div>

        {note ? <p className="mt-2 text-xs text-slate-500">{note}</p> : null}
        {problem ? <p className="mt-2 text-xs text-red-700">{problem}</p> : null}
        <p className="mt-2 text-xs text-slate-500">
          Nothing is uploaded until you press <strong>Save settings</strong>.
        </p>
      </div>
    </div>
  );
}
