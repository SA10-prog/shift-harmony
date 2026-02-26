import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { Restaurant, formatDate } from "@/types/models";
import { StatusBadge } from "@/components/StatusBadge";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, AlertTriangle, Search } from "lucide-react";

const CURRENT_WEEK = "2026-W08";

export default function RestaurantDetail() {
  const { name } = useParams<{ name: string }>();
  const restaurant = decodeURIComponent(name || "") as Restaurant;
  const { getShiftsForRestaurant, getWeekStatus, getWorkerById } = useData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");

  const shifts = getShiftsForRestaurant(restaurant, CURRENT_WEEK);
  const weekStatus = getWeekStatus(restaurant, CURRENT_WEEK);

  const filteredShifts = useMemo(() => {
    if (!filter) return shifts;
    const q = filter.toLowerCase();
    return shifts.filter(s => {
      const w = getWorkerById(s.worker_id);
      return w?.full_name.toLowerCase().includes(q) || s.sector.includes(q) || s.shift_date.includes(q);
    });
  }, [shifts, filter, getWorkerById]);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/admin")} className="p-2 rounded-lg hover:bg-accent">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{restaurant}</h1>
            <p className="text-muted-foreground text-sm">Week {CURRENT_WEEK}</p>
          </div>
          <StatusBadge status={weekStatus} />
        </div>

        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filter by worker, sector, date..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No shifts found</TableCell>
                  </TableRow>
                ) : filteredShifts.map(s => {
                  const w = getWorkerById(s.worker_id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm">{formatDate(s.shift_date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm">{w?.full_name}</span>
                          {s.acted_as_supervisor && (
                            <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1 py-0.5 rounded">SUP</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-sm">{s.sector}</TableCell>
                      <TableCell className="text-sm">{s.entry_time}–{s.exit_time}</TableCell>
                      <TableCell className="text-right text-sm">{s.hours_worked.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm">€{s.hourly_rate}</TableCell>
                      <TableCell className="text-right text-sm font-medium">€{s.shift_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {s.multiLocation_conflict && <AlertTriangle className="w-3.5 h-3.5 text-status-conflict" />}
                          <StatusBadge status={s.status} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
