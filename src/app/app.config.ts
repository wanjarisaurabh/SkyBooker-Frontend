import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ErrorHandler, importProvidersFrom } from '@angular/core';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { GlobalErrorHandler } from './core/error-handler';

// withInterceptors()
// HTTP requests ke beech me custom logic lagata hai.
// Example:
// token add karna
// logging
// error handling



// import { GlobalErrorHandler } from './core/error-handler';
// Whole app ke errors ko centrally handle karega.
// Example:
// API fail
// runtime error
// unexpected crash


// import { authInterceptor } from './core/interceptors/auth.interceptor';
// Ye har API request ke beech me chalega.
// Mostly use hota hai:
// JWT token attach karne ke liye
// Example:
// Authorization: Bearer token


// import { routes } from './app.routes';
// Saare application routes yaha se aa rahe hain.


// [withcomponenetInputBinding ] URL data directly component me aa sakta hai.
//before the app stats 
// import { Component, Input } from '@angular/core';

// @Component({
//   selector: 'app-user',
//   template: `<h1>User ID: {{ id }}</h1>`
// })
// export class UserComponent {
//   @Input() id!: string;
// }

// without [withcomponentInputBinding]
// import { Component } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';

// @Component({
//   selector: 'app-user',
//   template: `<h1>User ID: {{ id }}</h1>`
// })
// export class UserComponent {

//   id!: string;

//   constructor(private route: ActivatedRoute) {}

//   ngOnInit() {
//     this.route.params.subscribe(params => {
//       this.id = params['id'];
//     });
//   }
// }


// router setup , http setup, error handler setup , gloabal service ,interceptors 
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};