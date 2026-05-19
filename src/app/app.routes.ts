import { Routes } from '@angular/router';
import { authGuard, passengerGuard, staffGuard, adminGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Public home
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },

  // Auth routes (guest only — redirect logged-in users)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent),
        canActivate: [guestGuard]
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent),
        canActivate: [guestGuard]
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // OAuth callback
  {
    path: 'oauth-success',
    loadComponent: () => import('./features/auth/pages/oauth-success/oauth-success.component').then(m => m.OAuthSuccessComponent)
  },

  // Legacy routes (redirect to new paths)
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: 'auth/register', pathMatch: 'full' },

  // Flight search (public)
  {
    path: 'flights',
    children: [
      {
        path: 'search',
        loadComponent: () => import('./features/flights/flight-search/flight-search.component').then(m => m.FlightSearchComponent)
      },
      {
        path: 'select/:flightId',
        loadComponent: () => import('./features/flights/flight-selection/flight-selection.component').then(m => m.FlightSelectionComponent)
      }
    ]
  },

  // Passenger routes
  {
    path: 'passenger',
    canActivate: [passengerGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/passenger/dashboard/passenger-dashboard.component').then(m => m.PassengerDashboardComponent)
      },
      {
        path: 'my-bookings',
        loadComponent: () => import('./features/passenger/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent)
      },
      {
        path: 'my-bookings/:id',
        loadComponent: () => import('./features/passenger/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/passenger/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/passenger/profile/profile.component').then(m => m.ProfileComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Booking flow (passenger only)
  {
    path: 'booking',
    canActivate: [passengerGuard],
    children: [
      {
        path: 'seats/:flightId',
        loadComponent: () => import('./features/booking/seat-selection/seat-selection.component').then(m => m.SeatSelectionComponent)
      },
      {
        path: 'passengers/:flightId',
        loadComponent: () => import('./features/booking/passenger-details/passenger-details.component').then(m => m.PassengerDetailsComponent)
      },
      {
        path: 'addons/:bookingId',
        loadComponent: () => import('./features/booking/add-ons/add-ons.component').then(m => m.AddOnsComponent)
      },
      {
        path: 'summary/:bookingId',
        loadComponent: () => import('./features/booking/summary/booking-summary.component').then(m => m.BookingSummaryComponent)
      },
      {
        path: 'payment/:bookingId',
        loadComponent: () => import('./features/booking/payment/payment.component').then(m => m.PaymentComponent)
      },
      {
        path: 'confirmation/:bookingId',
        loadComponent: () => import('./features/booking/confirmation/confirmation.component').then(m => m.ConfirmationComponent)
      }
    ]
  },

  // Airline Staff routes
  {
    path: 'staff',
    canActivate: [staffGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/staff/dashboard/staff-dashboard.component').then(m => m.StaffDashboardComponent)
      },
      {
        path: 'flights',
        loadComponent: () => import('./features/staff/dashboard/staff-dashboard.component').then(m => m.StaffDashboardComponent)
      },
      {
        path: 'seat-config/:flightId',
        loadComponent: () => import('./features/staff/seat-config/seat-config.component').then(m => m.SeatConfigComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/passenger/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'airlines',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'revenue',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/passenger/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Error pages
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  // Wildcard
  { path: '**', redirectTo: 'home' }
];
