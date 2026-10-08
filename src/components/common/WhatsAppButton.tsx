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
      data-touch-target
      /*
       * Positioned off the tab bar, not off a guessed pixel value.
       *
       * `bottom-40` (10rem) was measured by eye against a phone without a home
       * indicator: on an iPhone with one it floated oddly high, and `right-10`
       * (2.5rem) left it marooned in from the edge. It now sits one gap above
       * --tabbar-offset, which already includes env(safe-area-inset-bottom),
       * and `z-[80]` keeps it under the tab bar (z-[90]) rather than fighting
       * it for the same layer.
       */
      className="
        fixed
        bottom-[calc(var(--tabbar-offset)_+_1rem)]
        right-4
        z-[80]
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
        sm:right-6
        lg:bottom-8
        lg:right-8
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
