import { statusLabel } from "./model.ts";

type BadgeVariant = "success" | "warning" | "danger" | "secondary";

function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "done":
      return "success";
    case "in-progress":
      return "warning";
    case "blocked":
      return "danger";
    default:
      return "secondary";
  }
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="badge" data-variant={statusVariant(status)}>
      {statusLabel(status)}
    </span>
  );
}
