import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { PassengerService } from '../../../core/services/passenger.service';
import { AuthService } from '../../../core/services/auth.service';
import { PassengerCreateRequest, TripType } from '../../../core/models/index';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-passenger-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="pd-page">
      <div class="pd-container">
        <div class="step-header">
          <a [routerLink]="['/flights/select', flightId]" class="back-btn">
            <span class="material-symbols-rounded">arrow_back</span> Back
          </a>
          <div class="steps">
            <span class="step done">1. Flight</span>
            <span class="step-sep material-symbols-rounded">chevron_right</span>
            <span class="step active">2. Passenger</span>
            <span class="step-sep material-symbols-rounded">chevron_right</span>
            <span class="step">3. Seat</span>
            <span class="step-sep material-symbols-rounded">chevron_right</span>
            <span class="step">4. Add-ons</span>
            <span class="step-sep material-symbols-rounded">chevron_right</span>
            <span class="step">5. Payment</span>
          </div>
        </div>

        <h1>Passenger Details</h1>

        <div class="pd-grid">
          <div class="pd-form-card">
            <h3>Primary Passenger</h3>
            <div class="form-row-2">
              <div class="form-group">
                <label>Title</label>
                <select [(ngModel)]="form.title" class="form-ctrl fc-sel">
                  <option value="Mr">Mr</option><option value="Ms">Ms</option><option value="Mrs">Mrs</option><option value="Dr">Dr</option>
                </select>
              </div>
              <div class="form-group">
                <label>Passenger Type</label>
                <select [(ngModel)]="form.passengerType" class="form-ctrl fc-sel">
                  <option value="ADULT">Adult (12+)</option><option value="CHILD">Child (2-11)</option><option value="INFANT">Infant (&lt;2)</option>
                </select>
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>First Name <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.firstName" (ngModelChange)="form.firstName = toUpperValue($event)" class="form-ctrl text-uppercase" [class.invalid]="isMissing(form.firstName)" />
                @if (isMissing(form.firstName)) { <small class="field-error">First name is required.</small> }
              </div>
              <div class="form-group">
                <label>Last Name <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.lastName" (ngModelChange)="form.lastName = toUpperValue($event)" class="form-ctrl text-uppercase" [class.invalid]="isMissing(form.lastName)" />
                @if (isMissing(form.lastName)) { <small class="field-error">Last name is required.</small> }
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Date of Birth <span class="req">*</span></label>
                <input type="date" [(ngModel)]="form.dateOfBirth" class="form-ctrl" [class.invalid]="isMissing(form.dateOfBirth) || hasInvalidDateOfBirth()" />
                @if (isMissing(form.dateOfBirth)) { <small class="field-error">Date of birth is required.</small> }
                @if (!isMissing(form.dateOfBirth) && hasInvalidDateOfBirth()) { <small class="field-error">Date of birth cannot be in the future.</small> }
              </div>
              <div class="form-group">
                <label>Gender <span class="req">*</span></label>
                <select [(ngModel)]="form.gender" class="form-ctrl fc-sel" [class.invalid]="isMissing(form.gender)">
                  <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                </select>
                @if (isMissing(form.gender)) { <small class="field-error">Gender is required.</small> }
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Passport Number @if (passportRequired()) { <span class="req">*</span> }</label>
                <input type="text" [(ngModel)]="form.passportNumber" (ngModelChange)="form.passportNumber = toUpperValue($event)" class="form-ctrl text-uppercase" [class.invalid]="passportRequired() && isMissing(form.passportNumber)" />
                @if (passportRequired() && isMissing(form.passportNumber)) { <small class="field-error">Passport number is required.</small> }
              </div>
              <div class="form-group">
                <label>Nationality <span class="req">*</span></label>
                <select [(ngModel)]="form.nationality" class="form-ctrl fc-sel" [class.invalid]="isMissing(form.nationality)">
                  <option value="" disabled selected>SELECT NATIONALITY</option>
                  @for (nat of nationalities; track nat) {
                    <option [value]="nat">{{ nat }}</option>
                  }
                </select>
                @if (isMissing(form.nationality)) { <small class="field-error">Nationality is required.</small> }
              </div>
            </div>
            <div class="form-group">
              <label>Passport Expiry @if (passportRequired()) { <span class="req">*</span> }</label>
              <input type="date" [(ngModel)]="form.passportExpiry" class="form-ctrl" [class.invalid]="(passportRequired() && isMissing(form.passportExpiry)) || hasInvalidPassportExpiry()" style="max-width:200px" />
              @if (passportRequired() && isMissing(form.passportExpiry)) { <small class="field-error">Passport expiry is required.</small> }
              @if (!isMissing(form.passportExpiry) && hasInvalidPassportExpiry()) { <small class="field-error">Passport expiry must be a future date.</small> }
              @if (!passportRequired()) { <small class="field-hint">Passport details are optional for infants.</small> }
            </div>
          </div>

          <div class="pd-contact-card">
            <h3>Contact Info</h3>
            <div class="form-group">
              <label>Contact Email <span class="req">*</span></label>
              <input type="email" [(ngModel)]="contactEmail" class="form-ctrl" [class.invalid]="isMissing(contactEmail) || hasInvalidEmail()" />
              @if (isMissing(contactEmail)) { <small class="field-error">Contact email is required.</small> }
              @if (!isMissing(contactEmail) && hasInvalidEmail()) { <small class="field-error">Enter a valid email address.</small> }
            </div>
            <div class="form-group">
              <label>Contact Phone <span class="req">*</span></label>
              <input type="tel" [(ngModel)]="contactPhone" class="form-ctrl" [class.invalid]="isMissing(contactPhone) || hasInvalidPhone()" />
              @if (isMissing(contactPhone)) { <small class="field-error">Contact phone is required.</small> }
              @if (!isMissing(contactPhone) && hasInvalidPhone()) { <small class="field-error">Enter a valid 10 digit phone number.</small> }
            </div>
          </div>
        </div>

        @if (error()) { <div class="pd-error">{{ error() }}</div> }

        <button class="next-btn" [disabled]="loading()" (click)="proceed()">
          @if (loading()) { <span class="btn-sp"></span> Processing... }
          @else { Continue to Seat Selection <span class="material-symbols-rounded">arrow_forward</span> }
        </button>
      </div>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .pd-page { flex: 1; padding: 28px 0 56px; background: var(--background); }
    .pd-container { max-width: 900px; margin: 0 auto; padding: 0 24px; }
    .step-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .back-btn { display: flex; align-items: center; gap: 6px; color: var(--primary); font-size: 14px; font-weight: 600; text-decoration: none; }
    .steps { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .step { color: var(--on-surface-muted); font-weight: 600; }
    .step.active { color: var(--primary); font-weight: 700; }
    .step.done { color: var(--success); font-weight: 700; }
    .step-sep { font-size: 16px; color: var(--clr-primary-200); }
    h1 { font-size: 1.4rem; font-weight: 800; color: var(--on-surface); margin-bottom: 20px; }
    .pd-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 20px; }
    .pd-form-card, .pd-contact-card { background: var(--surface); border-radius: 18px; border: 1px solid var(--outline); padding: 24px; box-shadow: var(--glass-shadow); }
    .pd-form-card h3, .pd-contact-card h3 { font-size: 15px; font-weight: 700; color: var(--on-surface); margin: 0 0 18px; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .form-group label { font-size: 13px; font-weight: 600; color: var(--on-surface); }
    .req { color: var(--clr-error); }
    .form-ctrl { width: 100%; height: 46px; padding: 0 14px; border-radius: 11px; border: 1.5px solid var(--outline); background: var(--surface-2); font-size: 14px; font-family: inherit; color: var(--on-surface); outline: none; transition: all 0.18s; }
    .form-ctrl:focus { border-color: var(--primary-light); box-shadow: 0 0 0 4px rgba(96,165,250,0.14); background: var(--surface); }
    .form-ctrl.invalid { border-color: var(--clr-error); background: rgba(239,68,68,0.04); }
    .form-ctrl.invalid:focus { border-color: var(--clr-error); box-shadow: 0 0 0 4px rgba(239,68,68,0.12); }
    .text-uppercase { text-transform: uppercase; }
    .field-error { color: var(--clr-error); font-size: 11.5px; font-weight: 600; }
    .field-hint { color: var(--on-surface-variant); font-size: 11.5px; font-weight: 600; }
    .fc-sel { cursor: pointer; }
    .pd-error { padding: 10px 14px; border-radius: 10px; background: var(--clr-error-bg); color: var(--clr-error); border: 1px solid var(--clr-error); font-size: 13px; margin-bottom: 14px; }
    .next-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 52px; border-radius: 14px; border: none; background: var(--grad-primary); color: white; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 8px 22px rgba(37,99,235,0.24); transition: all 0.2s; }
    .next-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
    .next-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .next-btn .material-symbols-rounded { font-size: 20px; }
    .btn-sp { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 600px) { .form-row-2 { grid-template-columns: 1fr; } .pd-container { padding: 0 12px; } }
  `]
})
export class PassengerDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly passengerService = inject(PassengerService);
  private readonly authService = inject(AuthService);

  flightId = '';
  seatId = '';
  seatNumber = '';
  passengers = 1;
  tripType: TripType = 'ONE_WAY';
  basePrice = 0;
  departureTime = '';

  form: Partial<PassengerCreateRequest> = { title: 'Mr', firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE', passportNumber: '', nationality: '', passportExpiry: '', passengerType: 'ADULT' };
  nationalities = [
    'INDIAN', 'AMERICAN', 'BRITISH', 'CANADIAN', 'AUSTRALIAN', 
    'GERMAN', 'FRENCH', 'JAPANESE', 'CHINESE', 'EMIRATI', 
    'SINGAPOREAN', 'MALAYSIAN', 'RUSSIAN', 'BRAZILIAN', 'OTHER'
  ];
  contactEmail = '';
  contactPhone = '';

  loading = signal(false);
  error = signal('');
  submitted = signal(false);

  ngOnInit(): void {
    this.flightId = this.route.snapshot.paramMap.get('flightId') || '';
    const p = this.route.snapshot.queryParams;
    this.seatId = p['seatId'] || '';
    this.seatNumber = p['seatNumber'] || '';
    this.passengers = parseInt(p['passengers'] || '1');
    this.tripType = p['tripType'] || 'ONE_WAY';
    this.basePrice = parseFloat(p['basePrice'] || '0');
    this.departureTime = p['departureTime'] || '';
    const user = this.authService.currentUser();
    if (user) { this.contactEmail = user.email; }
  }

  proceed(): void {
    this.submitted.set(true);
    if (!this.isFormValid()) {
      this.error.set('Please complete all required passenger and contact details.');
      return;
    }
    this.loading.set(true); this.error.set('');

    const baseFare = this.basePrice > 0 ? this.basePrice * this.passengers : 0;
    const taxes = Math.round(baseFare * 0.12); // 12% taxes
    const totalFare = baseFare + taxes;
    const payload = {
      userId: this.authService.getUserId()!,
      flightId: this.flightId,
      tripType: this.tripType,
      baseFare: baseFare,
      taxes: taxes,
      totalFare: totalFare,
      contactEmail: this.contactEmail.trim(),
      contactPhone: this.contactPhone.trim(),
      departureTime: this.departureTime || new Date().toISOString()
    };

    this.bookingService.createBooking(payload).pipe(catchError(err => { this.loading.set(false); this.error.set(err?.error?.message || 'Failed to create booking.'); return of(null); })).subscribe(booking => {
      if (!booking) return;
      const passengerPayload: PassengerCreateRequest = {
        userId: this.authService.getUserId()!,
        bookingId: booking.bookingId,
        title: this.form.title!,
        firstName: this.form.firstName!,
        lastName: this.form.lastName!,
        dateOfBirth: this.form.dateOfBirth!,
        gender: this.form.gender!,
        passportNumber: this.form.passportNumber!,
        nationality: this.form.nationality!,
        passportExpiry: this.form.passportExpiry!,
        passengerType: this.form.passengerType as any
      };
      this.passengerService.addPassenger(passengerPayload).pipe(catchError(err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Failed to save passenger.');
        return of(null);
      })).subscribe(p => {
        if (!p) return;
        this.loading.set(false);
        this.router.navigate(['/booking/seats', this.flightId], {
          queryParams: {
            bookingId: booking.bookingId,
            passengerId: p.passengerId,
            passengers: this.passengers,
            tripType: this.tripType,
            basePrice: this.basePrice,
            departureTime: this.departureTime
          }
        });
      });
    });
  }

  isMissing(value: unknown): boolean {
    if (!this.submitted()) return false;
    return typeof value !== 'string' || !value.trim();
  }

  hasInvalidEmail(): boolean {
    if (!this.submitted() || !this.contactEmail.trim()) return false;
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.contactEmail.trim());
  }

  hasInvalidPhone(): boolean {
    if (!this.submitted() || !this.contactPhone.trim()) return false;
    return !/^\d{10}$/.test(this.contactPhone.trim());
  }

  hasInvalidDateOfBirth(): boolean {
    if (!this.submitted() || !this.form.dateOfBirth) return false;
    return this.toDateOnly(this.form.dateOfBirth) > this.today();
  }

  hasInvalidPassportExpiry(): boolean {
    if (!this.submitted() || !this.form.passportExpiry?.trim()) return false;
    return this.toDateOnly(this.form.passportExpiry) <= this.today();
  }

  passportRequired(): boolean {
    return this.form.passengerType !== 'INFANT' && this.getAgeYears() >= 2;
  }

  toUpperValue(value: string): string {
    return (value || '').toUpperCase();
  }

  private isFormValid(): boolean {
    const requiredValues: unknown[] = [
      this.form.firstName,
      this.form.lastName,
      this.form.dateOfBirth,
      this.form.gender,
      this.form.nationality,
      this.contactEmail,
      this.contactPhone
    ];

    if (this.passportRequired()) {
      requiredValues.push(this.form.passportNumber, this.form.passportExpiry);
    }

    return requiredValues.every(value => typeof value === 'string' && value.trim())
      && !this.hasInvalidEmail()
      && !this.hasInvalidPhone()
      && !this.hasInvalidDateOfBirth()
      && !this.hasInvalidPassportExpiry();
  }

  private today(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }

  private toDateOnly(value: string): number {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  private getAgeYears(): number {
    if (!this.form.dateOfBirth) return Number.MAX_SAFE_INTEGER;
    const dob = new Date(this.form.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const birthdayPassed = today.getMonth() > dob.getMonth()
      || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!birthdayPassed) age--;
    return age;
  }
}
