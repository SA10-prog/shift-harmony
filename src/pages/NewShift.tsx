import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { SECTORS, Sector, RESTAURANTS, calculateHoursWorked, calculateRate } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Clock, DollarSign } from "lucide-react";

const CURRENT_WEEK = "2026-W08";

export default function NewShift() {
  const { user } = useAuth();
  const { workers, addShift, addWorker } = useData();
  const navigate = useNavigate();
  const restaurant = user?.restaurant!;

  const [workerId, setWorkerId] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");
  const [showWorkerList, setShowWorkerList] = useState(false);
  const [sector, setSector] = useState<Sector | "">("");
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [shiftDate, setShiftDate] = useState("2026-02-20");
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [paymentRestaurant, setPaymentRestaurant] = useState("");
  const [observations, setObservations] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeWorkers = workers.filter(w => w.active);
  const filteredWorkers = activeWorkers.filter(w =>
    w.full_name.toLowerCase().includes(workerSearch.toLowerCase())
  );

  const hours = useMemo(() => calculateHoursWorked(entryTime, exitTime), [entryTime, exitTime]);
  const rate = useMemo(() => calculateRate(isSupervisor), [isSupervisor]);
  const amount = Math.round(hours * rate * 100) / 100;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!workerId) errs.worker = "Select a worker";
    if (!sector) errs.sector = "Select a sector";
    if (!shiftDate) errs.date = "Select a date";
    if (!entryTime) errs.entry = "Enter start time";
    if (!exitTime) errs.exit = "Enter end time";
    if (entryTime && exitTime && exitTime <= entryTime) errs.exit = "Exit must be after entry";
    if (shiftDate < "2026-02-16" || shiftDate > "2026-02-22") errs.date = "Date must be within current week";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    addShift({
      week_id: CURRENT_WEEK,
      shift_date: shiftDate,
      restaurant,
      worker_id: workerId,
      sector: sector as Sector,
      acted_as_supervisor: isSupervisor,
      entry_time: entryTime,
      exit_time: exitTime,
      payment_restaurant: paymentRestaurant ? paymentRestaurant as any : undefined,
      observations: observations || undefined,
    });
    navigate("/supervisor");
  };

  const handleAddNewWorker = () => {
    if (!workerSearch.trim()) return;
    const w = addWorker(workerSearch.trim());
    setWorkerId(w.id);
    setWorkerSearch(w.full_name);
    setShowWorkerList(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/supervisor")} className="p-1.5 rounded-lg hover:bg-primary-foreground/10">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">New Shift</h1>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto pb-32">
        {/* Worker */}
        <div className="space-y-2 relative">
          <Label>Worker *</Label>
          <Input
            placeholder="Search worker..."
            value={workerSearch}
            onChange={e => { setWorkerSearch(e.target.value); setShowWorkerList(true); setWorkerId(""); }}
            onFocus={() => setShowWorkerList(true)}
          />
          {showWorkerList && (
            <Card className="absolute z-10 w-full shadow-elevated max-h-48 overflow-y-auto">
              <CardContent className="p-1">
                {filteredWorkers.map(w => (
                  <button
                    key={w.id}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
                    onClick={() => { setWorkerId(w.id); setWorkerSearch(w.full_name); setShowWorkerList(false); }}
                  >
                    {w.full_name}
                  </button>
                ))}
                {workerSearch && filteredWorkers.length === 0 && (
                  <button
                    className="w-full text-left px-3 py-2 text-sm rounded text-primary font-medium hover:bg-accent"
                    onClick={handleAddNewWorker}
                  >
                    + Add "{workerSearch}" as new worker
                  </button>
                )}
              </CardContent>
            </Card>
          )}
          {errors.worker && <p className="text-xs text-destructive">{errors.worker}</p>}
        </div>

        {/* Sector */}
        <div className="space-y-2">
          <Label>Sector *</Label>
          <div className="grid grid-cols-2 gap-2">
            {SECTORS.map(s => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium capitalize transition-all ${
                  sector === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.sector && <p className="text-xs text-destructive">{errors.sector}</p>}
        </div>

        {/* Supervisor toggle */}
        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
          <Label className="cursor-pointer">Acted as supervisor? (€10/h)</Label>
          <Switch checked={isSupervisor} onCheckedChange={setIsSupervisor} />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>Date *</Label>
          <Input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)}
            min="2026-02-16" max="2026-02-22" />
          {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Entry Time *</Label>
            <Input type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)} />
            {errors.entry && <p className="text-xs text-destructive">{errors.entry}</p>}
          </div>
          <div className="space-y-2">
            <Label>Exit Time *</Label>
            <Input type="time" value={exitTime} onChange={e => setExitTime(e.target.value)} />
            {errors.exit && <p className="text-xs text-destructive">{errors.exit}</p>}
          </div>
        </div>

        {/* Live Preview */}
        {entryTime && exitTime && hours > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-accent rounded-lg border border-primary/10">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">{hours.toFixed(2)}h</p>
                <p className="text-xs text-muted-foreground">Hours worked</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-accent rounded-lg border border-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">€{amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">@€{rate}/h</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Restaurant */}
        <div className="space-y-2">
          <Label>Payment Restaurant (optional)</Label>
          <select
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            value={paymentRestaurant}
            onChange={e => setPaymentRestaurant(e.target.value)}
          >
            <option value="">Same as shift location</option>
            {RESTAURANTS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Observations */}
        <div className="space-y-2">
          <Label>Observations (optional)</Label>
          <textarea
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm min-h-[80px] resize-none"
            value={observations}
            onChange={e => setObservations(e.target.value)}
            placeholder="Any notes about this shift..."
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/supervisor")}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave}>Save Shift</Button>
        </div>
      </div>
    </div>
  );
}
