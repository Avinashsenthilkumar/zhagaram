import { cn } from "@/lib/utils";
import { Icon } from "@/components/common/Icon";
import type { IconName } from "@/types/common";

export function IconBox({
  name,
  className,
  tone = "light",
}: {
  name: IconName;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-lg",
        tone === "dark"
          ? "bg-primary-foreground/10 text-accent"
          : "bg-primary/8 text-primary",
        className,
      )}
    >
      <Icon name={name} className="size-5" />
    </span>
  );
}
