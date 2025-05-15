import { Component, OnDestroy, inject, signal, computed, effect, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FlightService } from '../../shared/services/flight.service';
import { Flight } from '../../shared/models/flight.model';
import { interval, Subscription } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-flights-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './flights-table.component.html',
  styleUrls: ['./flights-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlightsTableComponent implements OnInit, OnDestroy {
  private flightService = inject(FlightService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private refreshSubscription?: Subscription;
  
  // Table related properties
  displayedColumns: string[] = ['plane', 'from', 'from_date', 'to', 'to_date'];
  dataSource: MatTableDataSource<Flight> = new MatTableDataSource<Flight>([]);
  
  // Sorting properties
  sortColumn = 'from_date';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  flights = signal<Flight[]>([]);
  isLoading = signal<boolean>(false);
  
  // Computed properties
  workerName = computed(() => this.flightService.selectedWorker()?.name || 'No worker selected');
  errorMessage = computed(() => this.flightService.errorMessage());
  
  ngOnInit() {
    // Default filtering
    this.dataSource.filterPredicate = (data: Flight, filter: string) => {
      const searchStr = (data.plane ?? '') + 
                      (data.from ?? '') + 
                      (data.from_date ?? '') + 
                      (data.to ?? '') + 
                      (data.to_date ?? '');
      return searchStr.toLowerCase().includes(filter);
    };
    
    // Apply initial sort
    this.sortData(this.sortColumn);
  }
  
  // Parse date in DD/MM/YYYY format to a Date object
  private parseDateString(dateStr: string): Date {
    if (!dateStr) return new Date(0);
    
    // Check if the format is DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // parts[0] = day, parts[1] = month, parts[2] = year
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JS
      const year = parseInt(parts[2], 10);
      
      return new Date(year, month, day);
    }
    
    // Fallback to standard parsing if not in expected format
    return new Date(dateStr);
  }
  
  // Custom sorting function
  sortData(column: string) {
    // If sorting the same column, toggle direction
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    // Apply the sort
    const sortedData = [...this.dataSource.data].sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      // For date columns, use custom parser
      if (column === 'from_date' || column === 'to_date') {
        const aVal = a[column as keyof Flight] as string;
        const bVal = b[column as keyof Flight] as string;
        
        valueA = this.parseDateString(aVal).getTime();
        valueB = this.parseDateString(bVal).getTime();
      } else {
        valueA = a[column as keyof Flight];
        valueB = b[column as keyof Flight];
      }
      
      // Handle undefined values
      if (valueA === undefined) valueA = '';
      if (valueB === undefined) valueB = '';
      
      // Compare values
      const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    // Update the table data
    this.dataSource.data = sortedData;
    this.cdr.detectChanges();
  }
  
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
        this.dataSource.data = [];
        this.stopRefreshTimer();
      }
    });
  }
  
  ngOnDestroy(): void {
    this.stopRefreshTimer();
  }
  
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  
  loadFlights(workerId: number): void {
    this.isLoading.set(true);
    
    this.flightService.getFlightsByWorkerId(workerId).subscribe({
      next: (data) => {
        this.flights.set(data);
        this.dataSource.data = data;
        
        // Re-apply current sort
        this.sortData(this.sortColumn);
        
        // Auto-select the first flight if there's data and no flight is selected
        if (data.length > 0 && !this.flightService.selectedFlight()) {
          this.selectFlight(data[0]);
        }
        this.isLoading.set(false);
        
        // Trigger change detection to update the view
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading flights:', err);
        this.isLoading.set(false);
        this.cdr.detectChanges();
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