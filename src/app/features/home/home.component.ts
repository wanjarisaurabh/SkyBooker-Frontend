import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AirlineService } from '../../core/services/airline.service';
import { Airport, TripType } from '../../core/models/index';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of, catchError } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private readonly airlineService = inject(AirlineService);
  private readonly router = inject(Router);


  // Trip type
  tripType: TripType = 'ONE_WAY';

  // Origin / Destination
  origin = '';
  originCode = '';
  destination = '';
  destinationCode = '';
  departureDate = '';
  returnDate = '';

  // Passengers
  passengers = 1;
  showPassengerDropdown = signal(false);

  // Airport autocomplete
  originResults = signal<Airport[]>([]);
  destinationResults = signal<Airport[]>([]);
  showOriginDropdown = signal(false);
  showDestDropdown = signal(false);
  originLoading = signal(false);
  destLoading = signal(false);

  // Search error
  searchError = signal('');

  private originSearch$ = new Subject<string>();
  private destSearch$ = new Subject<string>();

  // Today for min date
  today = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.originSearch$.pipe(
      debounceTime(280),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) { this.originResults.set([]); return of([] as Airport[]); }
        this.originLoading.set(true);
        return this.airlineService.searchAirports(q).pipe(catchError(() => of([] as Airport[])));
      })
    ).subscribe(r => { this.originResults.set(r as Airport[]); this.originLoading.set(false); });

    this.destSearch$.pipe(
      debounceTime(280),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) { this.destinationResults.set([]); return of([] as Airport[]); }
        this.destLoading.set(true);
        return this.airlineService.searchAirports(q).pipe(catchError(() => of([] as Airport[])));
      })
    ).subscribe(r => { this.destinationResults.set(r as Airport[]); this.destLoading.set(false); });
  }

  onOriginInput(val: string): void {
    const upper = val.toUpperCase();
    if (this.origin !== upper) {
      this.origin = upper;
    }
    this.originCode = '';
    this.showOriginDropdown.set(true);
    this.originSearch$.next(upper);
  }

  onDestInput(val: string): void {
    const upper = val.toUpperCase();
    if (this.destination !== upper) {
      this.destination = upper;
    }
    this.destinationCode = '';
    this.showDestDropdown.set(true);
    this.destSearch$.next(upper);
  }

  selectOrigin(airport: Airport): void {
    this.origin = `${airport.city} (${airport.iataCode})`.toUpperCase();
    this.originCode = airport.iataCode;
    this.originResults.set([]);
    this.showOriginDropdown.set(false);
  }

  selectDest(airport: Airport): void {
    this.destination = `${airport.city} (${airport.iataCode})`.toUpperCase();
    this.destinationCode = airport.iataCode;
    this.destinationResults.set([]);
    this.showDestDropdown.set(false);
  }

  swapRoutes(): void {
    [this.origin, this.destination] = [this.destination, this.origin];
    [this.originCode, this.destinationCode] = [this.destinationCode, this.originCode];
  }

  adjustPassengers(delta: number): void {
    const next = this.passengers + delta;
    if (next >= 1 && next <= 9) this.passengers = next;
  }

  get returnDateMin(): string {
    return this.departureDate || this.today;
  }

  search(): void {
    this.searchError.set('');

    // If user typed but did not select from dropdown, use the typed text as IATA/city code
    const resolvedOrigin = this.originCode || this.origin.trim().toUpperCase().slice(0, 3);
    const resolvedDest = this.destinationCode || this.destination.trim().toUpperCase().slice(0, 3);

    if (!this.origin.trim()) { this.searchError.set('Please enter a departure city or airport.'); return; }
    if (!this.destination.trim()) { this.searchError.set('Please enter a destination city or airport.'); return; }
    if (!this.departureDate) { this.searchError.set('Please select a departure date.'); return; }
    if (this.tripType === 'ROUND_TRIP' && !this.returnDate) {
      this.searchError.set('Please select a return date.'); return;
    }

    const params: Record<string, string> = {
      origin: resolvedOrigin,
      destination: resolvedDest,
      date: this.departureDate,
      passengers: String(this.passengers),
      tripType: this.tripType
    };

    if (this.tripType === 'ROUND_TRIP') {
      params['returnDate'] = this.returnDate;
    }

    this.router.navigate(['/flights/search'], { queryParams: params });
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.search-field-wrap')) {
      this.showOriginDropdown.set(false);
      this.showDestDropdown.set(false);
      this.showPassengerDropdown.set(false);
    }
  }
}
