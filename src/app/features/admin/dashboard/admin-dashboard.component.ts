import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AirlineService } from '../../../core/services/airline.service';
import { FlightService } from '../../../core/services/flight.service';
import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Airline, Airport, AirportCreateRequest, Booking, UserSummaryResponse, BroadcastRequest } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly airlineService = inject(AirlineService);
  private readonly bookingService = inject(BookingService);
  private readonly paymentService = inject(PaymentService);
  private readonly notifService = inject(NotificationService);

  user = computed(() => this.authService.currentUser());

  countries = [
    'INDIA', 'USA', 'UK', 'CANADA', 'AUSTRALIA', 'GERMANY', 'FRANCE', 
    'UAE', 'SINGAPORE', 'JAPAN', 'CHINA', 'BRAZIL', 'RUSSIA'
  ];

  timezones = [
    'Asia/Kolkata', 'UTC', 'GMT', 'Europe/London', 'America/New_York', 
    'America/Los_Angeles', 'America/Chicago', 'Asia/Dubai', 'Asia/Singapore', 
    'Asia/Tokyo', 'Australia/Sydney', 'Europe/Paris', 'Europe/Berlin'
  ];

  airlines = signal<Airline[]>([]);
  airports = signal<Airport[]>([]);
  users = signal<UserSummaryResponse[]>([]);
  bookings = signal<Booking[]>([]);
  totalRevenue = signal(0);

  loading = signal(true);
  activeTab = signal<string>('overview');

  // Pagination
  currentPage = signal(1);
  pageSize = 10;

  setTab(tab: string): void { 
    this.activeTab.set(tab); 
    this.currentPage.set(1);
  }

  paginatedAirlines = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.airlines().slice(start, start + this.pageSize);
  });

  paginatedAirports = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.airports().slice(start, start + this.pageSize);
  });

  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.users().slice(start, start + this.pageSize);
  });

  paginatedBookings = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.bookings().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => {
    const tab = this.activeTab();
    let count = 0;
    if (tab === 'airlines') count = this.airlines().length;
    else if (tab === 'airports') count = this.airports().length;
    else if (tab === 'users') count = this.users().length;
    else if (tab === 'bookings') count = this.bookings().length;
    return Math.ceil(count / this.pageSize);
  });

  pagesArray = computed(() => {
    const total = this.totalPages();
    if (total <= 1) return [];
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Broadcast
  broadcastTitle = '';
  broadcastMsg = '';
  broadcastRole: string = '';
  broadcastLoading = signal(false);
  broadcastSuccess = signal('');
  broadcastError = signal('');

  // Airline form
  showAirlineModal = signal(false);
  airlineForm = { airlineId: '', name: '', iataCode: '', icaoCode: '', country: '', contactEmail: '', contactPhone: '', logoUrl: '' };
  airlineFormLoading = signal(false);
  airlineFormError = signal('');

  // Airport form
  showAirportModal = signal(false);
  airportForm: Partial<AirportCreateRequest> = { airportId: '', name: '', iataCode: '', icaoCode: '', city: '', country: '', latitude: 0, longitude: 0, timezone: '' };
  airportFormLoading = signal(false);
  airportFormError = signal('');

  // User form
  showUserModal = signal(false);
  userForm = { fullName: '', email: '', password: '', phone: '', role: 'PASSENGER' as any, passportNumber: '', nationality: '' };
  userFormLoading = signal(false);
  userFormError = signal('');
  showDeleteUserModal = signal(false);
  userToDelete = signal<UserSummaryResponse | null>(null);
  deleteUserLoading = signal(false);
  deleteUserError = signal('');

  ngOnInit(): void {
    this.airlineService.getAllAirlines().pipe(catchError(() => of([]))).subscribe(a => {
      this.airlines.set(a);
    });
    this.airlineService.getAllAirports().pipe(catchError(() => of([]))).subscribe(p => {
      this.airports.set(p);
    });
    this.authService.getAllUsers().pipe(catchError(() => of([]))).subscribe(u => {
      this.users.set(u);
      this.loadAllBookings(u);
    });
    this.paymentService.getRevenue().pipe(catchError(() => of({ totalRevenue: 0 }))).subscribe((r: any) => {
      this.totalRevenue.set(r.totalRevenue ?? 0);
      this.loading.set(false);
    });
  }

  private loadAllBookings(users: UserSummaryResponse[]): void {
    const passengerIds = users.filter(u => u.role === 'PASSENGER').map(u => u.userId);
    if (passengerIds.length === 0) {
      this.bookings.set([]);
      return;
    }
    forkJoin(passengerIds.map(id => this.bookingService.getBookingsByUser(id).pipe(catchError(() => of([]))))).subscribe(groups => {
      this.bookings.set(groups.flat().sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()));
    });
  }

  sendBroadcast(): void {
    if (!this.broadcastTitle.trim() || !this.broadcastMsg.trim()) {
      this.broadcastError.set('Title and message are required.');
      return;
    }
    this.broadcastLoading.set(true);
    this.broadcastError.set('');

    // Determine recipient IDs based on selected role
    const usersList = this.users();
    let recipients: string[];
    if (this.broadcastRole && this.broadcastRole !== 'ALL') {
      recipients = usersList.filter(u => u.role === this.broadcastRole).map(u => u.userId);
    } else {
      recipients = usersList.map(u => u.userId);
    }

    if (recipients.length === 0) {
      this.broadcastLoading.set(false);
      this.broadcastError.set('No users found for the selected role.');
      return;
    }

    const payload: BroadcastRequest = {
      title: this.broadcastTitle.trim(),
      message: this.broadcastMsg.trim(),
      recipientIds: recipients,
      targetRole: this.broadcastRole as any || undefined
    };
    this.notifService.broadcastNotification(payload).subscribe({
      next: (res) => {
        this.broadcastLoading.set(false);
        this.broadcastSuccess.set(`Notification sent to ${res.sent} users!`);
        this.broadcastTitle = '';
        this.broadcastMsg = '';
        this.broadcastRole = '';
        setTimeout(() => this.broadcastSuccess.set(''), 3000);
      },
      error: (err) => {
        this.broadcastLoading.set(false);
        this.broadcastError.set(err?.error?.message || 'Failed to send broadcast.');
      }
    });
  }

  saveAirline(): void {
    this.airlineFormLoading.set(true);
    this.airlineFormError.set('');
    this.airlineService.createAirline(this.airlineForm as any).subscribe({
      next: (a) => {
        this.airlines.update(list => [a, ...list]);
        this.airlineFormLoading.set(false);
        this.showAirlineModal.set(false);
        this.airlineForm = { airlineId: '', name: '', iataCode: '', icaoCode: '', country: '', contactEmail: '', contactPhone: '', logoUrl: '' };
      },
      error: (err) => {
        this.airlineFormLoading.set(false);
        this.airlineFormError.set(err?.error?.message || 'Failed to create airline.');
      }
    });
  }

  toggleAirline(airline: Airline): void {
    const action$ = airline.isActive
      ? this.airlineService.deactivateAirline(airline.airlineId)
      : this.airlineService.activateAirline(airline.airlineId);

    action$.pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) {
        this.airlines.update(list => list.map(a => a.airlineId === updated.airlineId ? updated : a));
      }
    });
  }

  get passengerCount(): number { return this.users().filter(u => u.role === 'PASSENGER').length; }
  get staffCount(): number { return this.users().filter(u => u.role === 'AIRLINE_STAFF').length; }
  get adminCount(): number { return this.users().filter(u => u.role === 'ADMIN').length; }
  get activeAirlinesCount(): number { return this.airlines().filter(a => a.isActive).length; }
  get confirmedBookingsCount(): number { return this.bookings().filter(b => b.status === 'CONFIRMED').length; }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getDisplayStatus(booking: Booking): string {
    if (booking.status === 'NO_SHOW' && new Date(booking.departureTime) < new Date()) {
      return 'DEPARTED';
    }
    return booking.status;
  }

  saveAirport(): void {
    this.airportFormLoading.set(true);
    this.airportFormError.set('');
    this.airlineService.createAirport(this.airportForm as any).subscribe({
      next: (a) => {
        this.airports.update(list => [a, ...list]);
        this.airportFormLoading.set(false);
        this.showAirportModal.set(false);
        this.airportForm = { airportId: '', name: '', iataCode: '', icaoCode: '', city: '', country: '', latitude: 0, longitude: 0, timezone: '' };
      },
      error: (err) => {
        this.airportFormLoading.set(false);
        this.airportFormError.set(err?.error?.message || 'Failed to create airport.');
      }
    });
  }

  saveUser(): void {
    if (!this.userForm.fullName || !this.userForm.email || !this.userForm.password) {
      this.userFormError.set('Name, Email and Password are required.');
      return;
    }
    this.userFormLoading.set(true);
    this.userFormError.set('');
    this.authService.register(this.userForm as any).subscribe({
      next: () => {
        this.userFormLoading.set(false);
        this.showUserModal.set(false);
        this.userForm = { fullName: '', email: '', password: '', phone: '', role: 'PASSENGER', passportNumber: '', nationality: '' };
        // Reload users list
        this.authService.getAllUsers().pipe(catchError(() => of([]))).subscribe(u => this.users.set(u));
      },
      error: (err) => {
        this.userFormLoading.set(false);
        this.userFormError.set(err?.error?.message || 'Failed to create user.');
      }
    });
  }

  openDeleteUserModal(user: UserSummaryResponse): void {
    this.userToDelete.set(user);
    this.deleteUserError.set('');
    this.showDeleteUserModal.set(true);
  }

  closeDeleteUserModal(): void {
    if (this.deleteUserLoading()) return;
    this.showDeleteUserModal.set(false);
    this.userToDelete.set(null);
    this.deleteUserError.set('');
  }

  deleteSelectedUser(): void {
    const selected = this.userToDelete();
    if (!selected || this.deleteUserLoading()) return;

    this.deleteUserLoading.set(true);
    this.deleteUserError.set('');

    this.authService.deleteUser(selected.userId).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.userId !== selected.userId));
        this.bookings.update(list => list.filter(b => b.userId !== selected.userId));
        this.deleteUserLoading.set(false);
        this.closeDeleteUserModal();
      },
      error: (err) => {
        this.deleteUserLoading.set(false);
        this.deleteUserError.set(err?.error?.message || 'Failed to delete user.');
      }
    });
  }

  canDeleteUser(target: UserSummaryResponse): boolean {
    return target.userId !== this.user()?.userId;
  }
}
