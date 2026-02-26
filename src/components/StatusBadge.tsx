import { cn } from "@/lib/utils";

type StatusType = "open" | "closed" | "exported" | "draft" | "confirmed" | "conflict";

const styles: Record<StatusType, string> = {
  open: "bg-status-open/15 text-status-open border-status-open/30",
  closed: "bg-status-closed/15 text-status-closed border-status-closed/30",
  exported: "bg-status-exported/15 text-status-exported border-status-exported/30",
  draft: "bg-status-draft/15 text-status-draft border-status-draft/30",
  confirmed: "bg-status-closed/15 text-status-closed border-status-closed/30",
  conflict: "bg-status-conflict/15 text-status-conflict border-status-conflict/30",
};

export function StatusBadge({ status, className }: { status: StatusType; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize",
      styles[status], className
    )}>
      {status}
    </span>
  );
}
