export interface Flight {
  id: string;
  from: string;
  to: string;
  from_date: string; // dd/mm/yyyy
  to_date: string; // dd/mm/yyyy
  plane: string;
  duration: number;
  from_gate: number;
  to_gate: number;
} 