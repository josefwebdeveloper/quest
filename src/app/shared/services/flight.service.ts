import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap } from 'rxjs';
import { Worker } from '../models/worker.model';
import { Flight } from '../models/flight.model';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);
  
  // Proxied endpoints to avoid CORS
  private workersUrl = '/api/workers';
  private flightsBaseUrl = '/api/flights';

  // Signals
  selectedWorker = signal<Worker | null>(null);
  selectedFlight = signal<Flight | null>(null);
  
  // Error message signal
  errorMessage = signal<string | null>(null);
  
  // Store the workers list
  private workers = signal<Worker[]>([]);
  
  // Flag to track if workers are loaded
  private workersLoaded = signal<boolean>(false);

  getWorkers(): Observable<Worker[]> {
    this.errorMessage.set(null);
    return this.http.get<Worker[]>(this.workersUrl)
      .pipe(
        tap(workers => {
          this.workers.set(workers);
          this.workersLoaded.set(true);
        }),
        catchError(error => {
          this.errorMessage.set('Failed to load workers. Please try again later.');
          return this.errorHandler.handleError(error);
        })
      );
  }

  getFlightsByWorkerId(workerId: number): Observable<Flight[]> {
    this.errorMessage.set(null);
    return this.http.get<Flight[]>(`${this.flightsBaseUrl}/${workerId}`)
      .pipe(
        catchError(error => {
          this.errorMessage.set(`Failed to load flights for worker #${workerId}. Please try again later.`);
          return this.errorHandler.handleError(error);
        })
      );
  }
  
  // Check if workers are already loaded
  hasWorkersLoaded(): boolean {
    return this.workersLoaded();
  }
  
  // Get all workers
  getAllWorkers(): Worker[] {
    return this.workers();
  }
  
  // Get a worker by ID
  getWorkerById(id: number): Worker | null {
    const workers = this.workers();
    return workers.find(worker => worker.id === id) || null;
  }

  setSelectedWorker(worker: Worker | null): void {
    this.selectedWorker.set(worker);
    this.selectedFlight.set(null); // Reset selected flight when worker changes
  }

  setSelectedFlight(flight: Flight | null): void {
    this.selectedFlight.set(flight);
  }
  
  clearError(): void {
    this.errorMessage.set(null);
  }
} 