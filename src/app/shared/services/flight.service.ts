import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, of, shareReplay } from 'rxjs';
import { Worker } from '../models/worker.model';
import { Flight } from '../models/flight.model';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root',
})
export class FlightService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

  private workersUrl = '/api/workers';
  private flightsBaseUrl = '/api/flights';

  selectedWorker = signal<Worker | null>(null);
  selectedFlight = signal<Flight | null>(null);

  errorMessage = signal<string | null>(null);

  private workers = signal<Worker[]>([]);

  private workersLoaded = signal<boolean>(false);

  private flightRequests = new Map<number, Observable<Flight[]>>();

  private flightsCache = new Map<number, Flight[]>();

  getWorkers(): Observable<Worker[]> {
    this.errorMessage.set(null);

    return this.http.get<Worker[]>(this.workersUrl).pipe(
      map((workers) =>
        workers.filter(
          (worker) => worker && worker.id !== undefined && worker.id !== null,
        ),
      ),
      tap((workers) => {
        this.workers.set(workers);
        this.workersLoaded.set(true);
      }),
      catchError((error) => {
        this.errorMessage.set(
          'Failed to load workers. Please try again later.',
        );
        return this.errorHandler.handleError(error);
      }),
    );
  }

  getFlightsByWorkerId(workerId: number): Observable<Flight[]> {
    this.errorMessage.set(null);

    const cachedFlights = this.flightsCache.get(workerId);

    if (cachedFlights) {
      return of(cachedFlights);
    }

    const existingRequest = this.flightRequests.get(workerId);
    if (existingRequest) {
      return existingRequest;
    }

    const request = this.http
      .get<Flight[]>(`${this.flightsBaseUrl}/${workerId}`)
      .pipe(
        map((flights) => {
          return flights
            .filter((flight) => flight !== null && flight !== undefined)
            .map((flight, index) => {
              if (!flight.id) {
                return { ...flight, id: `temp-${workerId}-${index}` };
              }
              return flight;
            });
        }),
        tap((flights) => {
          this.flightsCache.set(workerId, flights);
          this.flightRequests.delete(workerId);
        }),
        shareReplay(1),
        catchError((error) => {
          this.errorMessage.set(
            `Failed to load flights for worker #${workerId}. Please try again later.`,
          );
          this.flightRequests.delete(workerId);
          return this.errorHandler.handleError(error);
        }),
      );

    this.flightRequests.set(workerId, request);
    return request;
  }

  clearFlightsCache(workerId?: number): void {
    if (workerId !== undefined) {
      this.flightsCache.delete(workerId);
      this.flightRequests.delete(workerId);
    } else {
      this.flightsCache.clear();
      this.flightRequests.clear();
    }
  }

  hasWorkersLoaded(): boolean {
    return this.workersLoaded();
  }

  getAllWorkers(): Worker[] {
    return this.workers();
  }

  getWorkerById(id: number): Worker | null {
    const workers = this.workers();
    return workers.find((worker) => worker.id === id) || null;
  }

  setSelectedWorker(worker: Worker | null): void {
    this.selectedWorker.set(worker);
    this.selectedFlight.set(null);
  }

  setSelectedFlight(flight: Flight | null): void {
    this.selectedFlight.set(flight);
  }

  clearError(): void {
    this.errorMessage.set(null);
  }
}
