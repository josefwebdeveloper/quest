import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FlightService } from '../../shared/services/flight.service';
import { Worker } from '../../shared/models/worker.model';

@Component({
  selector: 'app-workers-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workers-list.component.html',
  styleUrls: ['./workers-list.component.scss']
})
export class WorkersListComponent implements OnInit {
  private flightService = inject(FlightService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  workers = signal<Worker[]>([]);
  
  // Computed property to get the error message from the service
  errorMessage = computed(() => this.flightService.errorMessage());
  
  ngOnInit(): void {
    this.loadWorkers();
  }
  
  loadWorkers(): void {
    this.flightService.getWorkers().subscribe({
      next: (data) => {
        this.workers.set(data);
        
        // Check if there's a currently selected worker
        const selectedWorker = this.flightService.selectedWorker();
        
        // Handle worker selection by route or default
        if (!selectedWorker) {
          // Check if we have a route parameter for worker ID
          this.route.parent?.paramMap.subscribe(params => {
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
      },
      error: (err) => {
        console.error('Error in worker component:', err);
      }
    });
  }
  
  retryLoadWorkers(): void {
    this.flightService.clearError();
    this.loadWorkers();
  }
  
  selectWorker(worker: Worker): void {
    // Set the selected worker in the service
    this.flightService.setSelectedWorker(worker);
    
    // Navigate to the worker-specific route
    this.router.navigate(['/workers', worker.id]);
  }
  
  isSelected(worker: Worker): boolean {
    return this.flightService.selectedWorker()?.id === worker.id;
  }
} 