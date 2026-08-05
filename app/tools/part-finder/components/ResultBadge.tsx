import type { ReactNode } from "react";

type Props = {
  tone: "verified" | "likely" | "revision" | "review" | "pending";
  children: ReactNode;
};

export default function ResultBadge({ tone, children }: Props) {
  const styles =
    tone === "verified"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "likely"
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : tone === "revision"
      ? "bg-violet-50 text-violet-700 ring-violet-200"
      : tone === "review"
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  return <div className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles}`}>{children}</div>;
}
