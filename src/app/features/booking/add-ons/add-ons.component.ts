import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Booking, MealPreference } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { catchError, of } from 'rxjs';
//commandModule , gives basic functionality of angular to use any directive


//computed() = dusri signals ke basis par automatically calculate hone wali value.
// count = signal(10);
// Ye reactive value hai.
// doubleCount = computed(() => this.count() * 2);
// Ye derived value hai.
// Agar:
// this.count.set(20);
// to automatically:
// doubleCount = 40


@Component({
  selector: 'app-add-ons',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="page">
      <div class="container">
        <div class="steps">
          <span class="done">1. Flight</span><b>›</b><span class="done">2. Passenger</span><b>›</b><span class="done">3. Seat</span><b>›</b><span class="active">4. Add-ons</span><b>›</b><span>5. Payment</span>
        </div>
        <h1>Add-ons</h1>
        @if (loading()) { <div class="loading"><div class="spinner"></div></div> }
        @if (!loading() && booking()) {
          <div class="grid">
            <section class="panel">
              <h2>Meal Preference</h2>
              <div class="options">
                @for (meal of meals; track meal.value) {
                  <button type="button" [class.selected]="mealPreference() === meal.value" (click)="mealPreference.set(meal.value)">
                    <span class="material-symbols-rounded">{{ meal.icon }}</span>
                    <strong>{{ meal.label }}</strong>
                    <small>{{ meal.price === 0 ? 'Included' : '₹' + meal.price }}</small>
                  </button>
                }
              </div>
            </section>

            <section class="panel">
              <h2>Travel Extras</h2>
              <label class="luggage">
                Extra luggage
                <select [ngModel]="extraLuggageKg()" (ngModelChange)="extraLuggageKg.set($event)">
                  <option [ngValue]="0">No extra luggage</option>
                  <option [ngValue]="5">5 kg · ₹1,000</option>
                  <option [ngValue]="10">10 kg · ₹1,800</option>
                  <option [ngValue]="15">15 kg · ₹2,500</option>
                </select>
              </label>
              <label class="check">
                <input type="checkbox" [ngModel]="priorityBoarding()" (ngModelChange)="priorityBoarding.set($event)" />
                <span>Priority boarding</span>
                <strong>₹600</strong>
              </label>
              <p class="hint">Priority boarding is priced through the backend add-on cost field.</p>
            </section>

            <aside class="summary">
              <h2>Price Update</h2>
              <div><span>Current fare</span><strong>₹{{ booking()!.totalFare.toLocaleString('en-IN') }}</strong></div>
              <div><span>Add-ons</span><strong>₹{{ addonCost().toLocaleString('en-IN') }}</strong></div>
              <div class="total"><span>New total</span><strong>₹{{ (booking()!.totalFare + addonCost()).toLocaleString('en-IN') }}</strong></div>
              @if (error()) { <div class="error">{{ error() }}</div> }
              <button [disabled]="saving()" (click)="continue()">
                @if (saving()) { <span class="spinner-small"></span> Saving... }
                @else { Continue to Summary <span class="material-symbols-rounded">arrow_forward</span> }
              </button>
              <button class="skip" type="button" (click)="skip()">Skip add-ons</button>
            </aside>
          </div>
        }
      </div>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    :host{display:flex;flex-direction:column;min-height:100vh}.page{flex:1;background:var(--background);padding:28px 0 56px}.container{max-width:1050px;margin:0 auto;padding:0 24px}.steps{display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--on-surface-muted);font-size:13px;font-weight:800;margin-bottom:18px}.steps .done{color:var(--success)}.steps .active{color:var(--primary)}h1{font-size:1.5rem;color:var(--on-surface);margin:0 0 18px}.loading{display:flex;justify-content:center;padding:60px}.spinner,.spinner-small{border-radius:50%;border:3px solid var(--outline);border-top-color:var(--primary);animation:spin .75s linear infinite}.spinner{width:30px;height:30px}.spinner-small{width:15px;height:15px;border-width:2px;border-top-color:#fff}.grid{display:grid;grid-template-columns:1fr 1fr 320px;gap:16px;align-items:start}.panel,.summary{background:var(--surface);border:1px solid var(--outline);border-radius:18px;padding:22px;box-shadow:var(--glass-shadow)}h2{font-size:16px;color:var(--on-surface);margin:0 0 16px}.options{display:grid;grid-template-columns:1fr 1fr;gap:10px}.options button{min-height:96px;border:1.5px solid var(--outline);background:var(--surface);border-radius:14px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:14px;cursor:pointer;color:var(--on-surface);transition:all 0.2s}.options button.selected{border-color:var(--primary);box-shadow:0 0 0 4px var(--clr-primary-100)}.options .material-symbols-rounded{color:var(--primary)}.options small,.hint{color:var(--on-surface-variant)}.luggage{display:flex;flex-direction:column;gap:8px;font-size:13px;font-weight:800;color:var(--on-surface);margin-bottom:16px}.luggage select{height:44px;border:1.5px solid var(--outline);border-radius:12px;padding:0 12px;background:var(--surface-2);font:inherit;color:var(--on-surface)}.check{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;border:1.5px solid var(--outline);border-radius:14px;padding:14px;background:var(--surface)}.summary div{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--outline)}.summary .total{font-size:17px}.summary .total strong{color:var(--primary)}.summary button{width:100%;height:48px;border:0;border-radius:13px;background:var(--grad-primary);color:#fff;font-weight:900;font:inherit;display:flex;align-items:center;justify-content:center;gap:7px;margin-top:16px;cursor:pointer;box-shadow:0 8px 20px rgba(37,99,235,0.22)}.summary button.skip{background:var(--surface);color:var(--on-surface-variant);border:1.5px solid var(--outline);margin-top:10px}.error{margin-top:12px;border-radius:10px;background:var(--clr-error-bg);border:1px solid rgba(244,63,94,0.16);color:var(--clr-error);padding:10px;font-size:13px}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:900px){.grid{grid-template-columns:1fr}.options{grid-template-columns:1fr 1fr}}@media(max-width:520px){.options{grid-template-columns:1fr}.container{padding:0 12px}}
  `]
})
export class AddOnsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  bookingId = '';
  flightId = '';
  passengerId = '';
  seatNumber = '';
  booking = signal<Booking | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal('');

  mealPreference = signal<MealPreference | ''>('');
  extraLuggageKg = signal(0);
  priorityBoarding = signal(false);

  meals: Array<{ value: MealPreference | ''; label: string; icon: string; price: number }> = [
    { value: '', label: 'No meal', icon: 'block', price: 0 },
    { value: 'VEG', label: 'Vegetarian', icon: 'eco', price: 350 },
    { value: 'NON_VEG', label: 'Non-veg', icon: 'restaurant', price: 450 },
    { value: 'JAIN', label: 'Jain', icon: 'spa', price: 350 },
    { value: 'VEGAN', label: 'Vegan', icon: 'nutrition', price: 400 }
  ];

  addonCost = computed(() => {
    const meal = this.meals.find(m => m.value === this.mealPreference())?.price || 0;
    const kg = this.extraLuggageKg();
    const luggage = kg === 5 ? 1000 : kg === 10 ? 1800 : kg === 15 ? 2500 : 0;
    return meal + luggage + (this.priorityBoarding() ? 600 : 0);
  });

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') || '';
    const p = this.route.snapshot.queryParams;
    this.flightId = p['flightId'] || '';
    this.passengerId = p['passengerId'] || '';
    this.seatNumber = p['seatNumber'] || '';
    this.bookingService.getBookingById(this.bookingId).pipe(catchError(err => {
      this.error.set(err?.error?.message || 'Unable to load booking.');
      return of(null);
    })).subscribe(b => {
      this.booking.set(b);
      this.loading.set(false);
    });
  }

  continue(): void {
    const cost = this.addonCost();
    this.saving.set(true);
    this.error.set('');
    const details = {
      mealPreference: this.mealPreference() || null,
      extraLuggageKg: this.extraLuggageKg(),
      priorityBoarding: this.priorityBoarding(),
      additionalCost: cost
    };
    sessionStorage.setItem(`skybooker_addons_${this.bookingId}`, JSON.stringify(details));

    // If no cost and nothing selected, just skip
    if (cost === 0 && !this.mealPreference() && this.extraLuggageKg() === 0 && !this.priorityBoarding()) {
      this.skip();
      return;
    }

    this.bookingService.addAddon(this.bookingId, {
      mealPreference: this.mealPreference() || undefined,
      extraLuggageKg: this.extraLuggageKg() || undefined,
      additionalCost: cost
    }).subscribe({
      next: () => this.goSummary(),
      error: err => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Unable to save add-ons.');
      }
    });
  }

  skip(): void {
    sessionStorage.removeItem(`skybooker_addons_${this.bookingId}`);
    this.goSummary();
  }

  private goSummary(): void {
    this.saving.set(false);
    this.router.navigate(['/booking/summary', this.bookingId], {
      queryParams: { flightId: this.flightId, passengerId: this.passengerId, seatNumber: this.seatNumber }
    });
  }
}
