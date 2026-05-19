import { Component, inject, signal, HostListener, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LocalNotificationService } from '../../core/services/local-notification.service';
import { Subscription, interval, startWith, switchMap, EMPTY, map, catchError, of } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})

export class NavbarComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly notifService = inject(NotificationService);
  private readonly localNotificationService = inject(LocalNotificationService);
  private readonly router = inject(Router);

  mobileMenuOpen = signal(false);
  unreadCount = signal(0);
  private pollSub?: Subscription;

  user = computed(() => this.authService.currentUser());
  isLoggedIn = computed(() => this.authService.isLoggedIn());
  role = computed(() => this.authService.getRole());

  ngOnInit(): void {
    // Start polling for notifications if logged in
    this.pollSub = interval(10000).pipe(
      startWith(0),
      switchMap(() => {
        const userId = this.authService.getUserId();
        if (this.isLoggedIn() && userId) {
          // Using getUnreadNotifications().length as a more reliable source of truth
          return this.notifService.getUnreadNotifications(userId).pipe(
            map(notifs => {
              const serverAppNotifs = notifs.filter(n => n.channel === 'APP');
              const serverBookingIds = serverAppNotifs
                .filter(n => n.type === 'BOOKING_CONFIRMED' && !!n.relatedBookingId)
                .map(n => n.relatedBookingId);
              this.localNotificationService.removeBookingConfirmed(userId, serverBookingIds);

              const appNotifs = [
                ...serverAppNotifs,
                ...this.localNotificationService.getNotifications(userId).filter(n => !n.isRead)
              ];
              const seen = new Set<string>();
              const uniqueAppNotifs = appNotifs.filter(n => {
                const key = n.relatedBookingId ? `${n.type}:${n.relatedBookingId}` : n.notificationId;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              return uniqueAppNotifs.length;
            }),
            catchError(() => of(this.localNotificationService.getUnreadCount(userId)))
          );
        }
        return of(0);
      })
    ).subscribe({
      next: (count) => {
        this.unreadCount.set(count);
      },
      error: () => { }
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  toggleMobile(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobile(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.closeMobile();
    this.unreadCount.set(0);
  }

  getDashboardRoute(): string {
    const r = this.role();
    if (r === 'AIRLINE_STAFF') return '/staff/dashboard';
    if (r === 'ADMIN') return '/admin/dashboard';
    return '/passenger/dashboard';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMobile();
  }
}
