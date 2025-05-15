import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkersListComponent } from './components/workers-list/workers-list.component';
import { FlightsTableComponent } from './components/flights-table/flights-table.component';
import { FlightDetailsComponent } from './components/flight-details/flight-details.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    WorkersListComponent,
    FlightsTableComponent,
    FlightDetailsComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Worker Flights';
}
