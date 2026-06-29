import { createClient } from "@supabase/supabase-js";
import type { Worker, Shift, WeekStatus } from "@/types/models";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key);

export type Database = {
  workers: Worker;
  shifts: Shift;
  week_statuses: WeekStatus;
};
