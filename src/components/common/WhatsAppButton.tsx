export function WhatsAppButton() {
  const phoneNumber = "919XXXXXXXXX";

  const message = encodeURIComponent(
    "Hello ZHAGARAM EXIM LLP, I would like to know more about your products and export services."
  );

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with ZHAGARAM EXIM LLP on WhatsApp"
      title="Chat with us on WhatsApp"
      className="
        fixed
        bottom-6
        right-6
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
