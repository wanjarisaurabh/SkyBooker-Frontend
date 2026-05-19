import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FlightService } from '../../../core/services/flight.service';
import { AirlineService } from '../../../core/services/airline.service';
import { Flight, Airline } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-flight-selection',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="page">
      <div class="container">
        <a routerLink="/flights/search" class="back"><span class="material-symbols-rounded">arrow_back</span> Back to results</a>
        @if (loading()) { <div class="loading"><div class="spinner"></div></div> }
        @if (!loading() && flight()) {
          <section class="hero">
            <div>
              <span class="eyebrow">Selected flight</span>
              <h1>{{ flight()!.originAirportCode }} to {{ flight()!.destinationAirportCode }}</h1>
              <p>{{ airline()?.name || 'Airline' }} · {{ flight()!.flightNumber }} · {{ flight()!.aircraftType }}</p>
            </div>
            <div class="price">
              <span>Starts at</span>
              <strong>₹{{ flight()!.basePrice.toLocaleString('en-IN') }}</strong>
              <small>per passenger</small>
            </div>
          </section>

          <section class="details">
            <div class="time-block">
              <span class="label">Departure</span>
              <strong>{{ formatTime(flight()!.departureTime) }}</strong>
              <span>{{ formatDate(flight()!.departureTime) }}</span>
              <b>{{ flight()!.originAirportCode }}</b>
            </div>
            <div class="duration">
              <span>{{ formatDuration(flight()!.durationMinutes) }}</span>
              <div></div>
              <small>Non-stop</small>
            </div>
            <div class="time-block right">
              <span class="label">Arrival</span>
              <strong>{{ formatTime(flight()!.arrivalTime) }}</strong>
              <span>{{ formatDate(flight()!.arrivalTime) }}</span>
              <b>{{ flight()!.destinationAirportCode }}</b>
            </div>
          </section>

          <section class="facts">
            <div><span>Status</span><strong>{{ flight()!.status.replace('_',' ') }}</strong></div>
            <div><span>Available seats</span><strong>{{ flight()!.availableSeats }}</strong></div>
            <div><span>Passengers</span><strong>{{ passengers }}</strong></div>
            <div><span>Trip</span><strong>{{ tripType.replace('_',' ') }}</strong></div>
          </section>

          <button class="continue" [disabled]="isPast() || isOver()" (click)="continue()">
            @if (isPast()) { Flight has Departed }
            @else if (isOver()) { Flight {{ flight()!.status.toLowerCase() }} }
            @else { Continue to Passenger Details }
            <span class="material-symbols-rounded">arrow_forward</span>
          </button>
          @if (isPast() || isOver()) {
            <div class="status-warning">
              <span class="material-symbols-rounded">info</span>
              This flight is no longer accepting bookings as it has already {{ isPast() ? 'departed' : flight()!.status.toLowerCase() }}.
            </div>
          }
        }
        @if (!loading() && error()) { <div class="error">{{ error() }}</div> }
      </div>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .page { flex: 1; background: var(--background); padding: 28px 0 56px; }
    .container { max-width: 980px; margin: 0 auto; padding: 0 24px; }
    .back { display: inline-flex; align-items: center; gap: 6px; color: var(--primary); text-decoration: none; font-weight: 800; font-size: 14px; margin-bottom: 16px; }
    .loading { display: flex; justify-content: center; padding: 60px; }
    .spinner { width: 30px; height: 30px; border: 3px solid var(--outline); border-top-color: var(--primary); border-radius: 50%; animation: spin .75s linear infinite; }
    .hero, .details, .facts {
      background: var(--surface);
      border: 1px solid var(--outline);
      border-radius: 16px;
      box-shadow: var(--glass-shadow);
    }
    .hero { display: flex; justify-content: space-between; gap: 20px; padding: 24px; margin-bottom: 14px; }
    .eyebrow { font-size: 11px; font-weight: 900; color: var(--primary); letter-spacing: .08em; text-transform: uppercase; }
    h1 { margin: 6px 0; font-size: 1.8rem; color: var(--on-surface); }
    p { margin: 0; color: var(--on-surface-variant); }
    .price { text-align: right; }
    .price span, .price small { display: block; color: var(--on-surface-variant); font-size: 12px; }
    .price strong { font-size: 1.9rem; color: var(--primary); }
    .details { display: grid; grid-template-columns: 1fr 180px 1fr; gap: 18px; padding: 22px; margin-bottom: 14px; }
    .time-block { display: flex; flex-direction: column; gap: 4px; }
    .time-block.right { text-align: right; }
    .label { font-size: 12px; color: var(--on-surface-variant); }
    .time-block strong { font-size: 1.7rem; color: var(--on-surface); }
    .time-block b { color: var(--primary); }
    .duration { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--on-surface-variant); font-size: 13px; }
    .duration div { width: 100%; height: 3px; border-radius: 999px; background: linear-gradient(90deg, var(--primary-light), #22d3ee); }
    .facts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; overflow: hidden; margin-bottom: 16px; background: var(--outline); }
    .facts div { padding: 16px; background: var(--surface); }
    .facts span { display: block; color: var(--on-surface-variant); font-size: 12px; margin-bottom: 5px; }
    .facts strong { color: var(--on-surface); text-transform: capitalize; }
    .continue {
      width: 100%;
      height: 52px;
      border: 0;
      border-radius: 12px;
      background: var(--grad-primary);
      color: #fff;
      font-weight: 900;
      font: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 10px 18px rgba(37, 99, 235, .22);
      transition: all 0.2s ease;
    }
    .continue:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
    .continue:disabled { opacity: 0.6; cursor: not-allowed; filter: grayscale(0.5); }
    .status-warning {
      display: flex; align-items: center; gap: 8px;
      padding: 14px; background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 12px; color: #b45309;
      font-size: 13px; font-weight: 600; margin-top: 12px;
    }
    .error { background: var(--clr-error-bg); border: 1px solid var(--clr-error); color: var(--clr-error); border-radius: 12px; padding: 14px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 720px) {
      .hero { flex-direction: column; }
      .price { text-align: left; }
      .details, .facts { grid-template-columns: 1fr; }
      .time-block.right { text-align: left; }
    }
  `]
})
export class FlightSelectionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly flightService = inject(FlightService);
  private readonly airlineService = inject(AirlineService);

  flight = signal<Flight | null>(null);
  airline = signal<Airline | null>(null);
  loading = signal(true);
  error = signal('');
  passengers = 1;
  tripType = 'ONE_WAY';

  isPast = signal(false);
  isOver = signal(false);

  ngOnInit(): void {
    const flightId = this.route.snapshot.paramMap.get('flightId') || '';
    const p = this.route.snapshot.queryParams;
    this.passengers = parseInt(p['passengers'] || '1');
    this.tripType = p['tripType'] || 'ONE_WAY';
    this.flightService.getFlightById(flightId).pipe(catchError(err => {
      this.error.set(err?.error?.message || 'Unable to load flight details.');
      return of(null);
    })).subscribe(f => {
      this.flight.set(f);
      this.loading.set(false);
      if (f) {
        const now = new Date().getTime();
        const depTime = new Date(f.departureTime).getTime();
        this.isPast.set(depTime < now);
        this.isOver.set(['DEPARTED', 'ARRIVED', 'CANCELLED'].includes(f.status));

        if (f.airlineId) {
          this.airlineService.getAirlineById(f.airlineId).pipe(catchError(() => of(null))).subscribe(a => this.airline.set(a));
        }
      }
    });
  }

  continue(): void {
    const f = this.flight();
    if (!f || this.isPast() || this.isOver()) return;
    this.router.navigate(['/booking/passengers', f.flightId], {
      queryParams: {
        passengers: this.passengers,
        tripType: this.tripType,
        basePrice: f.basePrice,
        departureTime: f.departureTime
      }
    });
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m ? m + 'm' : ''}`.trim();
  }
  formatTime(iso: string): string { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); }
  formatDate(iso: string): string { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
}
