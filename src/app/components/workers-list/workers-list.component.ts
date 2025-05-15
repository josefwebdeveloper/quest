import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FlightService } from '../../shared/services/flight.service';
import { Worker } from '../../shared/models/worker.model';
import { Subject, takeUntil } from 'rxjs';
import { LoaderService } from '../../shared/services/loader.service';

@Component({
  selector: 'app-workers-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workers-list.component.html',
  styleUrls: ['./workers-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkersListComponent implements OnInit, OnDestroy {
  private flightService = inject(FlightService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private loaderService = inject(LoaderService);
  
  private destroy$ = new Subject<void>();
  
  workers = signal<Worker[]>([]);
  
  // Computed property to get the error message from the service
  errorMessage = computed(() => this.flightService.errorMessage());
  
  ngOnInit(): void {
    this.loadWorkers();
  }
  
  loadWorkers(): void {
    // Only use global loader
    this.loaderService.show();
    
    this.flightService.getWorkers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.workers.set(data);
          this.loaderService.hide();
          
          // Check if there's a currently selected worker
          const selectedWorker = this.flightService.selectedWorker();
          
          // Handle worker selection by route or default
          if (!selectedWorker) {
            // Check if we have a route parameter for worker ID
            this.route.parent?.paramMap
              .pipe(takeUntil(this.destroy$))
              .subscribe(params => {
                const workerId = params.get('id');
                
                if (workerId) {
                  // Find the worker in our list
                  const id = parseInt(workerId, 10);
                  const workerFromRoute = data.find(w => w.id === id);
                  
                  if (workerFromRoute) {
                    // Set the worker but don't navigate again
                    this.flightService.setSelectedWorker(workerFromRoute);
                  } else if (data.length > 0) {
                    // If worker not found by route ID, select the first worker
                    this.selectWorker(data[0]);
                  }
                } else if (data.length > 0) {
                  // No route ID, select the first worker
                  this.selectWorker(data[0]);
                }
              });
          }
          
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error in worker component:', err);
          this.loaderService.hide();
          this.cdr.detectChanges();
        }
      });
  }
  
  retryLoadWorkers(): void {
    this.flightService.clearError();
    this.loadWorkers();
  }
  
  selectWorker(worker: Worker): void {
    if (!worker || worker.id === undefined || worker.id === null) {
      console.warn('Attempted to select an invalid worker');
      return;
    }
    
    // Set the selected worker in the service
    this.flightService.setSelectedWorker(worker);
    
    // Navigate to the worker-specific route
    this.router.navigate(['/workers', worker.id]);
  }
  
  isSelected(worker: Worker): boolean {
    if (!worker || worker.id === undefined || worker.id === null) {
      return false;
    }
    
    const selectedWorker = this.flightService.selectedWorker();
    if (!selectedWorker || selectedWorker.id === undefined || selectedWorker.id === null) {
      return false;
    }
    
    return selectedWorker.id === worker.id;
  }
  
  ngOnDestroy(): void {
    // Отписка от всех подписок одной командой
    this.destroy$.next();
    this.destroy$.complete();
  }
} 