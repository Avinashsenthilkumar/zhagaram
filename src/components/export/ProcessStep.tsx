import { Icon } from "@/components/common/Icon";
import { cn } from "@/lib/utils";
import type { ProcessStep as ProcessStepType } from "@/types/process";
import type { IconName } from "@/types/common";

export function ProcessStepCard({
  step,
  total,
}: {
  step: ProcessStepType;
  total: number;
}) {
  const isLast = step.id === total;
  return (
    <li className="relative flex gap-4 sm:gap-6">
      <div className="flex flex-col items-center">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {String(step.id).padStart(2, "0")}
        </span>
        {!isLast ? <span className="mt-1 w-px flex-1 bg-border" aria-hidden /> : null}
      </div>
      <article className={cn("flex-1 pb-10", isLast && "pb-0")}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 hidden text-primary sm:block">
            <Icon name={step.icon as IconName} className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {step.shortTitle}
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight">{step.title}</h3>
            {step.description ? (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            ) : null}
          </div>
        </div>
      </article>
    </li>
  );
}
