import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, of, shareReplay } from 'rxjs';
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
  
  // Track in-flight requests to prevent duplicate calls
  private flightRequests = new Map<number, Observable<Flight[]>>();
  
  // Cache for recent API responses
  private flightsCache = new Map<number, {data: Flight[], timestamp: number}>();
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds cache TTL (was 5 minutes)

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
    
    // Check if we have a valid, non-expired cached response
    const cachedResponse = this.flightsCache.get(workerId);
    const currentTime = Date.now();
    
    if (cachedResponse && (currentTime - cachedResponse.timestamp < this.CACHE_TTL)) {
      console.log(`Using cached response for worker ${workerId}`);
      return of(cachedResponse.data);
    }
    
    // Check if there's already an in-flight request
    const existingRequest = this.flightRequests.get(workerId);
    if (existingRequest) {
      console.log(`Reusing in-flight request for worker ${workerId}`);
      return existingRequest;
    }
    
    if (this.useMockData) {
      // Generate 50 mock flights for testing scrolling
      const mockFlights = this.mockDataService.getMockFlights(workerId, 50);
      
      // Cache the mock data
      this.flightsCache.set(workerId, {data: mockFlights, timestamp: currentTime});
      
      // Simulate network delay
      return of(mockFlights);
    }
    
    // Create a new request and store it in the map
    const request = this.http.get<Flight[]>(`${this.flightsBaseUrl}/${workerId}`)
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
        // Cache the response
        tap(flights => {
          this.flightsCache.set(workerId, {data: flights, timestamp: Date.now()});
          // Remove from in-flight requests after completion
          setTimeout(() => this.flightRequests.delete(workerId), 0);
        }),
        // Share the response with all subscribers
        shareReplay(1),
        catchError(error => {
          this.errorMessage.set(`Failed to load flights for worker #${workerId}. Please try again later.`);
          // Remove from in-flight requests on error
          this.flightRequests.delete(workerId);
          return this.errorHandler.handleError(error);
        })
      );
    
    // Store the request
    this.flightRequests.set(workerId, request);
    return request;
  }
  
  // Clear the cache for a specific worker or all workers
  clearFlightsCache(workerId?: number): void {
    if (workerId !== undefined) {
      this.flightsCache.delete(workerId);
    } else {
      this.flightsCache.clear();
    }
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