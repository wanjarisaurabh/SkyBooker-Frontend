import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Booking, Flight, Notification, PaymentResponse, BroadcastRequest, BroadcastResponse } from '../models/index';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/notifications`;

  getNotifications(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/user/${userId}`);
  }
  getUnreadNotifications(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/user/${userId}/unread`);
  }
  getUnreadCount(userId: string): Observable<number> {
    return this.http.get<{ unreadCount: number }>(`${this.baseUrl}/user/${userId}/unread/count`).pipe(
      map(res => res?.unreadCount ?? 0)
    );
  }
  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.baseUrl}/${notificationId}/read`, {});
  }
  markAllAsRead(userId: string): Observable<number> {
    return this.http.put<{ updated: number }>(`${this.baseUrl}/user/${userId}/read-all`, {}).pipe(
      map(res => res?.updated ?? 0)
    );
  }
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${notificationId}`);
  }
  broadcastNotification(payload: BroadcastRequest): Observable<BroadcastResponse> {
    return this.http.post<BroadcastResponse>(`${this.baseUrl}/admin/broadcast`, payload);
  }
  sendBookingConfirmedNotification(
    booking: Booking,
    flight?: Flight | null,
    payment?: PaymentResponse | null
  ): Observable<{ sent: boolean; email: string }> {
    return this.http.post<{ sent: boolean; email: string }>(`${this.baseUrl}/internal/booking-confirmed`, {
      bookingId: booking.bookingId,
      userId: booking.userId,
      pnrCode: booking.pnrCode,
      userEmail: booking.contactEmail,
      amount: booking.totalFare,
      currency: payment?.currency || 'INR',
      transactionId: payment?.transactionId || payment?.razorpayPaymentId || booking.paymentId || null,
      flightNumber: flight?.flightNumber || null,
      origin: flight?.originAirportCode || null,
      destination: flight?.destinationAirportCode || null
    });
  }
}
