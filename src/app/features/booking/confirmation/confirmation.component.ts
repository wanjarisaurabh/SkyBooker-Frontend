import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/index';
import { AuthService } from '../../../core/services/auth.service';
import { LocalNotificationService } from '../../../core/services/local-notification.service';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { catchError, of, timeout } from 'rxjs';

const CONFIRMATION_CACHE_PREFIX = 'skybooker_confirmation_';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="conf-page">
      <div class="conf-container">
        @if (loading()) { <div class="c-loading"><div class="spinner"></div></div> }
        @if (!loading() && booking()) {
          <div class="conf-card animate-fade-up">
            <div class="conf-success-icon">
              <span class="material-symbols-rounded mat-icon-filled">check_circle</span>
            </div>
            <h1>Booking Confirmed!</h1>
            <p class="conf-sub">Your flight has been booked successfully. Safe travels!</p>

            <div class="pnr-display">
              <span class="pnr-label">Your PNR</span>
              <span class="pnr-number">{{ booking()!.pnrCode }}</span>
              <span class="pnr-hint">Use this code to check-in</span>
            </div>

            <div class="conf-details">
              <div class="conf-item"><span>Trip Type</span><strong>{{ booking()!.tripType.replace('_',' ') }}</strong></div>
              <div class="conf-item"><span>Contact</span><strong>{{ booking()!.contactEmail }}</strong></div>
              <div class="conf-item"><span>Amount Paid</span><strong class="amount-paid">₹{{ booking()!.totalFare.toLocaleString('en-IN') }}</strong></div>
            </div>

            <div class="conf-actions">
              <a routerLink="/passenger/my-bookings" class="btn-secondary">
                <span class="material-symbols-rounded">confirmation_number</span>
                View My Bookings
              </a>
              <a routerLink="/flights/search" class="btn-primary-conf">
                <span class="material-symbols-rounded">search</span>
                Book Another Flight
              </a>
            </div>
          </div>
        }
      </div>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    :host{display:flex;flex-direction:column;min-height:100vh}
    .conf-page{flex:1;padding:16px 24px;background:var(--background);display:flex;align-items:center;justify-content:center}
    .conf-container{width:100%;max-width:480px}
    .c-loading{display:flex;justify-content:center;padding:60px}
    .spinner{width:30px;height:30px;border:3px solid var(--outline);border-top-color:var(--primary);border-radius:50%;animation:spin .75s linear infinite}
    .conf-card{background:var(--surface);border-radius:18px;padding:24px 32px;text-align:center;box-shadow:var(--glass-shadow);border:1px solid var(--outline)}
    .conf-success-icon .material-symbols-rounded{font-size:48px;color:var(--success);display:block;margin-bottom:12px}
    h1{font-size:1.4rem;font-weight:800;color:var(--on-surface);margin:0 0 8px}
    .conf-sub{font-size:14px;color:var(--on-surface-variant);margin:0 0 24px;line-height:1.6}
    .pnr-display{background:var(--surface-2);border-radius:14px;padding:16px;margin-bottom:16px;border:1px solid var(--outline)}
    .pnr-label{display:block;font-size:10px;font-weight:700;color:var(--on-surface-muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
    .pnr-number{display:block;font-size:1.8rem;font-weight:900;color:var(--primary);letter-spacing:.05em;margin-bottom:4px}
    .pnr-hint{display:block;font-size:11px;color:var(--on-surface-variant)}
    .conf-details{display:flex;flex-direction:column;gap:8px;margin-bottom:20px;text-align:left}
    .conf-item{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--outline);font-size:13px;color:var(--on-surface-variant)}
    .conf-item:last-child{border-bottom:none}
    .conf-item strong{font-weight:700;color:var(--on-surface)}
    .amount-paid{color:var(--primary);font-size:15px}
    .conf-actions{display:flex;gap:12px;flex-wrap:wrap}
    .btn-secondary{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:10px;border-radius:12px;border:1.5px solid var(--outline);background:var(--surface);color:var(--on-surface-variant);font-size:13px;font-weight:700;text-decoration:none;transition:all .18s;min-width:0}
    .btn-secondary:hover{background:var(--surface-2)}
    .btn-secondary .material-symbols-rounded{font-size:16px}
    .btn-primary-conf{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:10px;border-radius:12px;border:none;background:var(--grad-primary);color:white;font-size:13px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(37,99,235,.25);transition:all .2s;min-width:0}
    .btn-primary-conf:hover{transform:translateY(-1px);filter:brightness(1.1)}
    .btn-primary-conf .material-symbols-rounded{font-size:16px}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    .animate-fade-up{animation:fadeUp .5s ease}
    @media(max-width:480px){.conf-card{padding:24px 18px}.conf-actions{flex-direction:column}}
  `]
})
export class ConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);
  private readonly localNotificationService = inject(LocalNotificationService);
  booking = signal<Booking | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('bookingId') || '';
    let localNotifTriggered = false;

    // Add local notification immediately from cached booking for instant badge update.
    // The real server-side notification + email are handled by the Kafka pipeline.
    const cachedBooking = this.getInstantBooking(id);
    if (cachedBooking) {
      this.booking.set(cachedBooking);
      this.loading.set(false);
      this.addBookingNotification(cachedBooking);
      localNotifTriggered = true;
    }

    this.bookingService.getBookingById(id).pipe(
      timeout(6000),
      catchError(() => of(null))
    ).subscribe(b => {
      if (b) {
        this.booking.set(b);
        this.cacheBooking(b);
        // Only add local notification if we didn't already do it from cache
        if (!localNotifTriggered) {
          this.addBookingNotification(b);
        }
      }
      this.loading.set(false);
    });
  }

  private getInstantBooking(id: string): Booking | null {
    const stateBooking = (this.router.getCurrentNavigation()?.extras.state?.['booking'] || history.state?.booking) as Booking | null;
    if (stateBooking?.bookingId === id) {
      return stateBooking;
    }

    try {
      const cached = sessionStorage.getItem(`${CONFIRMATION_CACHE_PREFIX}${id}`);
      return cached ? JSON.parse(cached) as Booking : null;
    } catch {
      return null;
    }
  }

  private cacheBooking(booking: Booking): void {
    try {
      sessionStorage.setItem(`${CONFIRMATION_CACHE_PREFIX}${booking.bookingId}`, JSON.stringify(booking));
    } catch {
      // Non-critical: the server response is still shown even if browser storage is unavailable.
    }
  }

  private addBookingNotification(booking: Booking): void {
    const userId = booking.userId || this.authService.getUserId();
    if (!userId) return;
    this.localNotificationService.addBookingConfirmed(booking, userId);
  }
}
