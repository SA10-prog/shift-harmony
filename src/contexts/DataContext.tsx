import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Worker, Shift, WeekStatus, Restaurant, Sector, WeekStatusType, calculateHoursWorked, calculateRate } from "@/types/models";
import { INITIAL_WORKERS, INITIAL_SHIFTS, INITIAL_WEEK_STATUSES } from "@/data/mockData";

interface DataContextType {
  workers: Worker[];
  shifts: Shift[];
  weekStatuses: WeekStatus[];
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

let nextId = 100;

export function DataProvider({ children }: { children: ReactNode }) {
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [weekStatuses, setWeekStatuses] = useState<WeekStatus[]>(INITIAL_WEEK_STATUSES);

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
    const w: Worker = { id: `w${++nextId}`, full_name: name, active: true };
    setWorkers(prev => [...prev, w]);
    return w;
  }, []);

  const toggleWorkerActive = useCallback((id: string) => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));
  }, []);

  const addShift = useCallback((data: Omit<Shift, "id" | "hours_worked" | "hourly_rate" | "shift_amount" | "multiLocation_conflict" | "status">): Shift => {
    const hours = calculateHoursWorked(data.entry_time, data.exit_time);
    const rate = calculateRate(data.acted_as_supervisor);
    const newShift: Shift = {
      ...data, id: `s${++nextId}`,
      hours_worked: hours, hourly_rate: rate,
      shift_amount: Math.round(hours * rate * 100) / 100,
      multiLocation_conflict: false, status: "confirmed",
    };
    setShifts(prev => detectAndFlagConflicts([...prev, newShift]));
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
      return detectAndFlagConflicts(updated);
    });
  }, [detectAndFlagConflicts]);

  const deleteShift = useCallback((id: string) => {
    setShifts(prev => detectAndFlagConflicts(prev.filter(s => s.id !== id)));
  }, [detectAndFlagConflicts]);

  const getWeekStatus = useCallback((restaurant: Restaurant, weekId: string): WeekStatusType => {
    return weekStatuses.find(ws => ws.restaurant === restaurant && ws.week_id === weekId)?.status || "open";
  }, [weekStatuses]);

  const closeWeek = useCallback((restaurant: Restaurant, weekId: string) => {
    setWeekStatuses(prev => {
      const existing = prev.find(ws => ws.restaurant === restaurant && ws.week_id === weekId);
      if (existing) return prev.map(ws => ws === existing ? { ...ws, status: "closed" as const } : ws);
      return [...prev, { restaurant, week_id: weekId, status: "closed" as const }];
    });
  }, []);

  const exportWeek = useCallback((weekId: string) => {
    setWeekStatuses(prev => prev.map(ws => ws.week_id === weekId && ws.status === "closed" ? { ...ws, status: "exported" as const } : ws));
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
  }, []);

  return (
    <DataContext.Provider value={{
      workers, shifts, weekStatuses,
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
