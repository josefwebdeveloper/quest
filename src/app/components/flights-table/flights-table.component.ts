import { Component, OnDestroy, inject, signal, computed, effect, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FlightService } from '../../shared/services/flight.service';
import { Flight } from '../../shared/models/flight.model';
import { interval, Subscription, Subject, takeUntil } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { LoaderService } from '../../shared/services/loader.service';

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
export class FlightsTableComponent implements OnInit, OnDestroy, AfterViewInit {
  private flightService = inject(FlightService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private breakpointObserver = inject(BreakpointObserver);
  private loaderService = inject(LoaderService);
  private destroy$ = new Subject<void>();
  
  // Cache for API responses
  private flightsCache = new Map<number, Flight[]>();
  private lastFetchTime = new Map<number, number>();
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds cache TTL (was 5 minutes)
  
  // Table related properties
  displayedColumns: string[] = ['plane', 'from', 'from_date', 'to', 'to_date'];
  mobileDisplayedColumns: string[] = ['plane', 'from', 'to'];
  dataSource: MatTableDataSource<Flight> = new MatTableDataSource<Flight>([]);
  
  // Mobile view flag
  isMobile = signal<boolean>(false);
  
  // Sorting properties
  sortColumn = 'from_date';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  flights = signal<Flight[]>([]);
  isLoading = signal<boolean>(false);
  
  // Computed properties
  workerName = computed(() => this.flightService.selectedWorker()?.name || 'No worker selected');
  errorMessage = computed(() => this.flightService.errorMessage());
  activeColumns = computed(() => this.isMobile() ? this.mobileDisplayedColumns : this.displayedColumns);
  
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
  
  ngAfterViewInit() {
    // Monitor viewport size changes
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile.set(result.matches);
        this.cdr.detectChanges();
      });
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
    this.route.parent?.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
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
    
    // Отписка от всех подписок одной командой
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  
  loadFlights(workerId: number): void {
    const currentTime = Date.now();
    const cachedData = this.flightsCache.get(workerId);
    const lastFetch = this.lastFetchTime.get(workerId) || 0;
    
    // Show local loader
    this.isLoading.set(true);
    
    // Use cached data if it exists and isn't expired
    if (cachedData && (currentTime - lastFetch) < this.CACHE_TTL) {
      console.log('Using cached flight data');
      
      if (!this.haveFlightsChanged(cachedData, this.flights())) {
        console.log('Cached data matches current data, no UI update needed');
        this.isLoading.set(false);
        return;
      }
      
      this.updateFlightsDisplay(cachedData);
      return;
    }
    
    // Show global loader only for actual API calls
    this.loaderService.show();
    console.log(`Loading flights for worker ${workerId}`);
    
    this.flightService.getFlightsByWorkerId(workerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Update cache
          this.flightsCache.set(workerId, [...data]);
          this.lastFetchTime.set(workerId, currentTime);
          
          const hasDataChanged = this.haveFlightsChanged(data, this.flights());
          
          if (hasDataChanged) {
            this.updateFlightsDisplay(data);
          } else {
            this.isLoading.set(false);
            this.cdr.detectChanges();
          }
          
          // Hide global loader
          this.loaderService.hide();
          console.log('Finished loading flights, loader hidden');
        },
        error: (err) => {
          console.error('Error loading flights:', err);
          this.isLoading.set(false);
          this.loaderService.hide();
          this.cdr.detectChanges();
        }
      });
  }
  
  // Helper method to update the flights display
  private updateFlightsDisplay(data: Flight[]): void {
    this.flights.set(data);
    this.dataSource.data = data;
    
    // Re-apply current sort
    this.sortData(this.sortColumn);
    
    // Auto-select the first flight if there's data and no flight is selected
    if (data.length > 0 && !this.flightService.selectedFlight()) {
      this.selectFlight(data[0]);
    }
    
    this.isLoading.set(false);
    this.cdr.detectChanges();
  }
  
  /**
   * Сравнивает два массива полетов, чтобы определить, изменились ли данные
   * @param newFlights Новый массив полетов
   * @param currentFlights Текущий массив полетов
   * @returns true, если данные изменились; false, если данные идентичны
   */
  private haveFlightsChanged(newFlights: Flight[], currentFlights: Flight[]): boolean {
    // Быстрая проверка по длине массивов
    if (newFlights.length !== currentFlights.length) {
      return true;
    }
    
    // Создаем карту текущих полетов для быстрого поиска
    const currentFlightsMap = new Map(currentFlights.map(flight => [flight.id, flight]));
    
    // Проверяем каждый полет в новом массиве
    for (const newFlight of newFlights) {
      const currentFlight = currentFlightsMap.get(newFlight.id);
      
      // Если полет не найден или какие-либо свойства различаются
      if (!currentFlight ||
          newFlight.plane !== currentFlight.plane ||
          newFlight.from !== currentFlight.from ||
          newFlight.to !== currentFlight.to ||
          newFlight.from_date !== currentFlight.from_date ||
          newFlight.to_date !== currentFlight.to_date ||
          newFlight.from_gate !== currentFlight.from_gate ||
          newFlight.to_gate !== currentFlight.to_gate ||
          newFlight.duration !== currentFlight.duration) {
        return true;
      }
    }
    
    // Если все проверки пройдены, данные не изменились
    return false;
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
    
    // Use a single variable to track refresh status
    let refreshInProgress = false;
    
    // Refresh every minute (60000 ms)
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const workerId = this.flightService.selectedWorker()?.id;
        
        // Only refresh if not already in progress and there is a selected worker
        if (workerId && !refreshInProgress) {
          console.log(`Minute timer: starting refresh for worker ${workerId}`);
          
          // Set flag to prevent multiple refreshes
          refreshInProgress = true;
          
          // Force cache invalidation on timer refresh
          this.lastFetchTime.delete(workerId);
          this.flightService.clearFlightsCache(workerId);
          
          // Load flights and reset flag when done
          this.flightService.getFlightsByWorkerId(workerId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (data) => {
                console.log(`Refresh complete for worker ${workerId}`);
                
                // Update local cache
                this.flightsCache.set(workerId, [...data]);
                this.lastFetchTime.set(workerId, Date.now());
                
                // Update UI if data changed
                const hasDataChanged = this.haveFlightsChanged(data, this.flights());
                if (hasDataChanged) {
                  console.log('Refreshed data changed, updating UI');
                  this.updateFlightsDisplay(data);
                } else {
                  console.log('Refreshed data unchanged, no update needed');
                  this.isLoading.set(false);
                }
                
                // Reset flag
                refreshInProgress = false;
              },
              error: (err) => {
                console.error('Error during refresh:', err);
                this.isLoading.set(false);
                refreshInProgress = false;
              }
            });
        }
      });
  }
  
  private stopRefreshTimer(): void {
    // Не нужно делать ничего, так как takeUntil автоматически отпишется
  }
} 