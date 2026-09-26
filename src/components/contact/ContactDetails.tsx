import { contactPlaceholders, companyCopy } from "@/data/site";

export function ContactDetails() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        Get in touch
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">
        Enquiries welcome
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {companyCopy.intro} Direct phone, email and WhatsApp will appear here once the
        business verifies them.
      </p>
      <dl className="mt-8 space-y-5">
        {contactPlaceholders.map((item) => (
          <div key={item.label} className="border-b border-border pb-5">
            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 text-base font-medium" data-selectable>
              {item.value}
            </dd>
            <dd className="mt-1 text-sm text-muted-foreground">{item.note}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
