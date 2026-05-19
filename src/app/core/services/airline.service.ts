import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Airline, Airport, AirlineCreateRequest, AirportCreateRequest } from '../models/index';


//service have the logical part comman logic 
@Injectable({ providedIn: 'root' })
export class AirlineService {
  private readonly http = inject(HttpClient);
  private readonly airlineUrl = `${environment.apiUrl}/api/v1/airlines`;
  private readonly airportUrl = `${environment.apiUrl}/api/v1/airports`;

  // --- Airlines ---
  createAirline(payload: AirlineCreateRequest): Observable<Airline> {
    return this.http.post<Airline>(this.airlineUrl, payload);
  }
  getAllAirlines(): Observable<Airline[]> {
    return this.http.get<Airline[]>(this.airlineUrl);
  }
  getActiveAirlines(): Observable<Airline[]> {
    return this.http.get<Airline[]>(`${this.airlineUrl}/active`);
  }
  getAirlineById(id: string): Observable<Airline> {
    return this.http.get<Airline>(`${this.airlineUrl}/${id}`);
  }
  getAirlineByIata(iata: string): Observable<Airline> {
    return this.http.get<Airline>(`${this.airlineUrl}/iata/${iata}`);
  }
  updateAirline(id: string, payload: AirlineCreateRequest): Observable<Airline> {
    return this.http.put<Airline>(`${this.airlineUrl}/${id}`, payload);
  }
  activateAirline(id: string): Observable<Airline> {
    return this.http.patch<Airline>(`${this.airlineUrl}/${id}/activate`, {});
  }
  deactivateAirline(id: string): Observable<Airline> {
    return this.http.patch<Airline>(`${this.airlineUrl}/${id}/deactivate`, {});
  }

  // --- Airports ---
  createAirport(payload: AirportCreateRequest): Observable<Airport> {
    return this.http.post<Airport>(this.airportUrl, payload);
  }
  getAllAirports(): Observable<Airport[]> {
    return this.http.get<Airport[]>(this.airportUrl);
  }
  getAirportById(id: string): Observable<Airport> {
    return this.http.get<Airport>(`${this.airportUrl}/${id}`);
  }
  getAirportByIata(iata: string): Observable<Airport> {
    return this.http.get<Airport>(`${this.airportUrl}/iata/${iata}`);
  }
  getAirportsByCity(city: string): Observable<Airport[]> {
    return this.http.get<Airport[]>(`${this.airportUrl}/city/${city}`);
  }
  getAirportsByCountry(country: string): Observable<Airport[]> {
    return this.http.get<Airport[]>(`${this.airportUrl}/country/${country}`);
  }
  searchAirports(keyword: string): Observable<Airport[]> {
    return this.http.get<Airport[]>(`${this.airportUrl}/search`, {
      params: { keyword } //https://api.com/airports/search?keyword=del
    });
  }
  updateAirport(id: string, payload: AirportCreateRequest): Observable<Airport> {
    return this.http.put<Airport>(`${this.airportUrl}/${id}`, payload);
  }
}
