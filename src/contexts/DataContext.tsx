import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Worker, Shift, WeekStatus, Restaurant, WeekStatusType, calculateHoursWorked, calculateRate } from "@/types/models";
import { supabase } from "@/lib/supabase";

interface DataContextType {
  workers: Worker[];
  shifts: Shift[];
  weekStatuses: WeekStatus[];
  loading: boolean;
  addWorker: (name: string) => Worker;
  toggleWorkerActive: (id: string) => void;
  addShift: (data: Omit<Shift, "id" | "hours_worked" | "hourly_rate" | "shift_amount" | "multiLocation_conflict" | "status">) => Shift;
  updateShift: (id: string, data: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  getWeekStatus: (restaurant: Restaurant, weekId: string) => WeekStatusType;
  closeWeek: (restaurant: Restaurant, weekId: string) => void;
  exportWeek: (weekId: string) => void;
  getShiftsForRestaurant: (restaurant: Restaurant, weekId: string) => Shift[];
  getShiftsForWeek: (weekId: string) => Shift[];
  getWorkerById: (id: string) => Worker | undefined;
  getConflictWorkers: (weekId: string) => { worker: Worker; shifts: Shift[]; suggestedPayment: Restaurant }[];
  resolveConflictPayment: (workerId: string, weekId: string, paymentRestaurant: Restaurant) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [weekStatuses, setWeekStatuses] = useState<WeekStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      const [{ data: w }, { data: s }, { data: ws }] = await Promise.all([
        supabase.from("workers").select("*").order("full_name"),
        supabase.from("shifts").select("*"),
        supabase.from("week_statuses").select("*"),
      ]);
      if (w) setWorkers(w as Worker[]);
      if (s) setShifts(s as Shift[]);
      if (ws) setWeekStatuses(ws as WeekStatus[]);
      setLoading(false);
    }
    loadAll();
  }, []);

  const getWorkerById = useCallback((id: string) => workers.find(w => w.id === id), [workers]);

  const detectAndFlagConflicts = useCallback((allShifts: Shift[]): Shift[] => {
    const weekWorkerRestaurants = new Map<string, Set<string>>();
    allShifts.forEach(s => {
      const key = `${s.week_id}::${s.worker_id}`;
      if (!weekWorkerRestaurants.has(key)) weekWorkerRestaurants.set(key, new Set());
      weekWorkerRestaurants.get(key)!.add(s.restaurant);
    });
    return allShifts.map(s => {
      const key = `${s.week_id}::${s.worker_id}`;
      const restaurants = weekWorkerRestaurants.get(key)!;
      const isConflict = restaurants.size > 1;
      return { ...s, multiLocation_conflict: isConflict, status: isConflict ? "conflict" as const : s.status === "conflict" ? "confirmed" as const : s.status };
    });
  }, []);

  const addWorker = useCallback((name: string): Worker => {
    const w: Worker = { id: crypto.randomUUID(), full_name: name, active: true };
    setWorkers(prev => [...prev, w]);
    supabase.from("workers").insert(w).then(({ error }) => {
      if (error) {
        console.error("addWorker failed:", error.message);
        setWorkers(prev => prev.filter(x => x.id !== w.id));
      }
    });
    return w;
  }, []);

  const toggleWorkerActive = useCallback((id: string) => {
    setWorkers(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, active: !w.active } : w);
      const worker = updated.find(w => w.id === id);
      if (worker) {
        supabase.from("workers").update({ active: worker.active }).eq("id", id).then(({ error }) => {
          if (error) console.error("toggleWorkerActive failed:", error.message);
        });
      }
      return updated;
    });
  }, []);

  const addShift = useCallback((data: Omit<Shift, "id" | "hours_worked" | "hourly_rate" | "shift_amount" | "multiLocation_conflict" | "status">): Shift => {
    const hours = calculateHoursWorked(data.entry_time, data.exit_time);
    const rate = calculateRate(data.acted_as_supervisor);
    const newShift: Shift = {
      ...data, id: crypto.randomUUID(),
      hours_worked: hours, hourly_rate: rate,
      shift_amount: Math.round(hours * rate * 100) / 100,
      multiLocation_conflict: false, status: "confirmed",
    };
    setShifts(prev => detectAndFlagConflicts([...prev, newShift]));
    supabase.from("shifts").insert(newShift).then(({ error }) => {
      if (error) {
        console.error("addShift failed:", error.message);
        setShifts(prev => detectAndFlagConflicts(prev.filter(s => s.id !== newShift.id)));
      }
    });
    return newShift;
  }, [detectAndFlagConflicts]);

  const updateShift = useCallback((id: string, data: Partial<Shift>) => {
    setShifts(prev => {
      const updated = prev.map(s => {
        if (s.id !== id) return s;
        const merged = { ...s, ...data };
        if (data.entry_time || data.exit_time || data.acted_as_supervisor !== undefined) {
          merged.hours_worked = calculateHoursWorked(merged.entry_time, merged.exit_time);
          merged.hourly_rate = calculateRate(merged.acted_as_supervisor);
          merged.shift_amount = Math.round(merged.hours_worked * merged.hourly_rate * 100) / 100;
        }
        return merged;
      });
      const flagged = detectAndFlagConflicts(updated);
      const shift = flagged.find(s => s.id === id);
      if (shift) {
        supabase.from("shifts").update(shift).eq("id", id).then(({ error }) => {
          if (error) console.error("updateShift failed:", error.message);
        });
      }
      return flagged;
    });
  }, [detectAndFlagConflicts]);

  const deleteShift = useCallback((id: string) => {
    setShifts(prev => detectAndFlagConflicts(prev.filter(s => s.id !== id)));
    supabase.from("shifts").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("deleteShift failed:", error.message);
    });
  }, [detectAndFlagConflicts]);

  const getWeekStatus = useCallback((restaurant: Restaurant, weekId: string): WeekStatusType => {
    return weekStatuses.find(ws => ws.restaurant === restaurant && ws.week_id === weekId)?.status || "open";
  }, [weekStatuses]);

  const closeWeek = useCallback((restaurant: Restaurant, weekId: string) => {
    setWeekStatuses(prev => {
      const existing = prev.find(ws => ws.restaurant === restaurant && ws.week_id === weekId);
      let next: WeekStatus[];
      if (existing) {
        next = prev.map(ws => ws === existing ? { ...ws, status: "closed" as const } : ws);
        supabase.from("week_statuses").update({ status: "closed" }).eq("restaurant", restaurant).eq("week_id", weekId)
          .then(({ error }) => { if (error) console.error("closeWeek update failed:", error.message); });
      } else {
        const row: WeekStatus = { restaurant, week_id: weekId, status: "closed" };
        next = [...prev, row];
        supabase.from("week_statuses").insert(row)
          .then(({ error }) => { if (error) console.error("closeWeek insert failed:", error.message); });
      }
      return next;
    });
  }, []);

  const exportWeek = useCallback((weekId: string) => {
    setWeekStatuses(prev => prev.map(ws => ws.week_id === weekId && ws.status === "closed" ? { ...ws, status: "exported" as const } : ws));
    supabase.from("week_statuses").update({ status: "exported" }).eq("week_id", weekId).eq("status", "closed")
      .then(({ error }) => { if (error) console.error("exportWeek failed:", error.message); });
  }, []);

  const getShiftsForRestaurant = useCallback((restaurant: Restaurant, weekId: string) =>
    shifts.filter(s => s.restaurant === restaurant && s.week_id === weekId), [shifts]);

  const getShiftsForWeek = useCallback((weekId: string) =>
    shifts.filter(s => s.week_id === weekId), [shifts]);

  const getConflictWorkers = useCallback((weekId: string) => {
    const weekShifts = shifts.filter(s => s.week_id === weekId && s.multiLocation_conflict);
    const workerIds = [...new Set(weekShifts.map(s => s.worker_id))];
    return workerIds.map(wid => {
      const workerShifts = weekShifts.filter(s => s.worker_id === wid);
      const hoursByRestaurant = new Map<Restaurant, number>();
      workerShifts.forEach(s => {
        hoursByRestaurant.set(s.restaurant, (hoursByRestaurant.get(s.restaurant) || 0) + s.hours_worked);
      });
      let maxHours = 0;
      let suggested: Restaurant = workerShifts[0].restaurant;
      hoursByRestaurant.forEach((hours, rest) => { if (hours > maxHours) { maxHours = hours; suggested = rest; } });
      return { worker: workers.find(w => w.id === wid)!, shifts: workerShifts, suggestedPayment: suggested };
    });
  }, [shifts, workers]);

  const resolveConflictPayment = useCallback((workerId: string, weekId: string, paymentRestaurant: Restaurant) => {
    setShifts(prev => prev.map(s =>
      s.worker_id === workerId && s.week_id === weekId
        ? { ...s, payment_restaurant: paymentRestaurant }
        : s
    ));
    supabase.from("shifts").update({ payment_restaurant: paymentRestaurant })
      .eq("worker_id", workerId).eq("week_id", weekId)
      .then(({ error }) => { if (error) console.error("resolveConflictPayment failed:", error.message); });
  }, []);

  return (
    <DataContext.Provider value={{
      workers, shifts, weekStatuses, loading,
      addWorker, toggleWorkerActive, addShift, updateShift, deleteShift,
      getWeekStatus, closeWeek, exportWeek,
      getShiftsForRestaurant, getShiftsForWeek, getWorkerById,
      getConflictWorkers, resolveConflictPayment,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be inside DataProvider");
  return ctx;
}
