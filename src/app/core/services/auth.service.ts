import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SKIP_AUTH } from '../interceptors/auth-context';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ProfileResponse,
  ProfileUpdateRequest,
  ChangePasswordRequest,
  UserSummaryResponse,
  Role
} from '../models/index';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.authServiceUrl}/api/v1/auth`;

  // Reactive current user signal
  currentUser = signal<AuthResponse | null>(this.loadStoredUser());

  constructor() {
    // Rehydrate a stale/partial session after hard refreshes.
    if (this.getToken() && !this.currentUser()) {
      this.getProfile().subscribe({
        next: (profile) => {
          const fallbackToken = this.getToken() || '';
          const fallbackRefresh = this.getRefreshToken() || '';
          this.saveSession({
            userId: profile.userId,
            fullName: profile.fullName,
            email: profile.email,
            role: profile.role,
            provider: profile.provider,
            accessToken: fallbackToken,
            refreshToken: fallbackRefresh,
            tokenType: 'Bearer',
            expiresIn: 0,
            message: 'Session restored'
          });
        },
        error: () => {
          this.clearSession();
        }
      });
    }
  }

  private loadStoredUser(): AuthResponse | null {
    try {
      const stored = localStorage.getItem('aerolux_user');
      if (stored) return JSON.parse(stored);

      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const role = localStorage.getItem('userRole') as Role | null;
      const userId = localStorage.getItem('userId') || '';
      const fullName = localStorage.getItem('userFullName') || '';
      const email = localStorage.getItem('userEmail') || '';

      if (!accessToken || !role) return null;

      return {
        userId,
        fullName,
        email,
        role,
        provider: 'LOCAL',
        accessToken,
        refreshToken: refreshToken || '',
        tokenType: 'Bearer',
        expiresIn: 0,
        message: 'Session restored'
      };
    } catch {
      return null;
    }
  }

  // --- Auth ---

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap(res => this.saveSession(res))
    );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload).pipe(
      tap(res => {
        if (res.accessToken && res.refreshToken) {
          this.saveSession(res);
        }
      })
    );
  }

  logout(): void {
    this.http.post(`${this.baseUrl}/logout`, {}).subscribe({ error: () => { } });
    this.clearSession();
    this.router.navigateByUrl('/auth/login');
  }

  refreshToken(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/refresh`,
      { refreshToken: token },
      { context: new HttpContext().set(SKIP_AUTH, true) }
    ).pipe(
      tap(res => this.saveSession(res))
    );
  }

  // --- Profile ---

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.baseUrl}/me`);
  }

  updateProfile(payload: ProfileUpdateRequest): Observable<ProfileResponse> {
    return this.http.patch<ProfileResponse>(`${this.baseUrl}/me`, payload);
  }

  changePassword(payload: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/me/change-password`, payload);
  }

  deactivateAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/me`);
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/forgot-password`, { email });
  }

  verifyOtp(email: string, otp: string): Observable<{ message: string; token: string }> {
    return this.http.post<{ message: string; token: string }>(`${this.baseUrl}/verify-otp`, { email, otp });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, { token, newPassword });
  }

  // --- Admin ---

  getAllUsers(): Observable<UserSummaryResponse[]> {
    return this.http.get<UserSummaryResponse[]>(`${this.baseUrl}/admin/users`);
  }

  getUsersByRole(role: Role): Observable<UserSummaryResponse[]> {
    return this.http.get<UserSummaryResponse[]>(`${this.baseUrl}/admin/users/role/${role}`);
  }

  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/admin/users/${userId}`);
  }

  // --- Session Helpers ---

  saveSession(res: AuthResponse): void {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('userRole', res.role);
    localStorage.setItem('userId', res.userId || '');
    localStorage.setItem('userFullName', res.fullName || '');
    localStorage.setItem('userEmail', res.email || '');
    localStorage.setItem('aerolux_user', JSON.stringify(res));
    this.currentUser.set(res);
  }

  clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('aerolux_user');
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isTokenExpired(token: string | null, skewSeconds = 0): boolean {
    const expiresAt = this.getTokenExpiration(token);
    if (!expiresAt) return true;
    return expiresAt <= Date.now() + skewSeconds * 1000;
  }

  //   skewSeconds = 0
  // Extra buffer time.
  // Default value 0 hai.
  // Mostly token ko thoda pehle expired treat karne ke liye. 
  //min 5 sec 

  //Agar expiry time nahi mila:
  // token invalid ho sakta hai
  // token null ho sakta hai
  // token broken ho sakta hai

  private getTokenExpiration(token: string | null): number | null {
    if (!token) return null;

    try {
      const payloadPart = token.split('.')[1];
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const payload = JSON.parse(atob(paddedBase64));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getRole();
  }

  getRole(): Role | null {
    return this.currentUser()?.role ?? (localStorage.getItem('userRole') as Role | null);
  }

  getUserId(): string | null {
    return this.currentUser()?.userId || localStorage.getItem('userId');
  }

  isPassenger(): boolean {
    return this.getRole() === 'PASSENGER';
  }

  isStaff(): boolean {
    return this.getRole() === 'AIRLINE_STAFF';
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }
}
