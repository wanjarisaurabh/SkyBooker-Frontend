import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightService } from './flight.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-flight-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Search Flights</h2>

    <form (ngSubmit)="search()">
      <input [(ngModel)]="source" name="source" placeholder="From" required />
      <input [(ngModel)]="destination" name="destination" placeholder="To" required />
      <input [(ngModel)]="date" name="date" type="date" required />

      <button type="submit">Search</button>
    </form>

    <div *ngIf="flights.length">
      <h3>Available Flights</h3>

      <div *ngFor="let flight of flights" style="border:1px solid #ccc; padding:10px; margin:10px;">
        <p>
          <b>{{ flight.flightNumber }}</b>
        </p>
        <p>{{ flight.source }} → {{ flight.destination }}</p>
        <p>Price: ₹{{ flight.price }}</p>

        <button (click)="selectFlight(flight)">Select</button>
      </div>
    </div>
  `,
})
export class FlightListComponent {
  source = '';
  destination = '';
  date = '';
  flights: any[] = [];

  constructor(
    private flightService: FlightService,
    private router: Router,
  ) {}

  search() {
    this.flightService
      .searchFlights({
        source: this.source,
        destination: this.destination,
        date: this.date,
      })
      .subscribe({
        next: (res: any) => (this.flights = res),
        error: () => alert('Error fetching flights'),
      });
  }

  selectFlight(flight: any) {
    localStorage.setItem('selectedFlight', JSON.stringify(flight));
    this.router.navigate(['/booking']);
  }
}
