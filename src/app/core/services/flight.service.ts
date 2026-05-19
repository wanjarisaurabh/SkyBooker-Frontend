import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Flight, FlightCreateRequest, RoundTripResponse, FlightStatus } from '../models/index';

@Injectable({ providedIn: 'root' })
export class FlightService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/flights`;

  addFlight(payload: FlightCreateRequest): Observable<Flight> {
    return this.http.post<Flight>(this.baseUrl, payload);
  }

  getFlightById(id: string): Observable<Flight> {
    return this.http.get<Flight>(`${this.baseUrl}/${id}`);
  }

  getFlightsByAirline(airlineId: string): Observable<Flight[]> {
    return this.http.get<Flight[]>(`${this.baseUrl}/airline/${airlineId}`);
  }

  searchFlights(origin: string, destination: string, date: string): Observable<Flight[]> {
    const params = new HttpParams()
      .set('origin', origin)
      .set('destination', destination)
      .set('date', date);
    return this.http.get<Flight[]>(`${this.baseUrl}/search`, { params });
  }

  searchRoundTrip(origin: string, destination: string, departureDate: string, returnDate: string): Observable<RoundTripResponse> {
    const params = new HttpParams()
      .set('origin', origin)
      .set('destination', destination)
      .set('departureDate', departureDate)
      .set('returnDate', returnDate);
    return this.http.get<RoundTripResponse>(`${this.baseUrl}/search/round-trip`, { params });
  }

  updateFlight(id: string, payload: FlightCreateRequest): Observable<Flight> {
    return this.http.put<Flight>(`${this.baseUrl}/${id}`, payload);
  }

  updateFlightStatus(id: string, status: FlightStatus): Observable<Flight> {
    const params = new HttpParams().set('status', status);
    return this.http.put<Flight>(`${this.baseUrl}/${id}/status`, { status }, { params });
  }

  deleteFlight(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
