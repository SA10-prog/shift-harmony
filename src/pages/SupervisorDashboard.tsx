import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { formatDate } from "@/types/models";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Plus, LogOut, Lock, Clock, DollarSign, Users, AlertTriangle } from "lucide-react";

const CURRENT_WEEK = "2026-W08";

export default function SupervisorDashboard() {
  const { user, logout } = useAuth();
  const { getShiftsForRestaurant, getWeekStatus, closeWeek, getWorkerById } = useData();
  const navigate = useNavigate();
  const restaurant = user?.restaurant!;
  const weekStatus = getWeekStatus(restaurant, CURRENT_WEEK);
  const shifts = getShiftsForRestaurant(restaurant, CURRENT_WEEK);

  const stats = useMemo(() => ({
    totalShifts: shifts.length,
    totalHours: Math.round(shifts.reduce((s, sh) => s + sh.hours_worked, 0) * 100) / 100,
    totalAmount: Math.round(shifts.reduce((s, sh) => s + sh.shift_amount, 0) * 100) / 100,
  }), [shifts]);

  const shiftsByDate = useMemo(() => {
    const grouped = new Map<string, typeof shifts>();
    shifts.sort((a, b) => a.shift_date.localeCompare(b.shift_date)).forEach(s => {
      if (!grouped.has(s.shift_date)) grouped.set(s.shift_date, []);
      grouped.get(s.shift_date)!.push(s);
    });
    return grouped;
  }, [shifts]);

  const handleCloseWeek = () => {
    if (confirm("Are you sure you want to close this week? You won't be able to edit shifts afterwards.")) {
      closeWeek(restaurant, CURRENT_WEEK);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{restaurant}</h1>
            <p className="text-primary-foreground/70 text-sm">Week {CURRENT_WEEK} · Feb 16–22</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={weekStatus} className="border-primary-foreground/30 text-primary-foreground bg-primary-foreground/15" />
            <button onClick={() => { logout(); navigate("/"); }} className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: "Shifts", value: stats.totalShifts },
            { icon: Clock, label: "Hours", value: stats.totalHours },
            { icon: DollarSign, label: "Amount", value: `€${stats.totalAmount}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-primary-foreground/10 rounded-xl p-3 backdrop-blur-sm">
              <Icon className="w-4 h-4 mb-1 text-primary-foreground/60" />
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-primary-foreground/60">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shift List */}
      <div className="px-4 -mt-3 space-y-4">
        {shifts.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No shifts this week</p>
              <p className="text-sm mt-1">Tap the + button to register a shift</p>
            </CardContent>
          </Card>
        ) : (
          [...shiftsByDate.entries()].map(([date, dateShifts]) => (
            <motion.div key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{formatDate(date)}</h3>
              <div className="space-y-2">
                {dateShifts.map(shift => {
                  const worker = getWorkerById(shift.worker_id);
                  return (
                    <Card
                      key={shift.id}
                      className="shadow-card cursor-pointer hover:shadow-elevated transition-shadow"
                      onClick={() => navigate(`/supervisor/shift/${shift.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{worker?.full_name}</span>
                              {shift.acted_as_supervisor && (
                                <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">SUP</span>
                              )}
                              {shift.multiLocation_conflict && (
                                <AlertTriangle className="w-3.5 h-3.5 text-status-conflict" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground capitalize mt-0.5">{shift.sector}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">€{shift.shift_amount.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{shift.entry_time}–{shift.exit_time} · {shift.hours_worked}h</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t">
        <div className="flex gap-3 max-w-lg mx-auto">
          {weekStatus === "open" && (
            <Button variant="outline" className="flex-1" onClick={handleCloseWeek}>
              <Lock className="w-4 h-4 mr-2" /> Close Week
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={() => navigate("/supervisor/new-shift")}
            disabled={weekStatus !== "open"}
          >
            <Plus className="w-4 h-4 mr-2" /> New Shift
          </Button>
        </div>
      </div>
    </div>
  );
}
