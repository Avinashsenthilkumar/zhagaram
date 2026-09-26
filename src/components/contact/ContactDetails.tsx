import { contactPlaceholders, companyCopy } from "@/data/site";
import { useSiteSettings } from "@/lib/site-settings";

type Row = { label: string; value: string; note?: string; href?: string };

/**
 * Contact block on /contact.
 *
 * Reads the owner's details from /admin/settings and falls back to
 * `contactPlaceholders` — the "To be published" copy — for anything not filled
 * in yet. So the page improves on its own the moment the owner saves a phone
 * number, with no code change and no redeploy.
 */
export function ContactDetails() {
  const settings = useSiteSettings();

  const placeholder = (label: string) =>
    contactPlaceholders.find((item) => item.label.toLowerCase() === label.toLowerCase());

  const rows: Row[] = [];

  const officeFallback = placeholder("Office");
  rows.push(
    settings.address
      ? { label: "Office", value: settings.address }
      : {
          label: "Office",
          value: officeFallback?.value ?? "",
          note: officeFallback?.note,
        },
  );

  const emailFallback = placeholder("Email");
  rows.push(
    settings.email
      ? { label: "Email", value: settings.email, href: `mailto:${settings.email}` }
      : { label: "Email", value: emailFallback?.value ?? "", note: emailFallback?.note },
  );

  const phoneFallback = placeholder("Phone");
  rows.push(
    settings.phone
      ? { label: "Phone", value: settings.phone, href: `tel:${settings.phone.replace(/[^\d+]/g, "")}` }
      : { label: "Phone", value: phoneFallback?.value ?? "", note: phoneFallback?.note },
  );

  if (settings.whatsapp) {
    rows.push({
      label: "WhatsApp",
      value: settings.whatsapp,
      href: `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`,
    });
  }

  // Only hedge about unpublished details while some really are unpublished.
  const everythingPublished = Boolean(settings.email && settings.phone);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        Get in touch
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">
        Enquiries welcome
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {companyCopy.intro}
        {everythingPublished
          ? ""
          : " Direct phone, email and WhatsApp will appear here once the business verifies them."}
      </p>
      <dl className="mt-8 space-y-5">
        {rows.map((item) => (
          <div key={item.label} className="border-b border-border pb-5">
            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 text-base font-medium" data-selectable>
              {item.href ? (
                <a href={item.href} className="underline-offset-2 transition hover:underline">
                  {item.value}
                </a>
              ) : (
                item.value
              )}
            </dd>
            {item.note ? <dd className="mt-1 text-sm text-muted-foreground">{item.note}</dd> : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
