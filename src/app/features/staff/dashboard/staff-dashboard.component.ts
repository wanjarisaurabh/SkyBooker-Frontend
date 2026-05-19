import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FlightService } from '../../../core/services/flight.service';
import { BookingService } from '../../../core/services/booking.service';
import { AirlineService } from '../../../core/services/airline.service';
import { Flight, Booking, Airline, Airport, FlightStatus } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { catchError, finalize, of, timeout } from 'rxjs';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.css'
})
export class StaffDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly flightService = inject(FlightService);
  private readonly bookingService = inject(BookingService);
  private readonly airlineService = inject(AirlineService);

  user = computed(() => this.authService.currentUser());

  flights = signal<Flight[]>([]);
  selectedFlight = signal<Flight | null>(null);
  flightBookings = signal<Booking[]>([]);
  airlines = signal<Airline[]>([]);

  loading = signal(true);
  bookingsLoading = signal(false);
  updateStatusVal: FlightStatus = 'ON_TIME';
  selectedAirlineId = '';       // for ngModel binding

  fleetSummary = computed(() => {
    const counts: Record<string, number> = {};
    this.flights().forEach(f => {
      counts[f.aircraftType] = (counts[f.aircraftType] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  });

  showStatusModal = signal(false);
  statusUpdating = signal(false);
  statusUpdateSuccess = signal('');
  statusUpdateError = signal('');

  // Pagination
  flightsPage = signal(1);
  flightsPageSize = 8;
  manifestPage = signal(1);
  manifestPageSize = 6;

  // Add Flight form
  showAddFlightModal = signal(false);
  airports = signal<Airport[]>([]);
  flightForm: any = {
    flightNumber: '', airlineId: '', originAirportCode: '', destinationAirportCode: '',
    departureTime: '', arrivalTime: '', basePrice: 0, totalSeats: 180, availableSeats: 180,
    durationMinutes: 120, aircraftType: 'A320', status: 'ON_TIME'
  };
  addFlightLoading = signal(false);
  addFlightError = signal('');

  ngOnInit(): void {
    this.airlineService.getAllAirlines().pipe(catchError(() => of([]))).subscribe(a => {
      this.airlines.set(a);
    });
    this.airlineService.getAllAirports().pipe(catchError(() => of([]))).subscribe(p => {
      this.airports.set(p);
    });

    // For demo: load all airlines' flights
    // In real app: staff's airlineId from profile
    this.loading.set(false);
  }

  paginatedFlights = computed(() => {
    const start = (this.flightsPage() - 1) * this.flightsPageSize;
    return this.flights().slice(start, start + this.flightsPageSize);
  });

  flightsTotalPages = computed(() => Math.ceil(this.flights().length / this.flightsPageSize));
  flightsPagesArray = computed(() => Array.from({ length: this.flightsTotalPages() }, (_, i) => i + 1));

  paginatedManifest = computed(() => {
    const start = (this.manifestPage() - 1) * this.manifestPageSize;
    return this.flightBookings().slice(start, start + this.manifestPageSize);
  });

  manifestTotalPages = computed(() => Math.ceil(this.flightBookings().length / this.manifestPageSize));
  manifestPagesArray = computed(() => Array.from({ length: this.manifestTotalPages() }, (_, i) => i + 1));

  setFlightsPage(page: number): void {
    this.flightsPage.set(page);
  }

  setManifestPage(page: number): void {
    this.manifestPage.set(page);
  }

  loadFlightsByAirline(airlineId: string): void {
    this.loading.set(true);
    this.flightsPage.set(1);
    this.flightService.getFlightsByAirline(airlineId).pipe(catchError(() => of([]))).subscribe(f => {
      this.flights.set(f);
      const selectedId = this.selectedFlight()?.flightId;
      const refreshedSelection = selectedId ? f.find(flight => flight.flightId === selectedId) : null;
      if (refreshedSelection) {
        this.selectedFlight.set(refreshedSelection);
      }
      this.loading.set(false);
    });
  }

  selectFlight(flight: Flight): void {
    this.selectedFlight.set(flight);
    this.manifestPage.set(1);
    this.loadBookings(flight.flightId);
  }

  loadBookings(flightId: string): void {
    this.bookingsLoading.set(true);
    this.bookingService.getBookingsByFlight(flightId).pipe(catchError(() => of([]))).subscribe(b => {
      this.flightBookings.set(b);
      this.bookingsLoading.set(false);
    });
  }

  openStatusModal(flight: Flight): void {
    this.selectedFlight.set(flight);
    this.updateStatusVal = flight.status as FlightStatus;
    
    // Pre-fill form for potential editing (though current modal only shows status)
    this.flightForm = { ...flight };
    
    this.statusUpdating.set(false);
    this.statusUpdateSuccess.set('');
    this.statusUpdateError.set('');
    this.showStatusModal.set(true);
  }

  updateFlightStatus(): void {
    const flight = this.selectedFlight();
    if (!flight || this.statusUpdating()) return;

    this.statusUpdating.set(true);
    this.statusUpdateSuccess.set('');
    this.statusUpdateError.set('');

    this.flightService.updateFlightStatus(flight.flightId, this.updateStatusVal).pipe(
      timeout(6000),
      finalize(() => this.statusUpdating.set(false))
    ).subscribe({
      next: (updated) => {
        const list = this.flights().map(f => f.flightId === updated.flightId ? updated : f);
        this.flights.set(list);
        this.selectedFlight.set(updated);
        this.statusUpdateSuccess.set('Status updated successfully!');
        if (this.selectedAirlineId) {
          this.loadFlightsByAirline(this.selectedAirlineId);
        }
        setTimeout(() => {
          this.showStatusModal.set(false);
          this.statusUpdateSuccess.set('');
        }, 700);
      },
      error: (err) => {
        if (err?.name === 'TimeoutError') {
          this.statusUpdateError.set('The update is taking too long. Please restart the flight service and try again.');
          return;
        }
        const backendMessage = err?.error?.message || err?.error?.error || err?.message;
        this.statusUpdateError.set(backendMessage || 'Failed to update status.');
      }
    });
  }

  closeModal(): void { this.showStatusModal.set(false); }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getStatusClass(status: string): string {
    const m: Record<string, string> = { ON_TIME: 'on-time', DELAYED: 'delayed', CANCELLED: 'cancelled', DEPARTED: 'departed', ARRIVED: 'arrived' };
    return m[status] || '';
  }

  getBookingStatusClass(status: string): string {
    const flight = this.selectedFlight();
    if (flight && status === 'NO_SHOW' && new Date(flight.departureTime) < new Date()) {
      return 'status-completed';
    }
    const m: Record<string, string> = { CONFIRMED: 'status-confirmed', PENDING: 'status-pending', CANCELLED: 'status-cancelled', COMPLETED: 'status-completed', DEPARTED: 'status-completed' };
    return m[status] || '';
  }

  getDisplayBookingStatus(status: string): string {
    const flight = this.selectedFlight();
    if (flight && status === 'NO_SHOW' && new Date(flight.departureTime) < new Date()) {
      return 'DEPARTED';
    }
    return status.replace('_', ' ');
  }

  statuses: FlightStatus[] = ['ON_TIME', 'DELAYED', 'CANCELLED', 'DEPARTED', 'ARRIVED'];

  openAddFlightModal(): void {
    this.flightForm = {
      flightNumber: '', airlineId: this.selectedAirlineId || '', originAirportCode: '', destinationAirportCode: '',
      departureTime: '', arrivalTime: '', basePrice: 0, totalSeats: 180, availableSeats: 180, durationMinutes: 120, aircraftType: 'A320', status: 'ON_TIME'
    };
    this.addFlightError.set('');
    this.showAddFlightModal.set(true);
  }

  addFlight(): void {
    if (!this.flightForm.flightNumber || !this.flightForm.airlineId || !this.flightForm.originAirportCode || !this.flightForm.destinationAirportCode) {
      this.addFlightError.set('Please fill in all required fields.'); return;
    }
    this.flightForm.availableSeats = this.flightForm.totalSeats;
    this.flightForm.durationMinutes = this.calculateDurationMinutes(this.flightForm.departureTime, this.flightForm.arrivalTime);
    this.addFlightLoading.set(true);
    this.addFlightError.set('');
    this.flightService.addFlight(this.flightForm).subscribe({
      next: (f) => {
        this.flights.update(list => [f, ...list]);
        this.addFlightLoading.set(false);
        this.showAddFlightModal.set(false);
      },
      error: (err) => {
        this.addFlightLoading.set(false);
        this.addFlightError.set(err?.error?.message || 'Failed to add flight.');
      }
    });
  }

  private calculateDurationMinutes(departure: string, arrival: string): number {
    const dep = new Date(departure).getTime();
    const arr = new Date(arrival).getTime();
    if (!Number.isFinite(dep) || !Number.isFinite(arr) || arr <= dep) return 120;
    return Math.round((arr - dep) / 60000);
  }
}
