import { HttpInterceptorFn, HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, shareReplay, switchMap, throwError, type Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import type { AuthResponse } from '../models';
import { SKIP_AUTH } from './auth-context';
//skip_auth customer contex header hai help to decide that the auth token need to atached or not 
let refreshRequest$: Observable<AuthResponse> | null = null;

function refreshAndRetry(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  const refreshToken = authService.getRefreshToken();


  if (!refreshToken || authService.isTokenExpired(refreshToken)) {
    authService.clearSession();
    router.navigateByUrl('/auth/login');
    return throwError(() => new Error('Session expired'));
  }


  if (!refreshRequest$) {
    refreshRequest$ = authService.refreshToken(refreshToken).pipe(
      shareReplay(1),
      finalize(() => {
        refreshRequest$ = null;
      })
    );
  }

  return refreshRequest$.pipe(
    switchMap(res => {
      const retryReq = req.clone({
        setHeaders: { Authorization: `Bearer ${res.accessToken}` }
      });
      return next(retryReq);
    }),
    catchError((refreshError: HttpErrorResponse) => {
      if (refreshError.status === 0) {
        return throwError(() => refreshError);
      }

      authService.clearSession();
      router.navigateByUrl('/auth/login');
      return throwError(() => refreshError);
    })
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  //don't attach the token with Api request --> SKIP_AUTH
  if (req.context.get(SKIP_AUTH)) {
    return next(req);
  }

  const token = authService.getToken();

  if (token && authService.isTokenExpired(token, 10)) {
    return refreshAndRetry(req, next, authService, router);
  }

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || (error.status === 403 && authService.isTokenExpired(token))) {
        return refreshAndRetry(req, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

// import { HttpInterceptorFn } from '@angular/common/http';

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   const token = localStorage.getItem('token');

//   if (token) {
//     req = req.clone({
//       setHeaders: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//   }

//   return next(req);
// };
