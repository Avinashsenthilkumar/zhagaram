import { cn } from "@/lib/utils";

export function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
  tone = "light",
}: {
  kicker?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
}) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center")}>
      {kicker ? (
        <p
          className={cn(
            "mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] sm:text-xs",
            tone === "dark" ? "text-accent" : "text-accent",
          )}
        >
          {kicker}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[2.6rem] lg:leading-[1.1]",
          tone === "dark" ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg",
            align === "center" && "mx-auto",
            tone === "dark" ? "text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
