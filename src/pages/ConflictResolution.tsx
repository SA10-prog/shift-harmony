import { useNavigate } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { RESTAURANTS, Restaurant } from "@/types/models";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Check } from "lucide-react";
import { useState } from "react";

const CURRENT_WEEK = "2026-W08";

export default function ConflictResolution() {
  const { getConflictWorkers, resolveConflictPayment } = useData();
  const conflicts = getConflictWorkers(CURRENT_WEEK);

  const handleConfirmAll = () => {
    conflicts.forEach(c => {
      resolveConflictPayment(c.worker.id, CURRENT_WEEK, c.suggestedPayment);
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Multi-Location Conflicts</h1>
            <p className="text-muted-foreground text-sm mt-1">Week {CURRENT_WEEK} · Resolve payment locations</p>
          </div>
          {conflicts.length > 0 && (
            <Button onClick={handleConfirmAll}>
              <Check className="w-4 h-4 mr-2" /> Confirm All Suggestions
            </Button>
          )}
        </div>

        {conflicts.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-16 text-center">
              <Check className="w-12 h-12 mx-auto mb-3 text-status-closed opacity-60" />
              <p className="text-lg font-semibold">No conflicts</p>
              <p className="text-sm text-muted-foreground mt-1">All workers are assigned to a single location this week.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {conflicts.map(({ worker, shifts, suggestedPayment }) => {
              const hoursByRestaurant = new Map<Restaurant, number>();
              shifts.forEach(s => {
                hoursByRestaurant.set(s.restaurant, (hoursByRestaurant.get(s.restaurant) || 0) + s.hours_worked);
              });

              return (
                <Card key={worker.id} className="shadow-card border-status-conflict/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-status-conflict" />
                      <CardTitle className="text-base">{worker.full_name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Restaurant</TableHead>
                          <TableHead className="text-right">Shifts</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Suggested</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...hoursByRestaurant.entries()].map(([rest, hours]) => {
                          const restShifts = shifts.filter(s => s.restaurant === rest);
                          const amount = restShifts.reduce((s, sh) => s + sh.shift_amount, 0);
                          const isSuggested = rest === suggestedPayment;
                          return (
                            <TableRow key={rest} className={isSuggested ? "bg-status-closed/5" : ""}>
                              <TableCell className="font-medium">{rest}</TableCell>
                              <TableCell className="text-right">{restShifts.length}</TableCell>
                              <TableCell className="text-right">{hours.toFixed(2)}</TableCell>
                              <TableCell className="text-right">€{amount.toFixed(2)}</TableCell>
                              <TableCell>
                                {isSuggested && (
                                  <span className="text-xs font-semibold text-status-closed bg-status-closed/10 px-2 py-0.5 rounded">
                                    ★ Suggested
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    <div className="flex items-center gap-3 mt-4">
                      <label className="text-sm text-muted-foreground">Pay at:</label>
                      <ConflictPaymentSelect
                        workerId={worker.id}
                        suggested={suggestedPayment}
                        current={shifts[0]?.payment_restaurant}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function ConflictPaymentSelect({ workerId, suggested, current }: {
  workerId: string; suggested: Restaurant; current?: Restaurant;
}) {
  const { resolveConflictPayment } = useData();
  const [value, setValue] = useState(current || suggested);

  const handleChange = (val: string) => {
    setValue(val as Restaurant);
    resolveConflictPayment(workerId, CURRENT_WEEK, val as Restaurant);
  };

  return (
    <select
      className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium"
      value={value}
      onChange={e => handleChange(e.target.value)}
    >
      {RESTAURANTS.map(r => (
        <option key={r} value={r}>{r}{r === suggested ? " (suggested)" : ""}</option>
      ))}
    </select>
  );
}
