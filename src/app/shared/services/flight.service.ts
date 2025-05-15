import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
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
  private workersUrl = '/workers';
  private flightsBaseUrl = '/flights';

  // Signals
  selectedWorker = signal<Worker | null>(null);
  selectedFlight = signal<Flight | null>(null);

  // Error message signal
  errorMessage = signal<string | null>(null);

  getWorkers(): Observable<Worker[]> {
    this.errorMessage.set(null);
    return this.http.get<Worker[]>(this.workersUrl)
      .pipe(
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
