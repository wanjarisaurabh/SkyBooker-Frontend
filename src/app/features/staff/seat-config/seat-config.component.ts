import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeatService } from '../../../core/services/seat.service';
import { Seat, SeatClass, SeatItem } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-seat-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="page">
      <div class="container">
        <a routerLink="/staff/dashboard" class="back"><span class="material-symbols-rounded">arrow_back</span> Back to dashboard</a>
        <div class="header">
          <div>
            <h1>Seat Configuration</h1>
            <p>Generate and publish the seat map passengers will use during booking.</p>
          </div>
          <button class="btn" (click)="loadSeats()"><span class="material-symbols-rounded">refresh</span> Refresh</button>
        </div>

        <section class="panel">
          <div class="form-grid">
            <label>Economy rows <input type="number" min="0" [(ngModel)]="economyRows" [disabled]="isLocked()"></label>
            <label>Business rows <input type="number" min="0" [(ngModel)]="businessRows" [disabled]="isLocked()"></label>
            <label>First rows <input type="number" min="0" [(ngModel)]="firstRows" [disabled]="isLocked()"></label>
            <label>Columns <input type="text" [(ngModel)]="columns" placeholder="A,B,C,D,E,F" [disabled]="isLocked()"></label>
          </div>
          <div class="actions">
            <button class="btn ghost" (click)="previewSeats()" [disabled]="isLocked()"><span class="material-symbols-rounded">visibility</span> Preview</button>
            <button class="btn" [disabled]="saving() || isLocked()" (click)="saveSeats()">
              @if (saving()) { <span class="spinner-small"></span> Saving... }
              @else { <span class="material-symbols-rounded">save</span> Save seats }
            </button>
          </div>
          @if (message()) {
            <div class="message animate-fade-up">
              <span class="material-symbols-rounded">check_circle</span>
              {{ message() }}
            </div>
          }
          @if (error()) {
            <div class="error animate-fade-up">
              <span class="material-symbols-rounded">report</span>
              <div class="error-text">
                <strong>Configuration Alert</strong>
                <p>{{ error() }}</p>
              </div>
            </div>
          }
          @if (isLocked()) {
            <div class="message" style="background: #fffbeb; color: #92400e; border-color: #fde68a;">
              <span class="material-symbols-rounded">lock</span>
              Seat mapping is locked. This flight already has confirmed or blocked bookings.
            </div>
          }
        </section>

        <section class="panel">
          <div class="section-head">
            <h2>Current Seat Map</h2>
            <span>{{ seats().length }} seats</span>
          </div>
          @if (loading()) { <div class="loading"><div class="spinner"></div></div> }
          @if (!loading() && seats().length === 0) {
            <div class="empty">
              <span class="material-symbols-rounded">airline_seat_recline_normal</span>
              <h3>No seats configured</h3>
              <p>Create seats here so passengers can select them during booking.</p>
            </div>
          }
          @if (!loading() && seats().length > 0) {
            <div class="tabs">
              @for (cls of classes; track cls) {
                <button [class.active]="activeClass() === cls" (click)="activeClass.set(cls)">{{ cls }}</button>
              }
            </div>
            <div class="seat-grid">
              @for (seat of visibleSeats(); track seat.seatId || seat.seatNumber) {
                <div class="seat" [class.held]="seat.status === 'HELD'" [class.booked]="seat.status === 'CONFIRMED' || seat.status === 'BLOCKED'">
                  {{ seat.seatNumber }}
                </div>
              }
            </div>
          }
        </section>
      </div>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .page {
      flex: 1;
      background: var(--background);
      padding: 32px 0 64px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }
    .back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--primary);
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      margin-bottom: 24px;
      transition: all 0.2s;
    }
    .back:hover {
      transform: translateX(-4px);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 900;
      margin: 0 0 4px;
      color: var(--on-surface);
      letter-spacing: -0.02em;
    }
    p {
      margin: 0;
      color: var(--on-surface-muted);
      font-size: 15px;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--outline);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: var(--glass-shadow);
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    .form-grid label {
      font-size: 13px;
      font-weight: 700;
      color: var(--on-surface-variant);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .form-grid input {
      width: 100%;
      height: 48px;
      border: 1px solid var(--outline);
      border-radius: 12px;
      background: var(--background);
      padding: 0 16px;
      font: inherit;
      color: var(--on-surface);
      transition: all 0.2s;
    }
    .form-grid input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px var(--clr-primary-50);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border: 0;
      border-radius: 12px;
      background: var(--grad-primary);
      color: #fff;
      font-weight: 700;
      font: inherit;
      padding: 12px 24px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }
    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      filter: brightness(1.1);
      box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3);
    }
    .btn.ghost {
      background: var(--surface);
      color: var(--on-surface);
      border: 1px solid var(--outline);
      box-shadow: none;
    }
    .btn.ghost:hover {
      background: var(--background);
      border-color: var(--primary);
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .section-head h2 {
      font-size: 1.1rem;
      font-weight: 800;
      margin: 0;
      color: var(--on-surface);
    }
    .section-head span {
      font-size: 12px;
      font-weight: 800;
      color: var(--primary);
      background: var(--clr-primary-50);
      border-radius: 999px;
      padding: 6px 14px;
    }
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .tabs button {
      height: 42px;
      border: 1px solid var(--outline);
      background: var(--surface);
      border-radius: 12px;
      padding: 0 20px;
      font-weight: 700;
      color: var(--on-surface-variant);
      cursor: pointer;
      transition: all 0.2s;
    }
    .tabs button.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
    }
    .seat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
      gap: 10px;
    }
    .seat {
      height: 48px;
      border-radius: 12px;
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 800;
      transition: all 0.2s;
    }
    .seat.held {
      background: #fffbeb;
      color: #92400e;
      border-color: #fde68a;
    }
    .seat.booked {
      background: #fef2f2;
      color: #991b1b;
      border-color: #fecaca;
    }
    .loading {
      display: flex;
      justify-content: center;
      padding: 60px;
    }
    .spinner, .spinner-small {
      border-radius: 50%;
      border: 3px solid var(--outline);
      border-top-color: var(--primary);
      animation: spin 0.8s linear infinite;
    }
    .spinner {
      width: 40px;
      height: 40px;
    }
    .spinner-small {
      width: 18px;
      height: 18px;
      border-width: 2px;
      border-top-color: #fff;
    }
    .empty {
      text-align: center;
      color: var(--on-surface-muted);
      padding: 64px 24px;
    }
    .empty .material-symbols-rounded {
      font-size: 48px;
      color: var(--primary);
      opacity: 0.3;
      margin-bottom: 16px;
    }
    .empty h3 {
      font-size: 18px;
      font-weight: 800;
      color: var(--on-surface);
      margin: 0 0 8px;
    }
    .message, .error {
      margin-top: 24px;
      border-radius: 16px;
      padding: 16px 20px;
      font-size: 14px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      line-height: 1.5;
    }
    .message {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .error {
      background: #fff1f2;
      color: #9f1239;
      border: 1px solid #fecdd3;
    }
    .error-text strong {
      display: block;
      margin-bottom: 2px;
      font-weight: 800;
    }
    .error-text p {
      margin: 0;
      opacity: 0.9;
      font-weight: 500;
    }
    .message .material-symbols-rounded, .error .material-symbols-rounded {
      font-size: 22px;
      margin-top: 1px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @media (max-width: 760px) {
      .form-grid { grid-template-columns: 1fr 1fr; }
      .container { padding: 0 16px; }
    }
    @media (max-width: 480px) {
      .form-grid { grid-template-columns: 1fr; }
      .actions { flex-direction: column; }
      .btn { width: 100%; }
    }
  `]
})
export class SeatConfigComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly seatService = inject(SeatService);

  readonly flightId = this.route.snapshot.paramMap.get('flightId') || '';
  readonly classes: SeatClass[] = ['ECONOMY', 'BUSINESS', 'FIRST'];
  activeClass = signal<SeatClass>('ECONOMY');
  seats = signal<Seat[]>([]);
  preview = signal<Seat[]>([]);
  isLocked = computed(() => this.seats().some(s => s.status === 'CONFIRMED' || s.status === 'BLOCKED'));
  loading = signal(true);
  saving = signal(false);
  message = signal('');
  error = signal('');

  economyRows = 24;
  businessRows = 6;
  firstRows = 2;
  columns = 'A,B,C,D,E,F';

  constructor() {
    this.loadSeats();
  }

  visibleSeats(): Seat[] {
    const source = this.preview().length ? this.preview() : this.seats();
    return source.filter(s => s.seatClass === this.activeClass());
  }

  loadSeats(): void {
    this.loading.set(true);
    this.error.set('');
    this.seatService.getSeatMap(this.flightId).pipe(catchError(err => {
      this.error.set(err?.error?.message || 'Unable to load seat map.');
      return of([]);
    })).subscribe(seats => {
      this.seats.set(seats);
      this.preview.set([]);
      this.loading.set(false);
    });
  }

  previewSeats(): void {
    this.message.set('Preview generated. Save seats to publish this map.');
    this.error.set('');
    this.preview.set(this.buildSeatItems().map((s, index) => ({
      ...s,
      seatId: `preview-${index}`,
      flightId: this.flightId,
      status: 'AVAILABLE',
      holdExpiresAt: ''
    })));
  }

  saveSeats(): void {
    const items = this.buildSeatItems();
    if (items.length === 0) {
      this.error.set('Configure at least one row before saving.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    this.seatService.addSeats({ flightId: this.flightId, seats: items }).subscribe({
      next: seats => {
        this.seats.set(seats);
        this.preview.set([]);
        this.saving.set(false);
        this.message.set(`${seats.length} seats saved for this flight.`);
      },
      error: err => {
        this.saving.set(false);
        const raw = err?.error?.message || '';
        if (raw.includes('Duplicate entry')) {
          this.error.set('This flight already has a seat map published. You cannot modify the configuration once seats are created.');
        } else {
          this.error.set(raw || 'Failed to save seats. Please check the network or try again.');
        }
      }
    });
  }

  private buildSeatItems(): SeatItem[] {
    const columns = this.columns.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
    const items: SeatItem[] = [];
    let row = 1;
    row = this.addRows(items, row, this.firstRows, columns, 'FIRST', 2.5);
    row = this.addRows(items, row, this.businessRows, columns, 'BUSINESS', 1.6);
    this.addRows(items, row, this.economyRows, columns, 'ECONOMY', 1);
    return items;
  }

  private addRows(items: SeatItem[], startRow: number, count: number, columns: string[], seatClass: SeatClass, priceMultiplier: number): number {
    for (let offset = 0; offset < Number(count || 0); offset++) {
      const row = startRow + offset;
      columns.forEach((column, index) => {
        items.push({
          seatNumber: `${row}${column}`,
          seatClass,
          rowNumber: row,
          columnValue: column,
          windowSeat: index === 0 || index === columns.length - 1,
          aisleSeat: index === 2 || index === 3,
          hasExtraLegroom: offset === 0,
          priceMultiplier
        });
      });
    }
    return startRow + Number(count || 0);
  }
}
