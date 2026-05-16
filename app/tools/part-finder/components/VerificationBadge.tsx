type Props = {
  status: "verified" | "possible" | "unverified";
};

export default function VerificationBadge({ status }: Props) {
  const label =
    status === "verified"
      ? "Verified"
      : status === "possible"
      ? "Needs manual verification"
      : "Unverified";

  const styles =
    status === "verified"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "possible"
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : "bg-red-50 text-red-700 ring-red-200";

  return (
    <div
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles}`}
    >
      {label}
    </div>
  );
}
