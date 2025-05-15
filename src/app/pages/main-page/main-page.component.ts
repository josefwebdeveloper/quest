import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkersListComponent } from '../../components/workers-list/workers-list.component';
import { FlightsTableComponent } from '../../components/flights-table/flights-table.component';
import { FlightDetailsComponent } from '../../components/flight-details/flight-details.component';
import { FlightService } from '../../shared/services/flight.service';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    RouterModule,
    WorkersListComponent,
    FlightsTableComponent,
    FlightDetailsComponent
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent implements OnInit {
  title = 'Worker Flights';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private flightService: FlightService
  ) {}
  
  ngOnInit(): void {
    // Check if we're on a worker route
    this.route.paramMap.subscribe(params => {
      const workerId = params.get('id');
      
      if (workerId) {
        // Convert to number as route params are strings
        const id = parseInt(workerId, 10);
        
        // Check if we already have loaded workers
        if (this.flightService.hasWorkersLoaded()) {
          const worker = this.flightService.getWorkerById(id);
          if (worker) {
            this.flightService.setSelectedWorker(worker);
          } else {
            // If worker not found, redirect to home page
            this.router.navigate(['/']);
          }
        } else {
          // Load workers data first, then select the worker
          this.flightService.getWorkers().subscribe({
            next: (workers) => {
              const worker = this.flightService.getWorkerById(id);
              if (worker) {
                this.flightService.setSelectedWorker(worker);
              } else {
                // If worker not found, redirect to home
                this.router.navigate(['/']);
              }
            },
            error: (err) => {
              console.error('Failed to load workers:', err);
            }
          });
        }
      }
    });
  }
} 