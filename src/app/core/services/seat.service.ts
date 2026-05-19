import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Seat, SeatCreateRequest, SeatClass } from '../models/index';

@Injectable({ providedIn: 'root' })
export class SeatService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/seats`;

  addSeats(payload: SeatCreateRequest): Observable<Seat[]> {
    return this.http.post<Seat[]>(this.baseUrl, payload);
  }
  getSeatById(seatId: string): Observable<Seat> {
    return this.http.get<Seat>(`${this.baseUrl}/${seatId}`);
  }
  getAvailableSeats(flightId: string): Observable<Seat[]> {
    return this.http.get<Seat[]>(`${this.baseUrl}/flight/${flightId}/available`);
  }
  getSeatsByClass(flightId: string, seatClass: SeatClass): Observable<Seat[]> {
    return this.http.get<Seat[]>(`${this.baseUrl}/flight/${flightId}/class/${seatClass}`);
  }
  getSeatMap(flightId: string): Observable<Seat[]> {
    return this.http.get<Seat[]>(`${this.baseUrl}/flight/${flightId}/map`);
  }
  getAvailableCount(flightId: string, seatClass: SeatClass): Observable<number> {
    const params = new HttpParams().set('seatClass', seatClass);
    return this.http.get<number>(`${this.baseUrl}/flight/${flightId}/count`, { params });
  }
  holdSeat(seatId: string): Observable<Seat> {
    return this.http.put<Seat>(`${this.baseUrl}/hold`, { seatId });
  }
  releaseSeat(seatId: string): Observable<Seat> {
    return this.http.put<Seat>(`${this.baseUrl}/${seatId}/release`, {});
  }
  confirmSeat(seatId: string): Observable<Seat> {
    return this.http.put<Seat>(`${this.baseUrl}/${seatId}/confirm`, {});
  }
  updateSeat(seatId: string, payload: Partial<Seat>): Observable<Seat> {
    return this.http.put<Seat>(`${this.baseUrl}/${seatId}`, payload);
  }
  deleteSeatsForFlight(flightId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/flight/${flightId}`);
  }
}
