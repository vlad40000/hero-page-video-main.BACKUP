/* eslint-disable @next/next/no-img-element */

import { cn } from "@/lib/utils";

type LoadingLogoProps = {
  className?: string;
  imageClassName?: string;
  label?: string;
  size?: number;
};

export function LoadingLogo({
  className,
  imageClassName,
  label = "Loading",
  size = 24,
}: LoadingLogoProps) {
  return (
    <span
      className={cn("rra-loading-logo inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    >
      <img
        src="/images/roadrunner-running.png"
        alt=""
        aria-hidden="true"
        className={cn("h-full w-full object-contain", imageClassName)}
      />
    </span>
  );
}
