import { Component, inject, signal, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { SeatService } from '../../../core/services/seat.service';
import { PassengerService } from '../../../core/services/passenger.service';
import { Seat, SeatClass, SeatStatus } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NavbarComponent,
    FooterComponent
  ],
  template: `
    <app-navbar></app-navbar>

    <main class="seat-page">

      <div class="seat-container">

        <div class="step-header">

          <a routerLink="/flights/search" class="back-btn">
            <span class="material-symbols-rounded">arrow_back</span>
            Back
          </a>

          <div class="steps">

            <span class="step done">1. Flight</span>

            <span class="step-sep material-symbols-rounded">
              chevron_right
            </span>

            <span class="step done">2. Passenger</span>

            <span class="step-sep material-symbols-rounded">
              chevron_right
            </span>

            <span class="step active">3. Seat</span>

            <span class="step-sep material-symbols-rounded">
              chevron_right
            </span>

            <span class="step">4. Add-ons</span>

            <span class="step-sep material-symbols-rounded">
              chevron_right
            </span>

            <span class="step">5. Payment</span>

          </div>
        </div>

        <h1>Select Your Seat</h1>

        @if (loading()) {

          <div class="s-loading">
            <div class="spinner"></div>
          </div>

        }

        @if (!loading()) {

          <!-- Class Tabs -->

          <div class="class-tabs">

            @for (cls of ['ECONOMY','BUSINESS','FIRST']; track cls) {

              <button
                class="class-tab"
                [class.active]="selectedClass() === cls"
                (click)="filterClassStr(cls)"
                type="button"
              >
                {{ cls }}
              </button>

            }

          </div>

          <!-- Seat Map -->

          <div class="seat-layout">

            <div class="seat-map-card">
              <div class="seat-map-head">
                <div>
                  <span class="eyebrow">Cabin Map</span>
                  <h2>{{ selectedClass() }} Class</h2>
                </div>

                <!-- Legend -->

                <div class="seat-legend">

                  <span class="leg-item">
                    <div class="leg-box avail"></div>
                    Available
                  </span>

                  <span class="leg-item">
                    <div class="leg-box held"></div>
                    Held
                  </span>

                  <span class="leg-item">
                    <div class="leg-box booked"></div>
                    Booked
                  </span>

                  <span class="leg-item">
                    <div class="leg-box selected"></div>
                    Selected
                  </span>

                </div>
              </div>

              @if (error()) {

                <div class="seat-error">
                  {{ error() }}
                </div>

              }

              @if (!error() && filteredSeats().length === 0) {

                <div class="empty-seat-map">

                  <span class="material-symbols-rounded">
                    airline_seat_recline_normal
                  </span>

                  <h3>
                    No {{ selectedClass() }} seats are configured yet
                  </h3>

                  <p>
                    Ask airline staff to configure seats for this flight before booking.
                  </p>

                </div>

              }

              @if (!error() && filteredSeats().length > 0) {
                <div class="cabin-shell">
                  <div class="cabin-nose">
                    <span class="material-symbols-rounded">flight</span>
                    Front
                  </div>

                  <!-- Seat Grid -->

                  <div class="seat-grid">

                    @for (seat of filteredSeats(); track seat.seatId) {

                      @let status = getNormalizedStatus(seat);

                      <div
                        class="seat-cell"
                        [class.available]="status === 'AVAILABLE'"
                        [class.held]="status === 'HELD'"
                        [class.booked]="status === 'BOOKED'"
                        [class.selected]="status === 'SELECTED'"
                        [class.window]="seat.windowSeat"
                        [class.aisle]="seat.aisleSeat"
                        (click)="selectSeat(seat)"
                        [title]="seat.seatNumber + ' - ' + status"
                      >

                        @if (status === 'BOOKED') {

                          <span class="material-symbols-rounded taken-icon">
                            block
                          </span>

                        } @else {

                          {{ seat.seatNumber }}

                        }

                      </div>

                    }

                  </div>
                </div>
              }
            </div>

            <aside class="seat-side-card">
              <span class="eyebrow">Selection</span>
              @if (selectedSeat()) {
                <h2>{{ selectedSeat()!.seatNumber }}</h2>
                <p>{{ selectedSeat()!.seatClass }} class seat selected</p>
              } @else {
                <h2>No Seat</h2>
                <p>Choose an available seat from the cabin map.</p>
              }

              <div class="side-row">
                <span>Passenger</span>
                <strong>{{ passengers }}</strong>
              </div>
              <div class="side-row">
                <span>Trip</span>
                <strong>{{ tripType.replace('_', ' ') }}</strong>
              </div>
            </aside>

          </div>

          <!-- Selected Seat Info -->

          @if (selectedSeat()) {

            <div class="selected-info">

              <h3>
                Selected:
                <strong>{{ selectedSeat()!.seatNumber }}</strong>
              </h3>

              <p>
                Class:
                {{ selectedSeat()!.seatClass }}
              </p>

            </div>

            <button class="next-btn" (click)="proceed()">

              Continue to Add-ons

              <span class="material-symbols-rounded">
                arrow_forward
              </span>

            </button>

          }

        }

      </div>

    </main>

    <app-footer></app-footer>
  `,
  styles: [`

    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .seat-page {
      flex: 1;
      padding: 40px 0 80px;
      background: var(--background);
    }

    .seat-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary);
      font-weight: 600;
      text-decoration: none;
      padding: 8px 16px;
      background: var(--surface);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.10);
      transition: all 0.2s;
    }

    .back-btn:hover {
      transform: translateX(-4px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
    }

    .steps {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      background: var(--surface);
      padding: 8px 20px;
      border-radius: 30px;
      box-shadow: var(--glass-shadow);
      border: 1px solid var(--outline);
    }

    .step {
      color: var(--on-surface-muted);
      font-weight: 600;
    }

    .step.active {
      color: var(--primary);
      font-weight: 700;
    }

    .step.done {
      color: var(--success);
      font-weight: 700;
    }

    .step-sep {
      font-size: 18px;
      color: var(--clr-primary-200);
    }

    h1 {
      margin-bottom: 24px;
      font-size: 2rem;
      font-weight: 800;
      color: var(--on-surface);
      letter-spacing: -0.02em;
    }

    .s-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px;
      gap: 16px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--outline);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .class-tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      background: rgba(255,255,255,0.72);
      padding: 6px;
      border-radius: 16px;
      width: fit-content;
      border: 1px solid var(--outline);
      box-shadow: 0 6px 16px rgba(15,23,42,0.05);
    }

    .class-tab {
      padding: 10px 24px;
      border-radius: 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-weight: 700;
      color: var(--on-surface-variant);
      transition: all 0.2s;
    }

    .class-tab.active {
      background: var(--surface);
      color: var(--primary);
      box-shadow: 0 4px 12px rgba(37,99,235,0.10);
    }

    .seat-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 260px;
      gap: 18px;
      align-items: start;
    }

    .seat-map-card {
      background: var(--surface);
      border-radius: 24px;
      padding: 26px;
      border: 1px solid var(--outline);
      box-shadow: var(--glass-shadow);
      position: relative;
    }

    .seat-map-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
      padding-bottom: 18px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--outline);
      flex-wrap: wrap;
    }

    .eyebrow {
      display: block;
      color: var(--primary);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .seat-map-head h2,
    .seat-side-card h2 {
      margin: 0;
      color: var(--on-surface);
      font-size: 1.35rem;
      font-weight: 850;
    }

    .seat-legend {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .leg-item {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 12px;
      font-weight: 600;
      color: var(--on-surface-variant);
      padding: 7px 9px;
      border-radius: 999px;
      background: var(--surface-2);
      border: 1px solid var(--outline);
    }

    .leg-box {
      width: 20px;
      height: 20px;
      border-radius: 6px;
    }

    .leg-box.avail {
      background: var(--clr-success-bg);
      border: 2px solid var(--success);
    }

    .leg-box.held {
      background: rgba(245, 158, 11, 0.1);
      border: 2px solid var(--clr-warning);
    }

    .leg-box.booked {
      background: var(--clr-error-bg);
      border: 2px solid var(--clr-error);
    }

    .leg-box.selected {
      background: var(--primary);
      border: 2px solid var(--primary);
    }

    .cabin-shell {
      max-width: 720px;
      margin: 0 auto;
      padding: 20px 20px 26px;
      border-radius: 32px 32px 22px 22px;
      background:
        linear-gradient(180deg, var(--clr-primary-50), var(--surface));
      border: 1px solid var(--clr-primary-100);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.8);
    }

    .cabin-nose {
      width: fit-content;
      margin: 0 auto 22px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 999px;
      color: var(--primary);
      background: var(--surface);
      border: 1px solid var(--clr-primary-200);
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .cabin-nose .material-symbols-rounded {
      font-size: 16px;
    }

    .seat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(48px, 48px));
      gap: 11px;
      max-width: 600px;
      margin: 0 auto;
      justify-content: center;
    }

    .seat-cell {
      width: 48px;
      height: 46px;
      border-radius: 12px 12px 15px 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      box-shadow: inset 0 -3px 0 rgba(15,23,42,0.05);
    }

    .seat-cell.available {
      background: var(--clr-success-bg);
      border-color: var(--success);
      color: var(--success);
    }

    .seat-cell.available:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(16, 185, 129, 0.15);
      background: #d1fae5;
    }

    .seat-cell.held {
      background: rgba(245, 158, 11, 0.1);
      border-color: var(--clr-warning);
      color: var(--clr-warning);
      cursor: not-allowed;
    }

    .seat-cell.booked {
      background: var(--clr-error-bg);
      border-color: var(--clr-error);
      color: var(--clr-error);
      cursor: not-allowed;
      opacity: 0.8;
    }

    .seat-cell.selected {
      background: var(--primary);
      color: white;
      border-color: var(--primary-dark);
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.28);
      transform: scale(1.05);
    }

    .taken-icon {
      font-size: 20px;
    }

    .seat-error {
      padding: 16px;
      margin-bottom: 24px;
      border-radius: 16px;
      background: var(--clr-error-bg);
      border: 1px solid var(--clr-error);
      color: var(--clr-error);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    .seat-side-card {
      background: var(--surface);
      border: 1px solid var(--outline);
      border-radius: 22px;
      padding: 22px;
      box-shadow: var(--glass-shadow);
      position: sticky;
      top: 104px;
    }

    .seat-side-card p {
      color: var(--on-surface-variant);
      margin: 8px 0 18px;
      line-height: 1.5;
      font-size: 13px;
    }

    .side-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 11px 0;
      border-top: 1px solid var(--outline);
      color: var(--on-surface-variant);
      font-size: 13px;
    }

    .side-row strong {
      color: var(--on-surface);
      text-align: right;
    }

    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }

    .selected-info {
      margin-top: 32px;
      padding: 24px;
      background: var(--surface);
      border-radius: 20px;
      box-shadow: var(--glass-shadow);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--outline);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .selected-info h3 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--on-surface-variant);
    }

    .selected-info strong {
      color: var(--on-surface);
      font-size: 1.4rem;
      margin-left: 8px;
    }

    .next-btn {
      margin-top: 24px;
      width: 100%;
      height: 60px;
      border: none;
      border-radius: 18px;
      background: var(--grad-primary);
      color: white;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.26);
      transition: all 0.3s;
    }

    .next-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px rgba(37, 99, 235, 0.34);
      background: var(--grad-primary);
      filter: brightness(1.1);
    }

    .next-btn:active {
      transform: translateY(0);
    }

    @media(max-width: 900px) {
      .seat-layout {
        grid-template-columns: 1fr;
      }

      .seat-side-card {
        position: static;
      }
    }

    @media(max-width: 640px) {
      .seat-page {
        padding: 24px 0 56px;
      }

      .seat-container {
        padding: 0 14px;
      }

      .seat-map-card {
        padding: 18px;
      }

      .cabin-shell {
        padding: 16px 10px 20px;
      }

      .seat-grid {
        grid-template-columns: repeat(auto-fit, minmax(42px, 42px));
        gap: 8px;
      }

      .seat-cell {
        width: 42px;
        height: 40px;
        font-size: 10px;
      }

      .selected-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
    }

  `]
})
export class SeatSelectionComponent implements OnInit, OnDestroy {

  private readonly seatService = inject(SeatService);
  private readonly passengerService = inject(PassengerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  flightId = '';
  passengers = 1;
  tripType = 'ONE_WAY';
  basePrice = 0;
  bookingId = '';
  passengerId = '';

  seats = signal<Seat[]>([]);
  selectedSeat = signal<Seat | null>(null);

  selectedClass = signal<SeatClass>('ECONOMY');

  loading = signal(true);

  error = signal('');

  private pollInterval: any;

  filteredSeats = computed(() => {
    return this.seats().filter(seat => seat.seatClass === this.selectedClass());
  });

  // Count of available seats left for selected class
  leftSeatsCount = computed(() => {
    return this.seats().filter(seat =>
      seat.seatClass === this.selectedClass() &&
      this.getNormalizedStatus(seat) === 'AVAILABLE'
    ).length;
  });

  ngOnInit(): void {

    this.flightId =
      this.route.snapshot.paramMap.get('flightId') || '';

    const p = this.route.snapshot.queryParams;

    this.passengers = parseInt(p['passengers'] || '1');
    this.tripType = p['tripType'] || 'ONE_WAY';
    this.basePrice = parseFloat(p['basePrice'] || '0');
    this.bookingId = p['bookingId'] || '';
    this.passengerId = p['passengerId'] || '';

    // 1. Initial Load
    this.loadSeatMap();

    // 2. Restore existing selection if any
    if (this.passengerId) {
      this.passengerService.getPassengerById(this.passengerId).subscribe(pass => {
        if (pass?.seatId) {
          this.seatService.getSeatById(pass.seatId).subscribe(seat => {
            if (seat) {
              console.log('Restoring previous selection:', seat.seatNumber);
              this.selectedSeat.set(seat);
            }
          });
        }
      });
    }

    // 3. Start Polling
    this.pollInterval = setInterval(() => {
      this.loadSeatMap();
    }, 5000);

  }

  ngOnDestroy(): void {

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

  }

  loadSeatMap(): void {

    this.seatService.getSeatMap(this.flightId)
      .pipe(
        catchError(err => {

          this.error.set(
            err?.error?.message ||
            'Unable to load seat map.'
          );

          return of([]);
        })
      )
      .subscribe((s: Seat[]) => {

        console.log('Seat Map API:', s);

        this.seats.set(s);

        // Clear local selection if seat becomes unavailable (e.g. booked by another user)
        const currentSelection = this.selectedSeat();
        if (currentSelection) {
          const updatedSeat = s.find(seat => seat.seatId === currentSelection.seatId);
          if (updatedSeat) {
            // Check if it's booked or held by someone else
            // If it's held, we keep it selected locally because it might be OUR hold
            const status = this.getNormalizedStatus(updatedSeat, true); 
            if (status === 'BOOKED') {
              console.warn('Selected seat was booked by another user. Clearing selection.');
              this.selectedSeat.set(null);
            }
          }
        }

        this.loading.set(false);

      });

  }

  filterClass(cls: SeatClass): void {

    this.selectedClass.set(cls);
    // Don't clear selectedSeat here, maybe they want to see where they were
    // Or clear it if you want strict class-based selection
    // this.selectedSeat.set(null);

  }

  filterClassStr(cls: string): void {

    this.filterClass(cls as SeatClass);

  }

  getNormalizedStatus(seat: any, ignoreSelection = false): SeatStatus {

    // Priority 1: Current Selection
    if (!ignoreSelection && this.selectedSeat()?.seatId === seat.seatId) {
      return 'SELECTED';
    }

    // Priority 2: Extract status from any field
    const status = (
      seat.status ||
      seat.seatStatus ||
      (seat.isBooked ? 'BOOKED' : '') ||
      ''
    )
      .toString()
      .trim()
      .toUpperCase();

    // Priority 3: Mapping
    if (
      status === 'CONFIRMED' ||
      status === 'BOOKED' ||
      status === 'BLOCKED'
    ) {
      return 'BOOKED';
    }

    if (status === 'HELD') {
      return 'HELD';
    }

    return 'AVAILABLE';

  }

  selectSeat(seat: Seat): void {

    const currentStatus = this.getNormalizedStatus(seat, true);

    // If already booked, can't touch it
    if (currentStatus === 'BOOKED') {
      return;
    }

    // If held and NOT our selection, we can't touch it
    // Note: We can't know for 100% sure if it's ours if we refresh, 
    // but if it matches our selectedSeat() (restored in ngOnInit), it's ours.
    if (currentStatus === 'HELD' && this.selectedSeat()?.seatId !== seat.seatId) {
      this.error.set('This seat is currently held by another user.');
      return;
    }

    // If already selected, do nothing (or toggle off if desired)
    if (this.selectedSeat()?.seatId === seat.seatId) {
      // Toggle off logic (Optional)
      /*
      this.seatService.releaseSeat(seat.seatId).subscribe(() => {
        this.selectedSeat.set(null);
        this.loadSeatMap();
      });
      */
      return;
    }

    const previousSelection = this.selectedSeat();
    this.error.set('');

    // If there was a previous selection, release it
    if (previousSelection?.seatId) {
      this.seatService.releaseSeat(previousSelection.seatId).pipe(
        catchError(() => of(null))
      ).subscribe();
    }

    // Hold the new seat
    this.seatService.holdSeat(seat.seatId)
      .pipe(
        catchError(err => {
          this.error.set(
            err?.error?.message ||
            'This seat is no longer available.'
          );
          return of(null);
        })
      )
      .subscribe((held: any) => {
        if (!held) {
           this.loadSeatMap(); // Refresh to show latest status
           return;
        }

        console.log('Seat held successfully:', held.seatNumber);
        this.selectedSeat.set(held);

        // Update local list for instant feedback
        this.seats.update(list =>
          list.map(s => s.seatId === held.seatId ? held : s)
        );
      });

  }

  proceed(): void {

    const seat = this.selectedSeat();

    if (!seat) {
      this.error.set('Please select a seat first.');
      return;
    }

    if (!this.bookingId || !this.passengerId) {
      this.error.set('Booking context missing. Please restart the process.');
      return;
    }

    this.loading.set(true);

    this.passengerService.assignSeat(
      this.passengerId,
      seat.seatId,
      seat.seatNumber
    )
      .pipe(
        catchError(err => {
          this.loading.set(false);
          this.error.set(
            err?.error?.message ||
            'Unable to assign seat.'
          );
          return of(null);
        })
      )
      .subscribe(passenger => {
        if (!passenger) return;

        this.router.navigate(
          ['/booking/addons', this.bookingId],
          {
            queryParams: {
              flightId: this.flightId,
              seatId: seat.seatId,
              seatNumber: seat.seatNumber,
              passengerId: this.passengerId
            }
          }
        );
      });

  }

}
