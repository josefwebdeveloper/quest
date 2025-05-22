import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkersListComponent } from '../../components/workers-list/workers-list.component';
import { FlightsTableComponent } from '../../components/flights-table/flights-table.component';
import { FlightDetailsComponent } from '../../components/flight-details/flight-details.component';
import { FlightService } from '../../shared/services/flight.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    RouterModule,
    WorkersListComponent,
    FlightsTableComponent,
    FlightDetailsComponent,
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent implements OnInit, OnDestroy {
  title = 'Worker Flights';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private flightService: FlightService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const workerId = params.get('id');

      if (workerId) {
        const id = parseInt(workerId, 10);

        if (this.flightService.hasWorkersLoaded()) {
          const worker = this.flightService.getWorkerById(id);
          if (worker) {
            this.flightService.setSelectedWorker(worker);
          } else {
            this.router.navigate(['/']);
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
