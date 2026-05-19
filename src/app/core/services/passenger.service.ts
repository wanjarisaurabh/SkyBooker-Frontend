import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PassengerInfo, PassengerCreateRequest } from '../models/index';

@Injectable({ providedIn: 'root' })
export class PassengerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/passengers`;

  addPassenger(payload: PassengerCreateRequest): Observable<PassengerInfo> {
    return this.http.post<PassengerInfo>(this.baseUrl, payload);
  }
  getPassengerById(id: string): Observable<PassengerInfo> {
    return this.http.get<PassengerInfo>(`${this.baseUrl}/${id}`);
  }
  getPassengersByBooking(bookingId: string): Observable<PassengerInfo[]> {
    return this.http.get<PassengerInfo[]>(`${this.baseUrl}/booking/${bookingId}`);
  }
  updatePassenger(id: string, payload: PassengerCreateRequest): Observable<PassengerInfo> {
    return this.http.put<PassengerInfo>(`${this.baseUrl}/${id}`, payload);
  }
  assignSeat(id: string, seatId: string, seatNumber: string): Observable<PassengerInfo> {
    return this.http.put<PassengerInfo>(
      `${this.baseUrl}/${id}/assign-seat?seatId=${seatId}&seatNumber=${seatNumber}`,
      null, // ✅ no body
    );
  }
  deletePassenger(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  getPassengerCount(bookingId: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/count/${bookingId}`);
  }
}
