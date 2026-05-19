import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { SeatService } from '../../../core/services/seat.service';
import { PassengerService } from '../../../core/services/passenger.service';
import { Booking, PaymentResponse } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { environment } from '../../../../environments/environment';
import { catchError, forkJoin, map, of, switchMap, timeout } from 'rxjs';

declare const Razorpay: any; //“Ye variable/function exist karta hai, trust me — abhi iski definition mat dhundo.”
const CONFIRMATION_CACHE_PREFIX = 'skybooker_confirmation_';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly paymentService = inject(PaymentService);
  private readonly seatService = inject(SeatService);
  private readonly passengerService = inject(PassengerService);

  bookingId = '';
  booking = signal<Booking | null>(null);
  loading = signal(true);
  payLoading = signal(false);
  error = signal('');

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') || '';
    this.bookingService.getBookingById(this.bookingId).pipe(
      catchError(() => of(null))
    ).subscribe(b => {
      if (b) {
        const addons = JSON.parse(sessionStorage.getItem(`skybooker_addons_${this.bookingId}`) || 'null');
        if (addons?.additionalCost) {
          b.totalFare = b.baseFare + b.taxes + addons.additionalCost;
        }
        this.booking.set(b);
        this.cacheConfirmationBooking(b);
      }
      this.loading.set(false);
    });
  }

  initiatePayment(): void {
    const b = this.booking();
    if (!b) return;
    this.payLoading.set(true);
    this.error.set('');

    this.paymentService.initiatePayment({
      bookingId: b.bookingId,
      amount: b.totalFare,
      currency: 'INR',
      description: `Skybooker — ${b.pnrCode}`
    }).pipe(catchError(err => {
      this.payLoading.set(false);
      this.error.set(err?.error?.message || 'Failed to initiate payment.');
      return of(null);
    })).subscribe(res => {
      if (!res) {
        if (!this.error()) this.payLoading.set(false);
        return;
      }

      if (typeof Razorpay === 'undefined') {
        this.loadRazorpayScript().then(loaded => {
          if (loaded) {
            this.openRazorpayCheckout(b, res);
          } else {
            this.confirmMockPayment(b);
          }
        });
        return;
      }

      this.openRazorpayCheckout(b, res);
    });
  }

  private openRazorpayCheckout(b: Booking, res: PaymentResponse): void {
    const options = {
      key: res.razorpayKeyId || environment.razorpayKeyId,
      amount: Math.round((res.amount ?? b.totalFare) * 100),
      currency: res.currency || 'INR',
      name: 'Skybooker',
      description: `PNR: ${b.pnrCode}`,
      order_id: res.razorpayOrderId,
      handler: (response: any) => {
        this.navigateToConfirmation(b.bookingId);

        this.paymentService.verifyPayment({
          bookingId: b.bookingId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        }).pipe(
          catchError(err => {
            console.error('Payment verification continued in background:', err);
            return of(null);
          })
        ).subscribe(verified => {
          if (verified) {
            console.log('Payment Success');
            this.confirmSeats(b.bookingId).subscribe();
          }
        });
      },
      prefill: { email: b.contactEmail, contact: b.contactPhone },
      theme: { color: '#7c3aed' },
      modal: { ondismiss: () => { this.payLoading.set(false); } }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  private confirmMockPayment(b: Booking): void {
    console.warn('Razorpay checkout could not be loaded, using local mock confirmation.');
    const confirmationBooking = { ...b, status: 'CONFIRMED' as const };
    this.cacheConfirmationBooking(confirmationBooking);
    this.payLoading.set(false);
    this.router.navigate(['/booking/confirmation', b.bookingId], {
      state: { booking: confirmationBooking }
    }).then(() => {
      this.bookingService.confirmBooking(b.bookingId).pipe(
        switchMap(() => this.confirmSeats(b.bookingId)),
        catchError(err => {
          console.error('Mock payment confirmation continued in background:', err);
          return of(false);
        })
      ).subscribe();
    });
  }

  private navigateToConfirmation(bookingId: string): void {
    const paidBooking = this.booking();
    const confirmationBooking = paidBooking ? { ...paidBooking, status: 'CONFIRMED' as const } : null;

    if (confirmationBooking) {
      this.cacheConfirmationBooking(confirmationBooking);
    }

    this.payLoading.set(false);
    this.router.navigate(['/booking/confirmation', bookingId], {
      state: { booking: confirmationBooking }
    });
  }

  private cacheConfirmationBooking(booking: Booking): void {
    try {
      sessionStorage.setItem(`${CONFIRMATION_CACHE_PREFIX}${booking.bookingId}`, JSON.stringify(booking));
    } catch (err) {
      console.warn('Unable to cache confirmation details:', err);
    }
  }

  private confirmSeats(bookingId: string) {
    return this.passengerService.getPassengersByBooking(bookingId).pipe(
      timeout(8000),
      switchMap(passengers => {
        const requests = passengers
          .filter(p => p.seatId)
          .map(p => this.seatService.confirmSeat(p.seatId!).pipe(
            timeout(8000),
            catchError(err => {
              console.error('Seat confirmation failed:', err);
              return of(null);
            })
          ));

        return requests.length ? forkJoin(requests) : of([]);
      }),
      map(() => true),
      catchError(err => {
        console.error('Post-payment seat confirmation skipped:', err);
        return of(false);
      })
    );
  }

  private loadRazorpayScript(): Promise<boolean> {
    if (typeof Razorpay !== 'undefined') {
      return Promise.resolve(true);
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      return new Promise(resolve => {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        setTimeout(() => resolve(typeof Razorpay !== 'undefined'), 8000);
      });
    }

    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
      setTimeout(() => resolve(typeof Razorpay !== 'undefined'), 8000);
    });
  }
}
