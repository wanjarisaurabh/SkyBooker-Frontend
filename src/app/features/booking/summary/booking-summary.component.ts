import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { FlightService } from '../../../core/services/flight.service';
import { PassengerService } from '../../../core/services/passenger.service';
import { Booking, Flight, PassengerInfo } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-booking-summary',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="page">
      <div class="container">
        <div class="steps"><span class="done">1. Flight</span><b>›</b><span class="done">2. Passenger</span><b>›</b><span class="done">3. Seat</span><b>›</b><span class="done">4. Add-ons</span><b>›</b><span class="active">Summary</span></div>
        <h1>Booking Summary</h1>
        @if (loading()) { <div class="loading"><div class="spinner"></div></div> }
        @if (!loading() && booking()) {
          <div class="grid">
            <section class="panel">
              <h2>Flight</h2>
              @if (flight()) {
                <div class="route">{{ flight()!.originAirportCode }} <span class="material-symbols-rounded">arrow_forward</span> {{ flight()!.destinationAirportCode }}</div>
                <p>{{ flight()!.flightNumber }} · {{ formatDateTime(flight()!.departureTime) }}</p>
              }
            </section>
            <section class="panel">
              <h2>Passenger</h2>
              @if (passenger()) {
                <p><strong>{{ passenger()!.title }} {{ passenger()!.firstName }} {{ passenger()!.lastName }}</strong></p>
                <p>{{ passenger()!.passengerType }} · Seat {{ passenger()!.seatNumber || seatNumber }}</p>
              }
            </section>
            <section class="panel">
              <h2>Add-ons</h2>
              <p>Meal: {{ booking()!.mealPreference || 'None' }}</p>
              <p>Extra luggage: {{ booking()!.luggageKg || 0 }} kg</p>
              <p>Priority boarding: {{ addons?.priorityBoarding ? 'Yes' : 'No' }}</p>
            </section>
            <aside class="pay">
              <h2>Fare</h2>
              <div><span>Base fare</span><strong>₹{{ booking()!.baseFare.toLocaleString('en-IN') }}</strong></div>
              <div><span>Taxes</span><strong>₹{{ booking()!.taxes.toLocaleString('en-IN') }}</strong></div>
              <div><span>Add-ons included</span><strong>₹{{ addonCost.toLocaleString('en-IN') }}</strong></div>
              <div class="total"><span>Total</span><strong>₹{{ (booking()!.baseFare + booking()!.taxes + addonCost).toLocaleString('en-IN') }}</strong></div>
              <button (click)="pay()">Proceed to Payment <span class="material-symbols-rounded">arrow_forward</span></button>
              <a [routerLink]="['/booking/addons', booking()!.bookingId]" [queryParams]="{ flightId: flight()?.flightId, passengerId: passenger()?.passengerId, seatNumber: seatNumber }">Edit add-ons</a>
            </aside>
          </div>
        }
        @if (error()) { <div class="error">{{ error() }}</div> }
      </div>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    :host{display:flex;flex-direction:column;min-height:100vh}.page{flex:1;background:var(--background);padding:28px 0 56px}.container{max-width:1050px;margin:0 auto;padding:0 24px}.steps{display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--on-surface-muted);font-size:13px;font-weight:800;margin-bottom:18px}.done{color:var(--success)}.active{color:var(--primary)}h1{font-size:1.5rem;color:var(--on-surface);margin:0 0 18px}.loading{display:flex;justify-content:center;padding:60px}.spinner{width:30px;height:30px;border:3px solid var(--outline);border-top-color:var(--primary);border-radius:50%;animation:spin .75s linear infinite}.grid{display:grid;grid-template-columns:1fr 1fr 320px;gap:16px;align-items:start}.panel,.pay{background:var(--surface);border:1px solid var(--outline);border-radius:18px;padding:22px;box-shadow:var(--glass-shadow)}.panel:nth-child(3){grid-column:1 / 3}.pay{grid-column:3;grid-row:1 / 4}h2{font-size:16px;color:var(--on-surface);margin:0 0 14px}.route{display:flex;align-items:center;gap:8px;font-size:20px;font-weight:900;color:var(--on-surface)}p{color:var(--on-surface-variant);margin:6px 0}.pay div{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--outline)}.total strong{color:var(--primary);font-size:20px}.pay button{width:100%;height:50px;border:0;border-radius:13px;background:var(--grad-primary);color:#fff;font-weight:900;font:inherit;display:flex;align-items:center;justify-content:center;gap:7px;margin-top:16px;cursor:pointer;box-shadow:0 8px 16px rgba(37,99,235,0.22);transition:all 0.2s ease}.pay button:hover{transform:translateY(-1px);filter:brightness(1.1)}.pay a{display:block;text-align:center;margin-top:12px;color:var(--primary);font-weight:800;text-decoration:none}.pay a:hover{text-decoration:underline}.error{margin-top:14px;border-radius:10px;background:var(--clr-error-bg);border:1px solid var(--clr-error);color:var(--clr-error);padding:12px}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:900px){.grid{grid-template-columns:1fr}.panel:nth-child(3),.pay{grid-column:auto;grid-row:auto}.container{padding:0 12px}}
  `]
})
export class BookingSummaryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly flightService = inject(FlightService);
  private readonly passengerService = inject(PassengerService);

  bookingId = '';
  seatNumber = '';
  booking = signal<Booking | null>(null);
  flight = signal<Flight | null>(null);
  passenger = signal<PassengerInfo | null>(null);
  loading = signal(true);
  error = signal('');
  addons: any = null;
  addonCost = 0;

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') || '';
    const q = this.route.snapshot.queryParams;
    this.seatNumber = q['seatNumber'] || '';
    this.addons = JSON.parse(sessionStorage.getItem(`skybooker_addons_${this.bookingId}`) || 'null');
    this.addonCost = this.addons?.additionalCost || 0;
    
    forkJoin({
      booking: this.bookingService.getBookingById(this.bookingId).pipe(catchError(err => { 
        this.error.set(err?.error?.message || 'Unable to load booking.'); 
        return of(null); 
      })),
      flight: q['flightId'] ? this.flightService.getFlightById(q['flightId']).pipe(catchError(() => of(null))) : of(null),
      passenger: q['passengerId'] ? this.passengerService.getPassengerById(q['passengerId']).pipe(catchError(() => of(null))) : of(null)
    }).subscribe(res => {
      if (res.booking) {
        // Force calculation of total in UI to ensure add-ons are included
        const total = res.booking.baseFare + res.booking.taxes + this.addonCost;
        res.booking.totalFare = total;
        this.booking.set(res.booking);
      }
      this.flight.set(res.flight);
      this.passenger.set(res.passenger);
      this.loading.set(false);
    });
  }

  pay(): void {
    this.router.navigate(['/booking/payment', this.bookingId]);
  }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  }
}
