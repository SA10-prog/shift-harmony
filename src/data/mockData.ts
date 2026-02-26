import { Worker, Shift, WeekStatus, AppUser, calculateHoursWorked, calculateRate } from "@/types/models";

function makeShift(
  id: string, date: string, restaurant: string, workerId: string,
  sector: string, isSupervisor: boolean, entry: string, exit: string,
  conflict: boolean = false, paymentRestaurant?: string, observations?: string
): Shift {
  const hours = calculateHoursWorked(entry, exit);
  const rate = calculateRate(isSupervisor);
  return {
    id, week_id: "2026-W08", shift_date: date,
    restaurant: restaurant as any, worker_id: workerId,
    sector: sector as any, acted_as_supervisor: isSupervisor,
    entry_time: entry, exit_time: exit,
    hours_worked: hours, hourly_rate: rate,
    shift_amount: Math.round(hours * rate * 100) / 100,
    payment_restaurant: paymentRestaurant as any,
    observations,
    multiLocation_conflict: conflict,
    status: conflict ? "conflict" : "confirmed",
  };
}

export const DEMO_USERS: AppUser[] = [
  { email: "supervisor@brunch.com", password: "demo123", role: "supervisor", restaurant: "BRUNCH", name: "Sara García" },
  { email: "contable@cadena.com", password: "demo123", role: "accountant", name: "Ana López" },
];

export const INITIAL_WORKERS: Worker[] = [
  { id: "w1", full_name: "Adriana Espiritu", active: true },
  { id: "w2", full_name: "María José Plata", active: true },
  { id: "w3", full_name: "Giuliano Espósito", active: true },
  { id: "w4", full_name: "Laura Rubio", active: true },
  { id: "w5", full_name: "Barbara Castro Soler", active: true },
  { id: "w6", full_name: "Rocio Battistella", active: true },
  { id: "w7", full_name: "Lena Braizat", active: true },
  { id: "w8", full_name: "Karen Eihloft", active: true },
  { id: "w9", full_name: "Clara Montañana", active: true },
  { id: "w10", full_name: "Carlos Suarez", active: true },
];

// Week 2026-W08: Feb 16–22
export const INITIAL_SHIFTS: Shift[] = [
  // BRUNCH
  makeShift("s1", "2026-02-16", "BRUNCH", "w1", "sala", false, "09:00", "15:00"),
  makeShift("s2", "2026-02-16", "BRUNCH", "w3", "cocina", false, "10:00", "16:00", true), // Giuliano conflict
  makeShift("s3", "2026-02-17", "BRUNCH", "w2", "sala", false, "08:00", "14:00"),
  makeShift("s4", "2026-02-17", "BRUNCH", "w1", "sala", true, "09:00", "17:00"),
  makeShift("s5", "2026-02-18", "BRUNCH", "w4", "mantenimiento", false, "07:00", "12:00", true), // Laura conflict
  makeShift("s6", "2026-02-19", "BRUNCH", "w6", "cocina", false, "11:00", "18:00"),
  makeShift("s7", "2026-02-20", "BRUNCH", "w8", "sala", false, "09:00", "15:00"),
  // Lounge
  makeShift("s8", "2026-02-17", "Lounge", "w3", "cocina", false, "18:00", "23:00", true), // Giuliano conflict
  makeShift("s9", "2026-02-18", "Lounge", "w5", "sala", false, "10:00", "16:00"),
  makeShift("s10", "2026-02-19", "Lounge", "w9", "sala", true, "09:00", "17:00"),
  // Park
  makeShift("s11", "2026-02-16", "Park", "w4", "mantenimiento", false, "14:00", "19:00", true), // Laura conflict
  makeShift("s12", "2026-02-17", "Park", "w10", "cocina", false, "08:00", "14:00"),
  makeShift("s13", "2026-02-20", "Park", "w7", "sala", false, "10:00", "16:00"),
  // Headquarters
  makeShift("s14", "2026-02-16", "Headquarters", "w10", "sala", false, "09:00", "15:00"),
  makeShift("s15", "2026-02-18", "Headquarters", "w2", "cocina", false, "08:00", "14:00"),
];

export const INITIAL_WEEK_STATUSES: WeekStatus[] = [
  { restaurant: "Headquarters", week_id: "2026-W08", status: "open" },
  { restaurant: "Lounge", week_id: "2026-W08", status: "open" },
  { restaurant: "Park", week_id: "2026-W08", status: "closed" },
  { restaurant: "BRUNCH", week_id: "2026-W08", status: "open" },
  { restaurant: "BIS", week_id: "2026-W08", status: "open" },
  { restaurant: "Oficina", week_id: "2026-W08", status: "open" },
];
