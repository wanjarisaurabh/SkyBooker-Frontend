import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


// canactivatefn , route guard - allow or deny access to a route
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigateByUrl('/home');
  return false;
};

export const passengerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isPassenger()) return true;
  if (!auth.isLoggedIn()) { router.navigateByUrl('/home'); return false; }
  router.navigateByUrl('/unauthorized');
  return false;
};

export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isStaff()) return true;
  if (!auth.isLoggedIn()) { router.navigateByUrl('/home'); return false; }
  router.navigateByUrl('/unauthorized');
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isAdmin()) return true;
  if (!auth.isLoggedIn()) { router.navigateByUrl('/home'); return false; }
  router.navigateByUrl('/unauthorized');
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  // Redirect logged-in users away from auth pages
  const role = auth.getRole();
  if (role === 'PASSENGER') router.navigateByUrl('/passenger/dashboard');
  else if (role === 'AIRLINE_STAFF') router.navigateByUrl('/staff/dashboard');
  else if (role === 'ADMIN') router.navigateByUrl('/admin/dashboard');
  else router.navigateByUrl('/');
  return false;
};
