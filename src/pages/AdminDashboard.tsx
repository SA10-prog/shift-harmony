import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { RESTAURANTS } from "@/types/models";
import { StatusBadge } from "@/components/StatusBadge";
import AdminLayout from "@/components/AdminLayout";
import ExportModal from "@/components/ExportModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { Download, AlertTriangle, Clock, DollarSign, Building } from "lucide-react";

const CURRENT_WEEK = "2026-W08";

export default function AdminDashboard() {
  const { getShiftsForRestaurant, getShiftsForWeek, getWeekStatus, getConflictWorkers } = useData();
  const navigate = useNavigate();
  const [showExport, setShowExport] = useState(false);
  const [weekId] = useState(CURRENT_WEEK);

  const weekShifts = getShiftsForWeek(weekId);
  const conflicts = getConflictWorkers(weekId);

  const restaurantData = useMemo(() =>
    RESTAURANTS.map(r => {
      const rShifts = getShiftsForRestaurant(r, weekId);
      const hasConflict = rShifts.some(s => s.multiLocation_conflict);
      return {
        name: r,
        status: getWeekStatus(r, weekId),
        shifts: rShifts.length,
        hours: Math.round(rShifts.reduce((s, sh) => s + sh.hours_worked, 0) * 100) / 100,
        amount: Math.round(rShifts.reduce((s, sh) => s + sh.shift_amount, 0) * 100) / 100,
        hasConflict,
      };
    }), [weekId, getShiftsForRestaurant, getWeekStatus]
  );

  const totals = useMemo(() => ({
    shifts: weekShifts.length,
    hours: Math.round(weekShifts.reduce((s, sh) => s + sh.hours_worked, 0) * 100) / 100,
    amount: Math.round(weekShifts.reduce((s, sh) => s + sh.shift_amount, 0) * 100) / 100,
  }), [weekShifts]);

  const hasUnresolvedConflicts = conflicts.length > 0;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Weekly Overview</h1>
            <p className="text-muted-foreground text-sm mt-1">Week {weekId} · Feb 16–22, 2026</p>
          </div>
          <Button onClick={() => setShowExport(true)} disabled={hasUnresolvedConflicts}>
            <Download className="w-4 h-4 mr-2" /> Export Week
          </Button>
        </div>

        {hasUnresolvedConflicts && (
          <div className="flex items-center gap-2 p-3 mb-6 bg-status-conflict/10 border border-status-conflict/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-status-conflict" />
            <p className="text-sm font-medium text-status-conflict">
              {conflicts.length} worker(s) with multi-location conflicts.
              <button className="underline ml-1" onClick={() => navigate("/admin/conflicts")}>Resolve now</button>
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: Building, label: "Total Shifts", value: totals.shifts },
            { icon: Clock, label: "Total Hours", value: totals.hours },
            { icon: DollarSign, label: "Total Amount", value: `€${totals.amount.toFixed(2)}` },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="shadow-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Icon className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Restaurant Table */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Restaurants</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Shifts</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Alerts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurantData.map((r) => (
                  <TableRow
                    key={r.name}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => navigate(`/admin/restaurant/${encodeURIComponent(r.name)}`)}
                  >
                    <TableCell className="font-semibold">{r.name}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right">{r.shifts}</TableCell>
                    <TableCell className="text-right">{r.hours}</TableCell>
                    <TableCell className="text-right font-medium">€{r.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {r.hasConflict && <AlertTriangle className="w-4 h-4 text-status-conflict inline" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {showExport && <ExportModal weekId={weekId} onClose={() => setShowExport(false)} />}
    </AdminLayout>
  );
}
