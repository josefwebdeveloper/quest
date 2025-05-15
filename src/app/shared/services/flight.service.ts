import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, of } from 'rxjs';
import { Worker } from '../models/worker.model';
import { Flight } from '../models/flight.model';
import { ErrorHandlerService } from './error-handler.service';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);
  private mockDataService = inject(MockDataService);
  
  // Flag to use mock data instead of API
  private useMockData = false;
  
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
    
    if (this.useMockData) {
      // Generate 40 mock workers for testing scrolling
      const mockWorkers = this.mockDataService.getMockWorkers(40);
      
      // Simulate network delay
      return of(mockWorkers).pipe(
        tap(workers => {
          this.workers.set(workers);
          this.workersLoaded.set(true);
        })
      );
    }
    
    return this.http.get<Worker[]>(this.workersUrl)
      .pipe(
        // Ensure each worker has a valid ID
        map(workers => workers.filter(worker => worker && worker.id !== undefined && worker.id !== null)),
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
    
    if (this.useMockData) {
      // Generate 50 mock flights for testing scrolling
      const mockFlights = this.mockDataService.getMockFlights(workerId, 50);
      
      // Simulate network delay
      return of(mockFlights);
    }
    
    return this.http.get<Flight[]>(`${this.flightsBaseUrl}/${workerId}`)
      .pipe(
        // Ensure each flight has a valid ID
        map(flights => {
          return flights
            .filter(flight => flight !== null && flight !== undefined)
            .map((flight, index) => {
              // If ID is missing or empty, generate a temporary one based on index
              if (!flight.id) {
                return { ...flight, id: `temp-${workerId}-${index}` };
              }
              return flight;
            });
        }),
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