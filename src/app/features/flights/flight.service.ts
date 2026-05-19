import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FlightService {
  private baseUrl = 'http://localhost:8080/flights';

  constructor(private http: HttpClient) {}

  searchFlights(data: any) {
    return this.http.post(`${this.baseUrl}/search`, data);
  }
}
