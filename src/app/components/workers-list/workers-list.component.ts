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
  
  errorMessage = computed(() => this.flightService.errorMessage());
  
  ngOnInit(): void {
    this.loadWorkers();
  }
  
  loadWorkers(): void {
    this.loaderService.show();
    
    this.flightService.getWorkers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.workers.set(data);
          this.loaderService.hide();
          
          const selectedWorker = this.flightService.selectedWorker();
          
          if (!selectedWorker) {
            this.route.parent?.paramMap
              .pipe(takeUntil(this.destroy$))
              .subscribe(params => {
                const workerId = params.get('id');
                
                if (workerId) {
                  const id = parseInt(workerId, 10);
                  const workerFromRoute = data.find(w => w.id === id);
                  
                  if (workerFromRoute) {
                    this.flightService.setSelectedWorker(workerFromRoute);
                  } else if (data.length > 0) {
                    this.selectWorker(data[0]);
                  }
                } else if (data.length > 0) {
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
    
    this.flightService.setSelectedWorker(worker);
    
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
    this.destroy$.next();
    this.destroy$.complete();
  }
} 