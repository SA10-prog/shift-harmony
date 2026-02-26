import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { formatDate } from "@/types/models";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, AlertTriangle } from "lucide-react";

export default function ShiftDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { shifts, getWorkerById, getWeekStatus, deleteShift } = useData();
  const navigate = useNavigate();

  const shift = shifts.find(s => s.id === id);
  if (!shift) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Shift not found</p>
    </div>
  );

  const worker = getWorkerById(shift.worker_id);
  const weekStatus = getWeekStatus(shift.restaurant, shift.week_id);
  const canEdit = weekStatus === "open";

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this shift?")) {
      deleteShift(shift.id);
      navigate(-1);
    }
  };

  const rows = [
    ["Worker", worker?.full_name || "Unknown"],
    ["Date", formatDate(shift.shift_date)],
    ["Restaurant", shift.restaurant],
    ["Sector", shift.sector],
    ["Supervisor", shift.acted_as_supervisor ? "Yes (€10/h)" : "No (€9/h)"],
    ["Time", `${shift.entry_time} – ${shift.exit_time}`],
    ["Hours", `${shift.hours_worked.toFixed(2)}h`],
    ["Amount", `€${shift.shift_amount.toFixed(2)}`],
    ["Payment Location", shift.payment_restaurant || shift.restaurant],
    ["Observations", shift.observations || "—"],
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-primary-foreground/10">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Shift Detail</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {shift.multiLocation_conflict && (
          <div className="flex items-center gap-2 p-3 bg-status-conflict/10 border border-status-conflict/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-status-conflict flex-shrink-0" />
            <p className="text-sm text-status-conflict font-medium">Multi-location conflict detected</p>
          </div>
        )}

        <Card className="shadow-card">
          <CardContent className="p-0 divide-y">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium capitalize">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 justify-between">
          <StatusBadge status={shift.status} />
          <StatusBadge status={weekStatus} />
        </div>

        {canEdit && (
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
