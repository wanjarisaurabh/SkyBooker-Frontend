import { Injectable } from '@angular/core';
import { Booking, Notification } from '../models/index';

const LOCAL_NOTIFICATION_PREFIX = 'skybooker_local_notifications_';

@Injectable({ providedIn: 'root' })
export class LocalNotificationService {
  addBookingConfirmed(booking: Booking, userId: string): void {
    const notification: Notification = {
      notificationId: `local_booking_${booking.bookingId}`,
      recipientId: userId,
      type: 'BOOKING_CONFIRMED',
      channel: 'APP',
      title: 'Booking Confirmed!',
      message: `Your booking (PNR: ${booking.pnrCode}) is confirmed. Amount paid: Rs ${booking.totalFare.toLocaleString('en-IN')}. Have a great flight!`,
      relatedBookingId: booking.bookingId,
      isRead: false,
      sentAt: new Date().toISOString()
    };

    const notifications = this.getNotifications(userId);
    const withoutExisting = notifications.filter(n => n.relatedBookingId !== booking.bookingId);
    this.saveNotifications(userId, [notification, ...withoutExisting]);
  }

  getNotifications(userId: string): Notification[] {
    try {
      const raw = localStorage.getItem(this.storageKey(userId));
      return raw ? JSON.parse(raw) as Notification[] : [];
    } catch {
      return [];
    }
  }

  markAsRead(userId: string, notificationId: string): Notification | null {
    const notifications = this.getNotifications(userId);
    let updated: Notification | null = null;
    const next = notifications.map(n => {
      if (n.notificationId !== notificationId) return n;
      updated = { ...n, isRead: true };
      return updated;
    });
    this.saveNotifications(userId, next);
    return updated;
  }

  markAllAsRead(userId: string): void {
    this.saveNotifications(userId, this.getNotifications(userId).map(n => ({ ...n, isRead: true })));
  }

  removeBookingConfirmed(userId: string, bookingIds: string[]): void {
    if (bookingIds.length === 0) return;
    const bookingIdSet = new Set(bookingIds);
    const next = this.getNotifications(userId).filter(n =>
      !(n.type === 'BOOKING_CONFIRMED' && n.relatedBookingId && bookingIdSet.has(n.relatedBookingId))
    );
    this.saveNotifications(userId, next);
  }

  getUnreadCount(userId: string): number {
    return this.getNotifications(userId).filter(n => !n.isRead).length;
  }

  private saveNotifications(userId: string, notifications: Notification[]): void {
    try {
      localStorage.setItem(this.storageKey(userId), JSON.stringify(notifications));
    } catch {
      // Non-critical: server notifications still work if browser storage is unavailable.
    }
  }

  private storageKey(userId: string): string {
    return `${LOCAL_NOTIFICATION_PREFIX}${userId}`;
  }
}
