import { Container } from "@/components/common/Container";
import { companyCopy } from "@/data/site";

export function VisionMission() {
  return (
    <section className="bg-primary-dark py-20 text-primary-foreground sm:py-28">
      <Container>
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">

          {/* =================================
              OUR VISION
          ================================= */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Our Vision
            </p>

         <blockquote className="mt-6 text-lg leading-relaxed text-primary-foreground/80 sm:text-xl">
  {companyCopy.vision}
</blockquote>

            {/* Vision Image */}
            <div className="relative mt-10 overflow-hidden rounded-2xl">
              <img
                loading="lazy"
                decoding="async"
                src="/images/about/vision.jpg"
                alt="Aerial farmland at sunrise suggesting a global agricultural route. Illustrative imagery."
                className="aspect-[16/9] w-full object-cover"
              />

              {/* Route Line */}
              <svg
                className="pointer-events-none absolute inset-0 size-full"
                viewBox="0 0 800 450"
                aria-hidden
              >
                <path
                  className="route-line"
                  d="M40 340 C 180 300, 220 180, 360 200 S 560 320, 760 90"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="2"
                  opacity="0.85"
                />

                <circle
                  cx="40"
                  cy="340"
                  r="5"
                  fill="#D4AF37"
                />

                <circle
                  cx="760"
                  cy="90"
                  r="5"
                  fill="#FFFFFF"
                />
              </svg>
            </div>
          </div>

          {/* =================================
              OUR MISSION
          ================================= */}
          <div className="flex flex-col justify-end">

            {/* Mission Image */}
            <div className="relative mb-8 overflow-hidden rounded-2xl">
              <img
                loading="lazy"
                decoding="async"
                src="/images/about/mission.png"
                alt="Young agricultural plant growing in fertile soil, representing sustainable growth and trusted sourcing. Illustrative imagery."
                className="aspect-[16/9] w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              />

              {/* Image Overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary-dark/20 via-transparent to-transparent" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Our Mission
            </p>

            <p className="mt-6 text-lg leading-relaxed text-primary-foreground/80 sm:text-xl">
              {companyCopy.mission}
            </p>

          </div>

        </div>
      </Container>
    </section>
  );
}