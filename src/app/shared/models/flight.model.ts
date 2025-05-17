export interface Flight {
  id: string;
  num: string;  // Flight number (e.g., AF456)
  from: string;
  to: string;
  from_date: string;
  to_date: string;
  plane: string;  // Plane model (e.g., Airbus A380)
  duration: number;
  from_gate: number;
  to_gate: number;
}
