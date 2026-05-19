import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="unauth-page">
      <div class="unauth-card animate-in">
        <div class="icon-box">
          <span class="material-symbols-rounded">lock_person</span>
        </div>
        <h1>Restricted Access</h1>
        <p>This premium area of Skybooker requires specific authorization. Please return to the homepage or sign in with an authorized account.</p>
        <div class="action-btns">
          <a routerLink="/home" class="btn btn-outline">Go Home</a>
          <a routerLink="/auth/login" class="btn btn-primary">Sign In</a>
        </div>
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .unauth-page { 
      min-height: calc(100vh - 72px); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      background: var(--grad-hero); 
      padding: 40px 24px; 
    }
    .unauth-card { 
      text-align: center; 
      background: white; 
      padding: 60px 40px; 
      border-radius: var(--radius-xl); 
      box-shadow: 0 40px 100px rgba(0,0,0,0.08); 
      max-width: 500px; 
      border: 1px solid var(--clr-neutral-100); 
    }
    .icon-box {
      width: 80px;
      height: 80px;
      background: var(--clr-error-bg);
      color: var(--clr-error);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon-box .material-symbols-rounded { font-size: 40px; }
    h1 { font-size: 2rem; font-weight: 800; color: var(--clr-neutral-900); margin-bottom: 12px; }
    p { font-size: 1rem; color: var(--clr-neutral-500); margin-bottom: 32px; line-height: 1.6; }
    .action-btns { display: flex; gap: 12px; justify-content: center; }
  `]
})
export class UnauthorizedComponent {}
