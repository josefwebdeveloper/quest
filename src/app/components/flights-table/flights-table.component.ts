import {
  Component,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
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
    ReactiveFormsModule,
  ],
  templateUrl: './flights-table.component.html',
  styleUrls: ['./flights-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightsTableComponent implements OnInit, OnDestroy, AfterViewInit {
  private flightService = inject(FlightService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private breakpointObserver = inject(BreakpointObserver);
  private loaderService = inject(LoaderService);
  private destroy$ = new Subject<void>();

  private timerSubscription: Subscription | null = null;

  private flightsCache = new Map<number, Flight[]>();
  private lastFetchTime = new Map<number, number>();

  displayedColumns: string[] = ['plane', 'from', 'from_date', 'to', 'to_date'];
  mobileDisplayedColumns: string[] = ['plane', 'from', 'to'];
  dataSource: MatTableDataSource<Flight> = new MatTableDataSource<Flight>([]);

  isMobile = signal<boolean>(false);

  sortColumn = 'from_date';
  sortDirection: 'asc' | 'desc' = 'asc';

  flights = signal<Flight[]>([]);
  isLoading = signal<boolean>(false);

  workerName = computed(
    () => this.flightService.selectedWorker()?.name || 'No worker selected',
  );
  errorMessage = computed(() => this.flightService.errorMessage());
  activeColumns = computed(() =>
    this.isMobile() ? this.mobileDisplayedColumns : this.displayedColumns,
  );

  ngOnInit() {
    this.dataSource.filterPredicate = (data: Flight, filter: string) => {
      const searchStr =
        (data.plane ?? '') +
        (data.from ?? '') +
        (data.from_date ?? '') +
        (data.to ?? '') +
        (data.to_date ?? '');
      return searchStr.toLowerCase().includes(filter);
    };

    this.sortData(this.sortColumn);
  }

  ngAfterViewInit() {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.isMobile.set(result.matches);
        this.cdr.detectChanges();
      });
  }

  private parseDateString(dateStr: string): Date {
    if (!dateStr) return new Date(0);

    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      return new Date(year, month, day);
    }

    return new Date(dateStr);
  }

  sortData(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    const sortedData = [...this.dataSource.data].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      if (column === 'from_date' || column === 'to_date') {
        const aVal = a[column as keyof Flight] as string;
        const bVal = b[column as keyof Flight] as string;

        valueA = this.parseDateString(aVal).getTime();
        valueB = this.parseDateString(bVal).getTime();
      } else {
        valueA = a[column as keyof Flight];
        valueB = b[column as keyof Flight];
      }

      if (valueA === undefined) valueA = '';
      if (valueB === undefined) valueB = '';

      const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.dataSource.data = sortedData;
    this.cdr.detectChanges();
  }

  constructor() {
    this.route.parent?.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const workerId = params.get('id');
        if (workerId) {
          const id = parseInt(workerId, 10);
          const worker = this.flightService.getWorkerById(id);

          if (worker && worker.id !== this.flightService.selectedWorker()?.id) {
            this.flightService.setSelectedWorker(worker);
          }
        }
      });

    effect(() => {
      const selectedWorker = this.flightService.selectedWorker();
      if (selectedWorker) {
        this.flightsCache.delete(selectedWorker.id);
        this.flightService.clearFlightsCache(selectedWorker.id);
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

    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  loadFlights(workerId: number): void {
    const currentTime = Date.now();

    this.isLoading.set(true);
    this.loaderService.show();

    this.flightService
      .getFlightsByWorkerId(workerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.flightsCache.set(workerId, [...data]);
          this.lastFetchTime.set(workerId, currentTime);

          const hasDataChanged = this.haveFlightsChanged(data, this.flights());

          if (hasDataChanged) {
            this.updateFlightsDisplay(data);
          } else {
            this.isLoading.set(false);
            this.cdr.detectChanges();
          }

          this.loaderService.hide();
        },
        error: (err) => {
          console.error('Error loading flights:', err);
          this.isLoading.set(false);
          this.loaderService.hide();
          this.cdr.detectChanges();
        },
      });
  }

  private updateFlightsDisplay(data: Flight[]): void {
    this.flights.set(data);
    this.dataSource.data = data;

    this.sortData(this.sortColumn);

    if (data.length > 0 && !this.flightService.selectedFlight()) {
      this.selectFlight(data[0]);
    }

    this.isLoading.set(false);
    this.cdr.detectChanges();
  }

  private haveFlightsChanged(
    newFlights: Flight[],
    currentFlights: Flight[],
  ): boolean {
    if (newFlights.length !== currentFlights.length) {
      return true;
    }

    const currentFlightsMap = new Map(
      currentFlights.map((flight) => [flight.id, flight]),
    );

    for (const newFlight of newFlights) {
      const currentFlight = currentFlightsMap.get(newFlight.id);

      if (
        !currentFlight ||
        newFlight.plane !== currentFlight.plane ||
        newFlight.from !== currentFlight.from ||
        newFlight.to !== currentFlight.to ||
        newFlight.from_date !== currentFlight.from_date ||
        newFlight.to_date !== currentFlight.to_date ||
        newFlight.from_gate !== currentFlight.from_gate ||
        newFlight.to_gate !== currentFlight.to_gate ||
        newFlight.duration !== currentFlight.duration
      ) {
        return true;
      }
    }

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
    this.stopRefreshTimer();

    let refreshInProgress = false;

    this.timerSubscription = interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const workerId = this.flightService.selectedWorker()?.id;

        if (workerId && !refreshInProgress) {
          refreshInProgress = true;

          this.flightService.clearFlightsCache(workerId);

          this.flightService
            .getFlightsByWorkerId(workerId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (data) => {
                this.flightsCache.set(workerId, [...data]);
                this.lastFetchTime.set(workerId, Date.now());

                const hasDataChanged = this.haveFlightsChanged(
                  data,
                  this.flights(),
                );
                if (hasDataChanged) {
                  this.updateFlightsDisplay(data);
                } else {
                  this.isLoading.set(false);
                }

                refreshInProgress = false;
              },
              error: (err) => {
                console.error('Error during refresh:', err);
                this.isLoading.set(false);
                refreshInProgress = false;
              },
            });
        }
      });
  }

  private stopRefreshTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }
}
