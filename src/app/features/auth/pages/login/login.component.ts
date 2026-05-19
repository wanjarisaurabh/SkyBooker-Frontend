import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest } from '../../../../core/models/index';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;

  loading = signal(false);
  error = signal('');
  success = signal('');

  // Per-field error signals
  emailError = signal('');
  passwordError = signal('');

  // Track if field has been touched
  emailTouched = false;
  passwordTouched = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  validateEmail(): void {
    this.emailTouched = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email.trim()) {
      this.emailError.set('Email is required.');
    } else if (!emailRegex.test(this.email.trim())) {
      this.emailError.set('Please enter a valid email address (e.g. user@example.com).');
    } else {
      this.emailError.set('');
    }
  }

  validatePassword(): void {
    this.passwordTouched = true;
    if (!this.password) {
      this.passwordError.set('Password is required.');
    } else if (this.password.length < 8) {
      this.passwordError.set(`Password must be at least 8 characters (currently ${this.password.length}).`);
    } else {
      this.passwordError.set('');
    }
  }

  login(): void {
    this.error.set('');
    this.success.set('');

    // Trigger all validations
    this.validateEmail();
    this.validatePassword();

    if (this.emailError() || this.passwordError()) {
      return;
    }

    this.loading.set(true);

    const payload: LoginRequest = {
      email: this.email.trim(),
      password: this.password
    };

    this.authService.login(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set('Login successful. Redirecting...');
        setTimeout(() => {
          if (res.role === 'PASSENGER') this.router.navigateByUrl('/passenger/dashboard');
          else if (res.role === 'AIRLINE_STAFF') this.router.navigateByUrl('/staff/dashboard');
          else if (res.role === 'ADMIN') this.router.navigateByUrl('/admin/dashboard');
          else this.router.navigateByUrl('/');
        }, 700);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message || '';
        if (msg.toLowerCase().includes('password')) {
          this.passwordError.set('Incorrect password. Please try again.');
        } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('user')) {
          this.emailError.set('No account found with this email address.');
        } else {
          this.error.set(msg || 'Invalid email or password. Please check your credentials and try again.');
        }
      }
    }); 3
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.authServiceUrl}/oauth2/authorization/google`;
  }

  goToForgotPassword(): void {
    this.router.navigateByUrl('/auth/forgot-password');
  }
}