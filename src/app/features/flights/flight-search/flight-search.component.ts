import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FlightService } from '../../../core/services/flight.service';
import { AirlineService } from '../../../core/services/airline.service';
import { AuthService } from '../../../core/services/auth.service';
import { SeatService } from '../../../core/services/seat.service';
import { Flight, Airline, Airport, FlightStatus } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { forkJoin, of, EMPTY } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './flight-search.component.html',
  styleUrl: './flight-search.component.css'
})
export class FlightSearchComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly flightService = inject(FlightService);
  private readonly airlineService = inject(AirlineService);
  private readonly seatService = inject(SeatService);
  readonly authService = inject(AuthService);

  // Query params
  origin = '';
  destination = '';
  date = '';
  returnDate = '';
  passengers = 1;
  tripType = 'ONE_WAY';

  // Data
  flights = signal<Flight[]>([]);
  returnFlights = signal<Flight[]>([]);
  airlines = signal<Map<string, Airline>>(new Map());
  airports = signal<Map<string, Airport>>(new Map());

  loading = signal(true);
  error = signal('');

  // Filters
  sortBy = signal<'price' | 'departure' | 'duration'>('price');
  filterStatus = signal<FlightStatus | ''>('');
  showFilters = signal(false);

  // Round trip tab
  activeTab = signal<'outbound' | 'return'>('outbound');

  // Pagination
  currentPage = signal(1);
  pageSize = 5;

  setFilterStatus(s: string): void { this.filterStatus.set(s as '' | FlightStatus); this.currentPage.set(1); }

  filteredFlights = computed(() => {
    let list = this.tripType === 'ROUND_TRIP' && this.activeTab() === 'return'
      ? this.returnFlights()
      : this.flights();

    if (this.filterStatus()) {
      list = list.filter(f => f.status === this.filterStatus());
    }

    // Exclude past flights
    const now = new Date().getTime();
    list = list.filter(f => {
      const depTime = new Date(f.departureTime).getTime();
      const isPast = depTime < now;
      const isOver = f.status === 'DEPARTED' || f.status === 'ARRIVED' || f.status === 'CANCELLED';
      return !isPast && !isOver;
    });

    switch (this.sortBy()) {
      case 'price': return [...list].sort((a,b) => a.basePrice - b.basePrice);
      case 'departure': return [...list].sort((a,b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
      case 'duration': return [...list].sort((a,b) => a.durationMinutes - b.durationMinutes);
      default: return list;
    }
  });

  paginatedFlights = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredFlights().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredFlights().length / this.pageSize));
  pagesArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  setPage(page: number): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setTab(tab: 'outbound' | 'return'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.origin = params['origin'] || '';
      this.destination = params['destination'] || '';
      this.date = params['date'] || '';
      this.returnDate = params['returnDate'] || '';
      this.passengers = parseInt(params['passengers'] || '1');
      this.tripType = params['tripType'] || 'ONE_WAY';
      this.loadFlights();
    });
  }

  private loadFlights(): void {
    this.loading.set(true);
    this.error.set('');

    if (!this.origin || !this.destination || !this.date) {
      this.loading.set(false);
      this.flights.set([]);
      this.returnFlights.set([]);
      this.error.set('Please search flights from Home to view results.');
      return;
    }

    if (this.tripType === 'ROUND_TRIP') {
      this.flightService.searchRoundTrip(this.origin, this.destination, this.date, this.returnDate)
        .pipe(catchError(() => {
          this.error.set('Failed to load flights. Please try again.');
          this.loading.set(false);
          return EMPTY;
        }))
        .subscribe(rt => {
          forkJoin({
            outbound: this.withLiveAvailability(rt.outboundFlights || []),
            returning: this.withLiveAvailability(rt.returnFlights || [])
          }).subscribe(({ outbound, returning }) => {
            this.flights.set(outbound);
            this.returnFlights.set(returning);
            this.loading.set(false);
            this.loadAirlineData();
          });
        });
    } else {
      this.flightService.searchFlights(this.origin, this.destination, this.date)
        .pipe(catchError(() => {
          this.error.set('Failed to load flights. Please try again.');
          this.loading.set(false);
          return EMPTY;
        }))
        .subscribe(list => {
          this.withLiveAvailability(list).subscribe(flights => {
            this.flights.set(flights);
            this.loading.set(false);
            this.loadAirlineData();
          });
        });
    }
  }

  private withLiveAvailability(flights: Flight[]) {
    if (flights.length === 0) return of([]);

    return forkJoin(flights.map(flight =>
      this.seatService.getAvailableSeats(flight.flightId).pipe(
        map(seats => ({ ...flight, availableSeats: seats.length })),
        catchError(() => of(flight))
      )
    ));
  }

  private loadAirlineData(): void {
    this.airlineService.getActiveAirlines().pipe(catchError(() => of([]))).subscribe(airlines => {
      const map = new Map<string, Airline>();
      airlines.forEach(a => map.set(a.airlineId, a));
      this.airlines.set(map);
    });
  }

  getAirline(airlineId: string): Airline | undefined {
    return this.airlines().get(airlineId);
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  getStatusClass(status: FlightStatus): string {
    const map: Record<string, string> = {
      ON_TIME: 'on-time', DELAYED: 'delayed', CANCELLED: 'cancelled',
      DEPARTED: 'departed', ARRIVED: 'arrived'
    };
    return map[status] || '';
  }

  seatsLeftLabel(flight: Flight): string {
    const count = flight.availableSeats ?? 0;
    return `${count} ${count === 1 ? 'seat' : 'seats'} left`;
  }

  selectFlight(flight: Flight): void {
    const now = new Date().getTime();
    const depTime = new Date(flight.departureTime).getTime();
    if (depTime < now || flight.availableSeats < this.passengers || ['DEPARTED', 'ARRIVED', 'CANCELLED'].includes(flight.status)) {
      return;
    }
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.router.navigate(['/flights/select', flight.flightId], {
      queryParams: {
        passengers: this.passengers,
        tripType: this.tripType,
        basePrice: flight.basePrice,
        departureTime: flight.departureTime
      }
    });
  }
}
