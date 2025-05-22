import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlightDetailsComponent } from './flight-details.component';
import { FlightService } from '../../shared/services/flight.service';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { Flight } from '../../shared/models/flight.model';
import { ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';

describe('FlightDetailsComponent', () => {
  let component: FlightDetailsComponent;
  let fixture: ComponentFixture<FlightDetailsComponent>;
  let flightServiceMock: Partial<FlightService>;
  let selectedFlightSignal: any;

  // Mock flight data
  const mockFlight: Flight = {
    id: 'flight-123',
    from: 'New York',
    to: 'London',
    from_date: '01/01/2023',
    to_date: '01/01/2023',
    plane: 'Boeing 747',
    duration: 420, // 7h 0m
    from_gate: 12,
    to_gate: 43,
  };

  beforeEach(async () => {
    // Create a signal for the selected flight that we can update in tests
    selectedFlightSignal = signal<Flight | null>(null);

    // Create a FlightService mock with signal
    flightServiceMock = {
      selectedFlight: selectedFlightSignal
    };

    await TestBed.configureTestingModule({
      imports: [FlightDetailsComponent, DurationPipe],
      providers: [{ provide: FlightService, useValue: flightServiceMock }],
    })
      .overrideComponent(FlightDetailsComponent, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlightDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display "Select a flight to view details" when no flight is selected', () => {
    // Ensure no flight is selected
    selectedFlightSignal.set(null);
    fixture.detectChanges();

    const noFlightElement = fixture.debugElement.query(By.css('.no-flight'));
    expect(noFlightElement).toBeTruthy();
    expect(noFlightElement.nativeElement.textContent).toContain(
      'Select a flight to view details',
    );

    // Check that details container is not displayed
    const detailsContainer = fixture.debugElement.query(
      By.css('.details-container'),
    );
    expect(detailsContainer).toBeFalsy();
  });

  it('should display flight details when a flight is selected', () => {
    // Set a selected flight
    selectedFlightSignal.set(mockFlight);
    fixture.detectChanges();

    // Verify the no-flight message is not displayed
    const noFlightElement = fixture.debugElement.query(By.css('.no-flight'));
    expect(noFlightElement).toBeFalsy();

    // Check that details container is displayed
    const detailsContainer = fixture.debugElement.query(
      By.css('.details-container'),
    );
    expect(detailsContainer).toBeTruthy();

    // Check that the plane number is displayed in the badge
    const flightBadge = fixture.debugElement.query(By.css('.flight-badge'));
    expect(flightBadge).toBeTruthy();
    expect(flightBadge.nativeElement.textContent).toContain('Boeing 747');

    // Check duration
    const durationValue = fixture.debugElement.query(By.css('.duration-value'));
    expect(durationValue).toBeTruthy();
    expect(durationValue.nativeElement.textContent).toContain('7h 0m');

    // Check gates
    const values = fixture.debugElement.queryAll(By.css('.value'));
    expect(values.length).toBe(2);
    expect(values[0].nativeElement.textContent).toContain('12'); // Origin gate
    expect(values[1].nativeElement.textContent).toContain('43'); // Destination gate
  });

  it('should display "N/A" for plane when the value is missing', () => {
    // Mock a flight with missing plane info
    const incompleteFlightMock = { ...mockFlight, plane: undefined };
    selectedFlightSignal.set(incompleteFlightMock);
    fixture.detectChanges();

    // Check for N/A in the displayed plane number
    const flightBadge = fixture.debugElement.query(By.css('.flight-badge'));
    expect(flightBadge).toBeTruthy();
    expect(flightBadge.nativeElement.textContent).toContain('N/A');
  });

  it('should display "N/A" for gates when values are missing', () => {
    // Mock a flight with missing gate info
    const incompleteFlightMock = {
      ...mockFlight,
      from_gate: undefined,
      to_gate: undefined,
    };
    selectedFlightSignal.set(incompleteFlightMock);
    fixture.detectChanges();

    // Check for N/A in the gates
    const values = fixture.debugElement.queryAll(By.css('.value'));
    expect(values.length).toBe(2);
    expect(values[0].nativeElement.textContent).toContain('N/A'); // Origin gate
    expect(values[1].nativeElement.textContent).toContain('N/A'); // Destination gate
  });

  it('should show duration as "0h 0m" when duration is missing', () => {
    // Mock a flight with missing duration
    const incompleteFlightMock = { ...mockFlight, duration: undefined };
    selectedFlightSignal.set(incompleteFlightMock);
    fixture.detectChanges();

    // Check duration format
    const durationValue = fixture.debugElement.query(By.css('.duration-value'));
    expect(durationValue).toBeTruthy();
    expect(durationValue.nativeElement.textContent).toContain('0h 0m');
  });

  it('should correctly format the duration using the DurationPipe', () => {
    // Test different durations
    const testCases = [
      { duration: 60, expected: '1h 0m' },
      { duration: 90, expected: '1h 30m' },
      { duration: 135, expected: '2h 15m' },
      { duration: 0, expected: '0h 0m' },
    ];

    // Test each duration case
    for (const testCase of testCases) {
      const flightWithDuration = { ...mockFlight, duration: testCase.duration };
      selectedFlightSignal.set(flightWithDuration);
      fixture.detectChanges();

      const durationValue = fixture.debugElement.query(
        By.css('.duration-value'),
      );
      expect(durationValue.nativeElement.textContent).toContain(
        testCase.expected,
      );
    }
  });
});
