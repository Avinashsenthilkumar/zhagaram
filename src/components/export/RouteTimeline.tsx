import { Icon } from "@/components/common/Icon";
import { supplyRoute } from "@/data/supply-route";
import type { IconName } from "@/types/common";

export function RouteTimeline() {
  return (
    <div>
      {/* =========================================
          DESKTOP — MODERN PROCESS JOURNEY
      ========================================== */}
      <div className="hidden lg:block">
        <div className="relative">

          {/* Main connecting line */}
          <div
            className="absolute left-0 right-0 top-[27px] h-px bg-primary/15"
            aria-hidden
          />

          <ol className="relative grid grid-cols-6 gap-x-8 gap-y-14">
            {supplyRoute.map((step, index) => (
              <li
                key={step.id}
                className="group relative"
              >
                {/* Number + Icon */}
                <div className="relative z-10 flex items-center">
                  <div
                    className="
                      flex size-14 items-center justify-center
                      rounded-full
                      border border-primary/15
                      bg-card
                      text-primary
                      transition-all duration-300
                      group-hover:border-primary
                      group-hover:bg-primary
                      group-hover:text-primary-foreground
                    "
                  >
                    <Icon
                      name={step.icon as IconName}
                      className="size-5"
                    />
                  </div>

                  <span
                    className="
                      absolute left-1/2 top-1/2
                      -translate-x-1/2 -translate-y-1/2
                      text-[9px] font-bold
                      opacity-0
                      transition-opacity duration-300
                      group-hover:opacity-100
                    "
                  >
                    {String(step.id).padStart(2, "0")}
                  </span>
                </div>

                {/* Content */}
                <div className="mt-5 pr-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                    Step {String(step.id).padStart(2, "0")}
                  </p>

                  <h3 className="mt-2 text-sm font-semibold leading-snug tracking-tight text-foreground">
                    {step.title}
                  </h3>

                  {step.description ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  ) : null}
                </div>

                {/* Direction indicator */}
                {index < supplyRoute.length - 1 ? (
                  <span
                    className="
                      absolute left-[calc(100%+8px)] top-[27px]
                      text-primary/25
                    "
                    aria-hidden
                  >
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* =========================================
          MOBILE / TABLET — VERTICAL JOURNEY
      ========================================== */}
      <div className="lg:hidden">
        <ol className="relative ml-3 border-l border-primary/15 pl-8">
          {supplyRoute.map((step, _index) => (
            <li
              key={step.id}
              className="group relative pb-10 last:pb-0"
            >
              {/* Timeline dot */}
              <span
                className="
                  absolute -left-[49px] top-0
                  flex size-10 items-center justify-center
                  rounded-full
                  border border-primary/15
                  bg-card
                  text-primary
                  transition-all duration-300
                  group-hover:border-primary
                  group-hover:bg-primary
                  group-hover:text-primary-foreground
                "
              >
                <Icon
                  name={step.icon as IconName}
                  className="size-4"
                />
              </span>

              {/* Content */}
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold tabular-nums text-accent">
                    {String(step.id).padStart(2, "0")}
                  </span>

                  <span className="h-px w-6 bg-primary/15" />

                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {step.shortTitle}
                  </p>
                </div>

                <h3 className="mt-2 text-base font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>

                {step.description ? (
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}