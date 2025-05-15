import { Component, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FlightService } from '../../shared/services/flight.service';
import { Flight } from '../../shared/models/flight.model';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-flights-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flights-table.component.html',
  styleUrls: ['./flights-table.component.scss']
})
export class FlightsTableComponent implements OnDestroy {
  private flightService = inject(FlightService);
  private route = inject(ActivatedRoute);
  private refreshSubscription?: Subscription;
  
  flights = signal<Flight[]>([]);
  isLoading = signal<boolean>(false);
  
  // Computed properties
  workerName = computed(() => this.flightService.selectedWorker()?.name || 'No worker selected');
  errorMessage = computed(() => this.flightService.errorMessage());
  
  // Start timer and load flights when worker changes
  constructor() {
    // Listen for route parameter changes
    this.route.parent?.paramMap.subscribe(params => {
      const workerId = params.get('id');
      if (workerId) {
        const id = parseInt(workerId, 10);
        const worker = this.flightService.getWorkerById(id);
        
        if (worker && worker.id !== this.flightService.selectedWorker()?.id) {
          this.flightService.setSelectedWorker(worker);
        }
      }
    });
    
    // Create an effect to react to worker selection changes
    effect(() => {
      const selectedWorker = this.flightService.selectedWorker();
      if (selectedWorker) {
        this.loadFlights(selectedWorker.id);
        this.startRefreshTimer();
      } else {
        this.flights.set([]);
        this.stopRefreshTimer();
      }
    });
  }
  
  ngOnDestroy(): void {
    this.stopRefreshTimer();
  }
  
  loadFlights(workerId: number): void {
    this.isLoading.set(true);
    
    this.flightService.getFlightsByWorkerId(workerId).subscribe({
      next: (data) => {
        this.flights.set(data);
        // Auto-select the first flight if there's data and no flight is selected
        if (data.length > 0 && !this.flightService.selectedFlight()) {
          this.selectFlight(data[0]);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading flights:', err);
        this.isLoading.set(false);
      }
    });
  }
  
  retryLoadFlights(): void {
    this.flightService.clearError();
    const workerId = this.flightService.selectedWorker()?.id;
    if (workerId) {
      this.loadFlights(workerId);
    }
  }
  
  selectFlight(flight: Flight): void {
    if (!flight || !flight.id) {
      console.warn('Attempted to select an invalid flight');
      return;
    }
    
    this.flightService.setSelectedFlight(flight);
  }
  
  isSelected(flight: Flight): boolean {
    if (!flight || !flight.id) {
      return false;
    }
    
    const selectedFlight = this.flightService.selectedFlight();
    if (!selectedFlight || !selectedFlight.id) {
      return false;
    }
    
    return selectedFlight.id === flight.id;
  }
  
  private startRefreshTimer(): void {
    this.stopRefreshTimer(); // Clear any existing timer
    
    // Refresh every minute (60000 ms)
    this.refreshSubscription = interval(60000).subscribe(() => {
      const workerId = this.flightService.selectedWorker()?.id;
      if (workerId) {
        this.loadFlights(workerId);
      }
    });
  }
  
  private stopRefreshTimer(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
    }
  }
} 