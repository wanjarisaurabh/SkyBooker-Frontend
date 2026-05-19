import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LocalNotificationService } from '../../../core/services/local-notification.service';
import { Notification } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="notif-page">
      <div class="notif-container">
        <div class="notif-header">
          <h1><span class="material-symbols-rounded">notifications</span> Notifications</h1>
          @if (notifications().length > 0) {
            <button class="mark-all-btn" (click)="markAll()">Mark all as read</button>
          }
        </div>
        @if (loading()) { <div class="notif-loading"><div class="spinner"></div></div> }
        @if (!loading() && notifications().length === 0) {
          <div class="notif-empty">
            <span class="material-symbols-rounded" style="font-size:52px;color:#cabdff">notifications_none</span>
            <p>You're all caught up! No notifications.</p>
          </div>
        }
        @for (n of paginatedNotifications(); track n.notificationId) {
          <div class="notif-card" [class.unread]="!n.isRead" (click)="markRead(n)">
            <div class="notif-ic-wrap">
              <span class="material-symbols-rounded mat-icon-filled" style="font-size:22px">{{ getIcon(n.type) }}</span>
            </div>
            <div class="notif-text">
              <p class="notif-title-txt">{{ n.title }}</p>
              <p class="notif-msg-txt">{{ n.message }}</p>
              <span class="notif-ts">{{ formatDate(n.sentAt) }}</span>
            </div>
            @if (!n.isRead) { <span class="unread-dot"></span> }
          </div>
        }

        <!-- Pagination UI -->
        @if (totalPages() > 1) {
          <div class="pagination-hub">
            <button class="page-btn" [disabled]="currentPage() === 1" (click)="setPage(currentPage() - 1)">
              <span class="material-symbols-rounded">chevron_left</span>
            </button>
            @for (p of pagesArray(); track p) {
              <button class="page-btn" [class.active]="currentPage() === p" (click)="setPage(p)">{{ p }}</button>
            }
            <button class="page-btn" [disabled]="currentPage() === totalPages()" (click)="setPage(currentPage() + 1)">
              <span class="material-symbols-rounded">chevron_right</span>
            </button>
          </div>
        }
      </div>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .notif-page { flex: 1; padding: 28px 0 56px; background: var(--background); }
    .notif-container { max-width: 760px; margin: 0 auto; padding: 0 24px; }
    .notif-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
    .notif-header h1 { display: flex; align-items: center; gap: 10px; font-size: 1.5rem; font-weight: 800; color: var(--on-surface); }
    .notif-header h1 .material-symbols-rounded { font-size: 26px; color: var(--primary); }
    .mark-all-btn { padding: 8px 16px; border-radius: 10px; border: 1.5px solid var(--outline); background: var(--surface); color: var(--primary); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.18s; }
    .mark-all-btn:hover { background: var(--clr-primary-50); }
    .notif-card { display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; background: var(--surface); border-radius: 14px; border: 1.5px solid var(--outline); margin-bottom: 10px; cursor: pointer; transition: all 0.18s; position: relative; box-shadow: var(--glass-shadow); }
    .notif-card:hover { border-color: var(--clr-primary-300); transform: translateY(-1px); }
    .notif-card.unread { border-left: 3px solid var(--primary); background: var(--clr-primary-50); }
    .notif-ic-wrap { width: 40px; height: 40px; border-radius: 12px; background: var(--clr-primary-100); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--primary); }
    .notif-text { flex: 1; }
    .notif-title-txt { font-size: 14px; font-weight: 700; color: var(--on-surface); margin: 0 0 4px; }
    .notif-msg-txt { font-size: 13px; color: var(--on-surface-variant); margin: 0 0 6px; line-height: 1.5; }
    .notif-ts { font-size: 11px; color: var(--on-surface-muted); }
    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); flex-shrink: 0; margin-top: 6px; }
    .notif-loading { display: flex; justify-content: center; padding: 40px; }
    .spinner { width: 30px; height: 30px; border: 3px solid var(--outline); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.75s linear infinite; }
    .notif-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 24px; background: var(--surface); border-radius: 18px; text-align: center; border: 1px solid var(--outline); }
    .notif-empty p { font-size: 14px; color: var(--on-surface-variant); }
    @keyframes spin { to { transform: rotate(360deg); } }
    .pagination-hub { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--outline); }
    .page-btn { min-width: 34px; height: 34px; padding: 0 8px; border-radius: 10px; border: 1.5px solid var(--outline); background: var(--surface); color: var(--on-surface-variant); font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: var(--clr-primary-50); }
    .page-btn.active { background: var(--grad-primary); color: white; border-color: transparent; box-shadow: 0 4px 10px rgba(37,99,235,0.2); }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-btn .material-symbols-rounded { font-size: 18px; }
  `]
})
export class NotificationsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notifService = inject(NotificationService);
  private readonly localNotificationService = inject(LocalNotificationService);
  notifications = signal<Notification[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = 6;

  paginatedNotifications = computed(() => {
    const all = this.notifications();
    const start = (this.currentPage() - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.notifications().length / this.pageSize));
  pagesArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  setPage(page: number): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnInit(): void {
    const uid = this.authService.getUserId();
    if (!uid) return;
    this.notifService.getNotifications(uid).pipe(catchError(() => of([]))).subscribe(n => {
      const serverAppNotifications = n.filter(notification => notification.channel === 'APP');
      const serverBookingIds = serverAppNotifications
        .filter(notification => notification.type === 'BOOKING_CONFIRMED' && !!notification.relatedBookingId)
        .map(notification => notification.relatedBookingId);
      this.localNotificationService.removeBookingConfirmed(uid, serverBookingIds);

      this.notifications.set(this.mergeNotifications(
        serverAppNotifications,
        this.localNotificationService.getNotifications(uid)
      ));
      this.loading.set(false);
    });
  }

  markRead(n: Notification): void {
    if (n.isRead) return;
    const uid = this.authService.getUserId();
    if (n.notificationId.startsWith('local_') && uid) {
      const updated = this.localNotificationService.markAsRead(uid, n.notificationId);
      if (updated) {
        this.notifications.update(list => list.map(x => x.notificationId === updated.notificationId ? updated : x));
      }
      return;
    }

    this.notifService.markAsRead(n.notificationId).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated) {
        this.notifications.update(list => list.map(x => x.notificationId === updated.notificationId ? updated : x));
      }
    });
  }

  markAll(): void {
    const uid = this.authService.getUserId();
    if (!uid) return;
    this.localNotificationService.markAllAsRead(uid);
    this.notifService.markAllAsRead(uid).pipe(catchError(() => of(null))).subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    });
  }

  getIcon(type: string): string {
    const m: Record<string, string> = { BOOKING_CONFIRMED: 'check_circle', FLIGHT_DELAY: 'schedule', GATE_CHANGE: 'door_front', CHECKIN_REMINDER: 'assignment_turned_in', BOARDING_REMINDER: 'flight_takeoff', PAYMENT_SUCCESS: 'payments', BOOKING_CANCELLED: 'cancel', GENERAL: 'notifications' };
    return m[type] || 'notifications';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  }

  private mergeNotifications(serverNotifications: Notification[], localNotifications: Notification[]): Notification[] {
    const seen = new Set<string>();
    return [...localNotifications, ...serverNotifications]
      .filter(n => n.channel === 'APP')
      .filter(n => {
        const key = n.relatedBookingId ? `${n.type}:${n.relatedBookingId}` : n.notificationId;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }
}
