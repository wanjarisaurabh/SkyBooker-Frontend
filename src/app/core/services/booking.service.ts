import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Booking, BookingCreateRequest, BookingAddonRequest } from '../models/index';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/bookings`;

  createBooking(payload: BookingCreateRequest): Observable<Booking> {
    return this.http.post<Booking>(this.baseUrl, payload);
  }
  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/${id}`);
  }
  getBookingByPnr(pnr: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/pnr/${pnr}`);
  }
  getBookingsByUser(userId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/user/${userId}`);
  }
  getUpcomingBookings(userId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/user/${userId}/upcoming`);
  }
  getBookingsByFlight(flightId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/flight/${flightId}`);
  }
  cancelBooking(id: string): Observable<Booking> {
    return this.http.put<Booking>(`${this.baseUrl}/${id}/cancel`, {});
  }
  confirmBooking(id: string): Observable<Booking> {
    return this.http.put<Booking>(`${this.baseUrl}/${id}/confirm`, {});
  }
  addAddon(id: string, payload: BookingAddonRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.baseUrl}/${id}/addon`, payload);
  }
}
