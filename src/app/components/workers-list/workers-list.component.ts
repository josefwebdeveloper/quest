import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
        
        // Select the first worker by default if available
        if (data.length > 0 && !this.flightService.selectedWorker()) {
          this.selectWorker(data[0]);
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
    this.flightService.setSelectedWorker(worker);
  }
  
  isSelected(worker: Worker): boolean {
    return this.flightService.selectedWorker()?.id === worker.id;
  }
} 