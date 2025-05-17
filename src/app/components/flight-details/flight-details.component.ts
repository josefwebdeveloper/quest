import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightService } from '../../shared/services/flight.service';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-flight-details',
  standalone: true,
  imports: [CommonModule, DurationPipe],
  templateUrl: './flight-details.component.html',
  styleUrls: ['./flight-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightDetailsComponent {
  private flightService = inject(FlightService);

  selectedFlight = computed(() => this.flightService.selectedFlight());
  hasSelectedFlight = computed(() => !!this.selectedFlight());

  flightNumber = computed(() => this.selectedFlight()?.num || 'N/A');
  planeNumber = computed(() => this.selectedFlight()?.plane || 'N/A');
  duration = computed(() => this.selectedFlight()?.duration || 0);
  originGate = computed(() => this.selectedFlight()?.from_gate || 'N/A');
  destinationGate = computed(() => this.selectedFlight()?.to_gate || 'N/A');
  origin = computed(() => this.selectedFlight()?.from || 'N/A');
  destination = computed(() => this.selectedFlight()?.to || 'N/A');
}
