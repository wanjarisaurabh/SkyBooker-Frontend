import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest, Role } from '../../../../core/models/index';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Backend-aligned fields
  fullName = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  role: Role = 'PASSENGER';
  passportNumber = '';
  nationality = '';
  acceptTerms = false;

  nationalities = [
    'INDIAN', 'AMERICAN', 'BRITISH', 'CANADIAN', 'AUSTRALIAN', 
    'GERMAN', 'FRENCH', 'JAPANESE', 'CHINESE', 'EMIRATI', 
    'SINGAPOREAN', 'MALAYSIAN', 'RUSSIAN', 'BRAZILIAN', 'OTHER'
  ];

  showPassword = false;
  showConfirmPassword = false;

  loading = signal(false);
  error = signal('');
  success = signal('');

  // Per-field errors
  fullNameError = signal('');
  emailError = signal('');
  phoneError = signal('');
  passwordError = signal('');
  confirmPasswordError = signal('');
  passportNumberError = signal('');
  nationalityError = signal('');
  termsError = signal('');

  // Touched tracking
  fullNameTouched = false;
  emailTouched = false;
  phoneTouched = false;
  passwordTouched = false;
  confirmPasswordTouched = false;
  passportNumberTouched = false;
  nationalityTouched = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  validateFullName(): void {
    this.fullNameTouched = true;
    if (!this.fullName.trim()) {
      this.fullNameError.set('Full name is required.');
    } else if (this.fullName.trim().length < 2) {
      this.fullNameError.set('Full name must be at least 2 characters.');
    } else {
      this.fullNameError.set('');
    }
  }

  validateEmail(): void {
    this.emailTouched = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email.trim()) {
      this.emailError.set('Email address is required.');
    } else if (!emailRegex.test(this.email.trim())) {
      this.emailError.set('Please enter a valid email address (e.g. user@example.com).');
    } else {
      this.emailError.set('');
    }
  }

  validatePhone(): void {
    this.phoneTouched = true;
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!this.phone.trim()) {
      this.phoneError.set('Phone number is required.');
    } else if (!phoneRegex.test(this.phone.trim())) {
      if (this.phone.trim().length < 10) {
        this.phoneError.set(`Phone number is too short (${this.phone.trim().length} digits). Must be 10–15 digits.`);
      } else if (this.phone.trim().length > 15) {
        this.phoneError.set(`Phone number is too long (${this.phone.trim().length} digits). Must be 10–15 digits.`);
      } else {
        this.phoneError.set('Phone number must contain only digits (no spaces or dashes).');
      }
    } else {
      this.phoneError.set('');
    }
  }

  validatePassword(): void {
    this.passwordTouched = true;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    
    if (!this.password) {
      this.passwordError.set('Password is required.');
    } else if (this.password.length < 8) {
      this.passwordError.set(`Password is too short (${this.password.length} characters). Minimum 8 required.`);
    } else if (!passwordRegex.test(this.password)) {
      this.passwordError.set('Password must include uppercase, lowercase, a number, and a special character (@$!%*?&#).');
    } else {
      this.passwordError.set('');
    }
    // Re-validate confirm if touched
    if (this.confirmPasswordTouched) {
      this.validateConfirmPassword();
    }
  }

  validateConfirmPassword(): void {
    this.confirmPasswordTouched = true;
    if (!this.confirmPassword) {
      this.confirmPasswordError.set('Please confirm your password.');
    } else if (this.confirmPassword !== this.password) {
      this.confirmPasswordError.set('Passwords do not match. Please retype your password.');
    } else {
      this.confirmPasswordError.set('');
    }
  }

  validatePassportNumber(): void {
    this.passportNumberTouched = true;
    const passportRegex = /^[A-PR-WYZ0-9][0-9]{6,12}$/i; // Basic regex for many passports, but maybe just alphanumeric is safer
    const alphaNumericRegex = /^[A-Z0-9]{6,15}$/i;
    
    if (!this.passportNumber.trim()) {
      this.passportNumberError.set('Passport number is required for registration.');
    } else if (!alphaNumericRegex.test(this.passportNumber.trim())) {
      this.passportNumberError.set('Invalid passport format. Use 6-15 alphanumeric characters.');
    } else {
      this.passportNumberError.set('');
    }
  }

  validateNationality(): void {
    this.nationalityTouched = true;
    if (!this.nationality.trim()) {
      this.nationalityError.set('Nationality is required.');
    } else if (this.nationality.trim().length < 2) {
      this.nationalityError.set('Nationality must be at least 2 characters.');
    } else {
      this.nationalityError.set('');
    }
  }

  get isFormInvalid(): boolean {
    return (
      !this.fullName.trim() ||
      !this.email.trim() ||
      !this.phone.trim() ||
      !this.nationality.trim() ||
      !this.passportNumber.trim() ||
      !this.password.trim() ||
      !this.confirmPassword.trim() ||
      !this.acceptTerms
    );
  }

  register(): void {
    this.error.set('');
    this.success.set('');

    // Trigger all field validations
    this.validateFullName();
    this.validateEmail();
    this.validatePhone();
    this.validatePassword();
    this.validateConfirmPassword();
    this.validatePassportNumber();
    this.validateNationality();

    if (!this.acceptTerms) {
      this.termsError.set('You must accept the Terms & Conditions to proceed.');
    } else {
      this.termsError.set('');
    }

    if (
      this.fullNameError() || this.emailError() || this.phoneError() ||
      this.passwordError() || this.confirmPasswordError() || this.termsError() ||
      this.passportNumberError() || this.nationalityError()
    ) {
      return;
    }

    this.loading.set(true);

    const payload: RegisterRequest = {
      fullName: this.fullName.trim().toUpperCase(),
      email: this.email.trim().toLowerCase(),
      password: this.password,
      phone: this.phone.trim(),
      role: this.role,
      passportNumber: this.passportNumber.trim().toUpperCase() || undefined,
      nationality: this.nationality.trim().toUpperCase() || undefined
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set('Account created! Please login.');
        setTimeout(() => {
          this.router.navigateByUrl('/auth/login');
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message || '';
        if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('exist')) {
          this.emailError.set('An account with this email already exists. Try logging in instead.');
        } else if (msg.toLowerCase().includes('phone')) {
          this.phoneError.set('This phone number is already registered.');
        } else {
          this.error.set(msg || 'Registration failed. Please check your details and try again.');
        }
      }
    });
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.authServiceUrl}/oauth2/authorization/google`;
  }
}