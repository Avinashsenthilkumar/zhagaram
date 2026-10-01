import { useSiteSettings } from "@/lib/site-settings";

/** Used when the owner has not set a WhatsApp number in /admin/settings. */
const FALLBACK_NUMBER = "919385356697";

export function WhatsAppButton() {
  const settings = useSiteSettings();

  // wa.me wants digits only, with the country code and no "+" or spaces.
  // Whatever the owner types ("+91 93853 56697", "093853 56697") is normalised
  // here, and a 10-digit Indian number gets the 91 prefix it needs.
  const digits = (settings.whatsapp ?? "").replace(/\D/g, "");
  const normalised = digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, "");
  const phoneNumber = normalised.length >= 11 ? normalised : FALLBACK_NUMBER;

  const message = encodeURIComponent(
    `Hello ${settings.companyName}, I would like to know more about your products and export services.`
  );

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${settings.companyName} on WhatsApp`}
      title="Chat with us on WhatsApp"
      // bottom-40 / right-10: the same right-hand column as ScrollToTop
      // (right-10 bottom-25), stacked above it, and clear of the mobile tab bar
      // which is 4.25rem tall. The original bottom-6 right-6 put this button
      // underneath both.
      className="
        fixed
        bottom-40
        right-10
        z-[90]
        flex
        size-14
        items-center
        justify-center
        rounded-full
        bg-[#25D366]
        text-white
        shadow-[0_8px_30px_rgba(0,0,0,0.18)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:scale-105
        hover:bg-[#20bd5a]
        focus:outline-none
        focus:ring-4
        focus:ring-[#25D366]/30
        sm:bottom-8
        sm:right-8
      "
    >
      <img
        loading="lazy"
        decoding="async"
        src="/images/common/whatsapp-icon.svg"
        alt=""
        aria-hidden="true"
        className="size-7 shrink-0 object-contain"
      />

      {/* Notification dot */}
      <span
        className="
          absolute
          right-0
          top-0
          size-3
          rounded-full
          border-2
          border-white
          bg-primary
        "
        aria-hidden="true"
      />
    </a>
  );
}
