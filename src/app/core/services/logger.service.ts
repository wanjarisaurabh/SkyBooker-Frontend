import { Injectable, isDevMode } from '@angular/core';


//isdevmode is use to check, is it in production or dev mode  
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  log(message: string, ...args: any[]): void {
    if (isDevMode()) {
      console.log(`[LOG]: ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (isDevMode()) {
      console.warn(`[WARN]: ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    // In production, you might want to send this to a service like Sentry
    console.error(`[ERROR]: ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    if (isDevMode()) {
      console.info(`[INFO]: ${message}`, ...args);
    }
  }
}
