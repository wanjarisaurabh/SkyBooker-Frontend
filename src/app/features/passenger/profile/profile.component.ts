import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { ProfileResponse, ProfileUpdateRequest, ChangePasswordRequest } from '../../../core/models/index';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="profile-page">
      <div class="profile-container">
        <h1 class="profile-title">
          <span class="material-symbols-rounded mat-icon-filled">person</span>
          My Profile
        </h1>

        @if (loading()) { <div class="p-loading"><div class="spinner"></div></div> }

        @if (!loading() && profile()) {
          <div class="profile-grid">
            <!-- Avatar Card -->
            <div class="avatar-card">
              <div class="profile-avatar">{{ profile()!.fullName.charAt(0).toUpperCase() }}</div>
              <h2 class="profile-name">{{ profile()!.fullName }}</h2>
              <span class="profile-email">{{ profile()!.email }}</span>
              <span class="profile-role-badge">{{ profile()!.role.replace('_', ' ') }}</span>
              <span class="provider-badge">via {{ profile()!.provider }}</span>
            </div>

            <!-- Edit Form -->
            <div class="edit-card">
              <h3>Edit Profile</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" [ngModel]="editForm.fullName" (ngModelChange)="editForm.fullName = ($event || '').toUpperCase()" class="form-ctrl upper-input" />
                </div>
                <div class="form-group">
                  <label>Phone</label>
                  <input type="tel" [(ngModel)]="editForm.phone" class="form-ctrl" />
                </div>
                <div class="form-group">
                  <label>Passport Number</label>
                  <input type="text" [ngModel]="editForm.passportNumber" (ngModelChange)="editForm.passportNumber = ($event || '').toUpperCase()" class="form-ctrl upper-input" />
                </div>
                <div class="form-group">
                  <label>Nationality</label>
                  <input type="text" [ngModel]="editForm.nationality" (ngModelChange)="editForm.nationality = ($event || '').toUpperCase()" class="form-ctrl upper-input" />
                </div>
              </div>
              @if (profileSuccess()) { <div class="alert-success"><span class="material-symbols-rounded">check_circle</span> {{ profileSuccess() }}</div> }
              @if (profileError()) { <div class="alert-error">{{ profileError() }}</div> }
              <button class="save-btn" [disabled]="profileLoading()" (click)="saveProfile()">
                @if (profileLoading()) { <span class="btn-spinner"></span> Saving... }
                @else { <span class="material-symbols-rounded">save</span> Save Changes }
              </button>
            </div>

            <!-- Change Password -->
            <div class="password-card">
              <h3>Change Password</h3>
              <div class="form-group"><label>Current Password</label><input type="password" [(ngModel)]="pwForm.oldPassword" class="form-ctrl" /></div>
              <div class="form-group"><label>New Password</label><input type="password" [(ngModel)]="pwForm.newPassword" class="form-ctrl" /></div>
              <div class="form-group"><label>Confirm New Password</label><input type="password" [(ngModel)]="confirmNewPassword" class="form-ctrl" /></div>
              @if (pwSuccess()) { <div class="alert-success"><span class="material-symbols-rounded">check_circle</span> {{ pwSuccess() }}</div> }
              @if (pwError()) { <div class="alert-error">{{ pwError() }}</div> }
              <button class="save-btn" [disabled]="pwLoading()" (click)="changePassword()">
                @if (pwLoading()) { <span class="btn-spinner"></span> Updating... }
                @else { <span class="material-symbols-rounded">lock_reset</span> Update Password }
              </button>
            </div>
          </div>
        }
      </div>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    :host { 
      display: flex; 
      flex-direction: column; 
      min-height: 100vh; 
    }
    .profile-page { 
      flex: 1; 
      padding: 16px 0 32px; 
      background: var(--background); 
    }
    .profile-container { 
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 0 24px; 
    }
    .profile-title { 
      display: flex; 
      align-items: center; 
      gap: 10px; 
      font-size: 1.35rem; 
      font-weight: 900; 
      color: var(--on-surface); 
      margin-bottom: 20px; 
      letter-spacing: -0.02em;
    }
    .profile-title .material-symbols-rounded { 
      font-size: 28px; 
      color: var(--primary); 
    }
    .profile-grid { 
      display: grid; 
      grid-template-columns: 300px 1fr; 
      gap: 20px; 
      grid-template-rows: auto auto; 
      align-items: start; 
    }
    .avatar-card { 
      background: var(--surface); 
      border-radius: 18px; 
      border: 1px solid var(--outline); 
      padding: 24px 20px; 
      text-align: center; 
      box-shadow: var(--glass-shadow); 
      grid-row: 1 / 3; 
    }
    .profile-avatar { 
      width: 64px; 
      height: 64px; 
      border-radius: 50%; 
      background: var(--grad-primary); 
      color: white; 
      font-size: 24px; 
      font-weight: 800; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      margin: 0 auto 12px; 
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2);
    }
    .profile-name { 
      font-size: 1.2rem; 
      font-weight: 800; 
      color: var(--on-surface); 
      margin: 0 0 6px; 
    }
    .profile-email { 
      display: block; 
      font-size: 14px; 
      color: var(--on-surface-variant); 
      margin-bottom: 16px; 
    }
    .profile-role-badge { 
      display: inline-block; 
      padding: 5px 14px; 
      border-radius: 999px; 
      background: var(--clr-primary-50); 
      color: var(--primary); 
      font-size: 11px; 
      font-weight: 700; 
      text-transform: uppercase; 
      margin-bottom: 8px; 
    }
    .provider-badge { 
      display: block; 
      font-size: 12px; 
      color: var(--on-surface-muted); 
      margin-top: 8px; 
      font-weight: 600;
    }
    .edit-card, .password-card { 
      background: var(--surface); 
      border-radius: 18px; 
      border: 1px solid var(--outline); 
      padding: 20px; 
      box-shadow: var(--glass-shadow); 
    }
    .edit-card h3, .password-card h3 { 
      font-size: 1rem; 
      font-weight: 800; 
      color: var(--on-surface); 
      margin: 0 0 16px; 
    }
    .form-row { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 16px; 
      margin-bottom: 20px; 
    }
    .form-group { 
      display: flex; 
      flex-direction: column; 
      gap: 8px; 
    }
    .form-group label { 
      font-size: 13px; 
      font-weight: 700; 
      color: var(--on-surface-variant); 
    }
    .form-ctrl { 
      height: 44px; 
      padding: 0 14px; 
      border-radius: 10px; 
      border: 1px solid var(--outline); 
      background: var(--surface-2); 
      font-size: 0.95rem; 
      font-family: inherit; 
      color: var(--on-surface); 
      outline: none; 
      transition: all 0.2s; 
    }
    .form-ctrl:focus { 
      border-color: var(--primary); 
      background: var(--surface);
      box-shadow: 0 0 0 4px var(--clr-primary-100); 
    }
    .upper-input { text-transform: uppercase !important; }
    .alert-success { 
      display: flex; 
      align-items: center; 
      gap: 10px; 
      padding: 12px 16px; 
      border-radius: 12px; 
      background: var(--clr-success-bg); 
      color: var(--success); 
      border: 1px solid rgba(16, 185, 129, 0.2); 
      font-size: 13.5px; 
      margin-bottom: 16px; 
      font-weight: 600;
    }
    .alert-success .material-symbols-rounded { font-size: 20px; }
    .alert-error { 
      padding: 12px 16px; 
      border-radius: 12px; 
      background: var(--clr-error-bg); 
      color: var(--clr-error); 
      border: 1px solid rgba(244, 63, 94, 0.15); 
      font-size: 13.5px; 
      margin-bottom: 16px; 
      font-weight: 600;
    }
    .save-btn { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      gap: 8px; 
      padding: 12px 24px; 
      border-radius: 12px; 
      border: none; 
      background: var(--grad-primary); 
      color: white; 
      font-size: 14px; 
      font-weight: 700; 
      cursor: pointer; 
      font-family: inherit; 
      box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2); 
      transition: all 0.2s; 
    }
    .save-btn:hover:not(:disabled) { 
      transform: translateY(-1px); 
      filter: brightness(1.1);
      box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
    }
    .save-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .save-btn .material-symbols-rounded { font-size: 20px; }
    .btn-spinner { 
      width: 18px; 
      height: 18px; 
      border: 2px solid rgba(255,255,255,0.4); 
      border-top-color: white; 
      border-radius: 50%; 
      animation: spin 0.7s linear infinite; 
    }
    .p-loading { display: flex; justify-content: center; padding: 60px; }
    .spinner { 
      width: 40px; 
      height: 40px; 
      border: 3px solid var(--outline); 
      border-top-color: var(--primary); 
      border-radius: 50%; 
      animation: spin 0.75s linear infinite; 
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 900px) { .profile-grid { grid-template-columns: 1fr; } .avatar-card { grid-row: auto; } }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } .profile-container { padding: 0 12px; } }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  profile = signal<ProfileResponse | null>(null);
  loading = signal(true);
  editForm: ProfileUpdateRequest = { fullName: '', phone: '', passportNumber: '', nationality: '' };
  pwForm: ChangePasswordRequest = { oldPassword: '', newPassword: '' };
  confirmNewPassword = '';
  profileLoading = signal(false); profileSuccess = signal(''); profileError = signal('');
  pwLoading = signal(false); pwSuccess = signal(''); pwError = signal('');

  ngOnInit(): void {
    this.authService.getProfile().pipe(catchError(() => of(null))).subscribe(p => {
      this.profile.set(p);
      if (p) { this.editForm = { fullName: p.fullName, phone: p.phone, passportNumber: p.passportNumber, nationality: p.nationality }; }
      this.loading.set(false);
    });
  }

  saveProfile(): void {
    this.profileLoading.set(true); this.profileError.set(''); this.profileSuccess.set('');
    
    // Ensure uppercase with null checks
    const updatePayload: ProfileUpdateRequest = {
      fullName: (this.editForm.fullName || '').trim().toUpperCase(),
      phone: (this.editForm.phone || '').trim(),
      passportNumber: (this.editForm.passportNumber || '').trim().toUpperCase(),
      nationality: (this.editForm.nationality || '').trim().toUpperCase()
    };

    this.authService.updateProfile(updatePayload).pipe(catchError(err => { 
      this.profileLoading.set(false); 
      this.profileError.set(err?.error?.message || 'Failed to update.'); 
      return of(null); 
    })).subscribe(p => {
      if (p) { 
        this.profile.set(p); 
        this.profileLoading.set(false); 
        this.profileSuccess.set('Profile updated successfully!'); 
        setTimeout(() => this.profileSuccess.set(''), 3000); 
      }
    });
  }

  changePassword(): void {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    if (!this.pwForm.oldPassword || !this.pwForm.newPassword) { 
      this.pwError.set('All password fields are required.'); 
      return; 
    }
    if (this.pwForm.newPassword.length < 8) {
      this.pwError.set('New password must be at least 8 characters.');
      return;
    }
    if (!passwordRegex.test(this.pwForm.newPassword)) {
      this.pwError.set('New password must include uppercase, lowercase, a number, and a special character.');
      return;
    }
    if (this.pwForm.newPassword !== this.confirmNewPassword) { 
      this.pwError.set('New passwords do not match.'); 
      return; 
    }
    
    this.pwLoading.set(true); this.pwError.set(''); this.pwSuccess.set('');
    this.authService.changePassword(this.pwForm).pipe(catchError(err => { 
      this.pwLoading.set(false); 
      this.pwError.set(err?.error?.message || 'Failed to change password.'); 
      return of(null); 
    })).subscribe(r => {
      if (r) { 
        this.pwLoading.set(false); 
        this.pwSuccess.set('Password updated successfully!'); 
        this.pwForm = { oldPassword: '', newPassword: '' }; 
        this.confirmNewPassword = ''; 
        setTimeout(() => this.pwSuccess.set(''), 3000); 
      }
    });
  }
}
