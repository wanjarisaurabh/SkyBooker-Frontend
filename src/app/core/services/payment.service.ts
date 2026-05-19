import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaymentResponse,
  PaymentInitiateRequest,
  PaymentVerifyRequest,
  PaymentRefundRequest,
  RevenueResponse
} from '../models/index';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/payments`;

  initiatePayment(payload: PaymentInitiateRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/initiate`, payload);
  }
  verifyPayment(payload: PaymentVerifyRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/verify`, payload);
  }
  refundPayment(payload: PaymentRefundRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/refund`, payload);
  }
  getPaymentById(paymentId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.baseUrl}/${paymentId}`);
  }
  getPaymentByBooking(bookingId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.baseUrl}/booking/${bookingId}`);
  }
  getPaymentsByUser(userId: string): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.baseUrl}/user/${userId}`);
  }
  getRevenue(): Observable<RevenueResponse> {
    return this.http.get<RevenueResponse>(`${this.baseUrl}/admin/revenue`);
  }
}
