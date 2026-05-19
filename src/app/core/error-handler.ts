import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LoggerService } from './services/logger.service';

// App me kahin bhi unhandled error aaye, ye class usko catch karegi, identify
//  karegi, log karegi, aur user notification/show UI updates handle kar sakti hai.

// Angular change detection control karne ke liye.
// Angular automatically UI update karta hai when data changes.
// NgZone helps:
// Angular ke andar code run karna
// Angular ke bahar heavy code run karna

// /ErrorHandler
// Use
// Global error handling ke liye.
// Angular app me agar kahin unhandled error aaye:
// component
// service
// API
// async code
// to ErrorHandler usko catch kar sakta hai.


//injector , to take the dependecy manually at run time x
//Injector use kiya because:
// circular dependency issues avoid hote hain
// safer for global handlers
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector, private zone: NgZone) { }

  handleError(error: any): void {
    const logger = this.injector.get(LoggerService);
    const message = error.message ? error.message : error.toString();

    // Check if it's an HTTP error
    if (error instanceof HttpErrorResponse) {
      // Server-side error
      logger.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    } else {
      // Client-side error
      logger.error(`An error occurred: ${message}`);
    }

    // You can also add logic here to show a toast message to the user
    // This must be run inside NgZone to ensure change detection works if using a UI component
    this.zone.run(() => {
      // Example: this.toastService.showError('Something went wrong!');
    });
  }
}

// What is NgZone in Angular?

// NgZone Angular ka mechanism hai jo detect karta hai:

// “Kab application state/data change hui hai aur UI ko kab update karna hai.”



// How NgZone Works
// Because Angular runs code inside something called:
// Zone.js
// Sometimes code Angular zone ke bahar execute hota hai.
// Then Angular cannot detect changes.
// Example:
// third-party libraries
// native JS callbacks
// external SDKs
// websocket/manual listeners
