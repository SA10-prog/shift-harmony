export type Restaurant = "Headquarters" | "Lounge" | "Park" | "BRUNCH" | "BIS" | "Oficina";
export type Sector = "sala" | "cocina" | "mantenimiento" | "otro";
export type ShiftStatus = "draft" | "confirmed" | "conflict";
export type WeekStatusType = "open" | "closed" | "exported";
export type UserRole = "supervisor" | "accountant";

export const RESTAURANTS: Restaurant[] = ["Headquarters", "Lounge", "Park", "BRUNCH", "BIS", "Oficina"];
export const SECTORS: Sector[] = ["sala", "cocina", "mantenimiento", "otro"];

export interface Worker {
  id: string;
  full_name: string;
  active: boolean;
}

export interface Shift {
  id: string;
  week_id: string;
  shift_date: string; // YYYY-MM-DD
  restaurant: Restaurant;
  worker_id: string;
  sector: Sector;
  acted_as_supervisor: boolean;
  entry_time: string; // HH:MM
  exit_time: string; // HH:MM
  hours_worked: number;
  hourly_rate: number;
  shift_amount: number;
  payment_restaurant?: Restaurant;
  observations?: string;
  multiLocation_conflict: boolean;
  status: ShiftStatus;
}

export interface WeekStatus {
  restaurant: Restaurant;
  week_id: string;
  status: WeekStatusType;
}

export interface AppUser {
  email: string;
  password: string;
  role: UserRole;
  restaurant?: Restaurant; // only for supervisors
  name: string;
}

export function calculateHoursWorked(entry: string, exit: string): number {
  if (!entry || !exit) return 0;
  const [eh, em] = entry.split(":").map(Number);
  const [xh, xm] = exit.split(":").map(Number);
  const entryMin = eh * 60 + em;
  const exitMin = xh * 60 + xm;
  if (exitMin <= entryMin) return 0;
  return Math.round(((exitMin - entryMin) / 60) * 100) / 100;
}

export function calculateRate(isSupervisor: boolean): number {
  return isSupervisor ? 10 : 9;
}

export function getWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getWeekDates(weekId: string): { start: Date; end: Date } {
  const [year, week] = weekId.split("-W").map(Number);
  const jan1 = new Date(year, 0, 1);
  const days = (week - 1) * 7;
  const dayOfWeek = jan1.getDay() || 7;
  const start = new Date(year, 0, 1 + days - dayOfWeek + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
