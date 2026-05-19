import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.css'
})
export class MyBookingsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  bookings = signal<Booking[]>([]);
  selectedBooking = signal<Booking | null>(null);
  loading = signal(true);
  cancelLoading = signal(false);
  cancelSuccess = signal('');
  cancelError = signal('');

  filterStatus = signal<string>('ALL');
  currentPage = signal(1);
  pageSize = 4;

  filteredBookings = computed(() => {
    const f = this.filterStatus();
    const all = this.bookings();
    return f === 'ALL' ? all : all.filter(b => b.status === f);
  });

  paginatedBookings = computed(() => {
    const filtered = this.filteredBookings();
    const start = (this.currentPage() - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredBookings().length / this.pageSize));
  pagesArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  setFilter(status: string): void {
    this.filterStatus.set(status);
    this.currentPage.set(1);
  }

  setPage(page: number): void {
    this.currentPage.set(page);
  }

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    const bookingId = this.route.snapshot.paramMap.get('id');

    this.bookingService.getBookingsByUser(userId).pipe(catchError(() => of([]))).subscribe(b => {
      this.bookings.set(b);
      this.loading.set(false);
      if (bookingId) {
        this.selectedBooking.set(b.find(bk => bk.bookingId === bookingId) ?? null);
      }
    });
  }

  selectBooking(b: Booking): void {
    this.selectedBooking.set(b);
    this.cancelSuccess.set('');
    this.cancelError.set('');
  }

  closeDetail(): void {
    this.selectedBooking.set(null);
  }

  cancelBooking(bookingId: string): void {
    this.cancelLoading.set(true);
    this.cancelError.set('');
    this.bookingService.cancelBooking(bookingId).subscribe({
      next: (updated) => {
        this.cancelLoading.set(false);
        this.cancelSuccess.set('Booking cancelled successfully.');
        const list = this.bookings().map(b => b.bookingId === updated.bookingId ? updated : b);
        this.bookings.set(list);
        this.selectedBooking.set(updated);
      },
      error: (err) => {
        this.cancelLoading.set(false);
        this.cancelError.set(err?.error?.message || 'Failed to cancel booking.');
      }
    });
  }

  restartBooking(booking: Booking): void {
    this.router.navigate(['/flights/select', booking.flightId], {
      queryParams: {
        passengers: 1,
        tripType: booking.tripType,
        basePrice: booking.baseFare,
        departureTime: booking.departureTime
      }
    });
  }

  getStatusClass(status: string): string {
    const m: Record<string, string> = { CONFIRMED: 'status-confirmed', PENDING: 'status-pending', CANCELLED: 'status-cancelled', COMPLETED: 'status-completed', DEPARTED: 'status-completed' };
    return m[status] || '';
  }

  getDisplayStatus(booking: Booking): string {
    if (booking.status === 'NO_SHOW' && new Date(booking.departureTime) < new Date()) {
      return 'DEPARTED';
    }
    return booking.status;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  }
}
