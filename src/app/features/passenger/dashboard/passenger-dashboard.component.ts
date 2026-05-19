import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Booking, Notification } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-passenger-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './passenger-dashboard.component.html',
  styleUrl: './passenger-dashboard.component.css'
})
export class PassengerDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly notifService = inject(NotificationService);

  user = computed(() => this.authService.currentUser());

  upcomingBookings = signal<Booking[]>([]);
  recentNotifications = signal<Notification[]>([]);
  allBookings = signal<Booking[]>([]);

  loading = signal(true);
  greeting = '';

  // Pagination for Travel Timeline
  bookingPage = signal(0);
  pageSize = 2;
  paginatedBookings = computed(() => {
    const start = this.bookingPage() * this.pageSize;
    return this.upcomingBookings().slice(start, start + this.pageSize);
  });

  get hasNextPage(): boolean {
    return (this.bookingPage() + 1) * this.pageSize < this.upcomingBookings().length;
  }

  get hasPrevPage(): boolean {
    return this.bookingPage() > 0;
  }

  nextPage(): void { if (this.hasNextPage) this.bookingPage.update(p => p + 1); }
  prevPage(): void { if (this.hasPrevPage) this.bookingPage.update(p => p - 1); }

  ngOnInit(): void {
    this.setGreeting();
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.bookingService.getUpcomingBookings(userId).pipe(catchError(() => of([]))).subscribe(b => {
      this.upcomingBookings.set(b);
    });

    this.bookingService.getBookingsByUser(userId).pipe(catchError(() => of([]))).subscribe(b => {
      this.allBookings.set(b);
      this.loading.set(false);
    });

    this.notifService.getUnreadNotifications(userId).pipe(catchError(() => of([]))).subscribe(n => {
      this.recentNotifications.set(n.slice(0, 5));
    });
  }

  private setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good morning';
    else if (hour < 17) this.greeting = 'Good afternoon';
    else this.greeting = 'Good evening';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      CONFIRMED: 'status-confirmed', PENDING: 'status-pending',
      CANCELLED: 'status-cancelled', COMPLETED: 'status-completed', NO_SHOW: 'status-no-show'
    };
    return map[status] || '';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  getNotifIcon(type: string): string {
    const map: Record<string, string> = {
      BOOKING_CONFIRMED: 'check_circle', FLIGHT_DELAY: 'schedule',
      GATE_CHANGE: 'door_front', CHECKIN_REMINDER: 'assignment_turned_in',
      BOARDING_REMINDER: 'flight_takeoff', PAYMENT_SUCCESS: 'payments',
      BOOKING_CANCELLED: 'cancel', GENERAL: 'notifications'
    };
    return map[type] || 'notifications';
  }

  get confirmedCount(): number {
    return this.allBookings().filter(b => b.status === 'CONFIRMED').length;
  }

  get cancelledCount(): number {
    return this.allBookings().filter(b => b.status === 'CANCELLED').length;
  }
}
