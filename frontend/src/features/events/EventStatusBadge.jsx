const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
};

export default function EventStatusBadge({ status }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        STATUS_STYLES[status] || STATUS_STYLES.DRAFT
      }`}
    >
      {status}
    </span>
  );
}
