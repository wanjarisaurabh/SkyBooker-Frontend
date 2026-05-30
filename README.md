<img width="738" height="1600" alt="WhatsApp Image 2026-05-30 at 7 57 28 AM" src="https://github.com/user-attachments/assets/f0a52733-0cce-4f94-98bb-385aa0fa2703" /># SkyBooker Frontend

SkyBooker Frontend is an Angular web application for searching flights, booking airline tickets, selecting seats, making payments, and managing user dashboards for passengers, airline staff, and admins.

## Features

- Public home page and flight search
- Login, registration, forgot password, and OAuth callback pages
- JWT based authentication flow
- Three role based experiences: Passenger, Airline Staff, and Admin
- Route guards for passenger, staff, admin, guest, and protected pages
- Passenger dashboard, profile, notifications, and booking history
- Booking flow with flight selection, seat selection, passenger details, add-ons, summary, payment, and confirmation
- Airline staff dashboard and seat configuration
- Admin dashboard for airline, user, revenue, and notification views
- Razorpay checkout configuration
- Global error handling and logging service
- Lazy-loaded Angular routes
- Production environment generation script
- Vercel deployment configuration

## Tech Stack

- Angular 19
- TypeScript
- RxJS
- Angular Router
- Angular Material/CDK
- HTML5 and CSS3
- Razorpay
- Vercel

## User Roles

SkyBooker has three main frontend roles. Each role sees a different dashboard and a different set of allowed actions.

| Role          | Example User | Frontend Behavior                                                                                           |
| ------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| Passenger     | Aviral       | Searches flights, selects seats, completes bookings, makes payments, views trips, and checks notifications. |
| Airline Staff | Ankit        | Manages flight operations, schedule view, manifests, seat configuration, and operational flight status.     |
| Admin         | Prem         | Manages platform overview, airlines, airports, users, bookings, revenue, and broadcast notifications.       |

## Project Structure

```text
airline-frontend/
+-- public/
+-- docs/
|   +-- screenshots/
+-- scripts/
|   +-- set-env.js
+-- src/
|   +-- app/
|   |   +-- core/
|   |   |   +-- guards/
|   |   |   +-- interceptors/
|   |   |   +-- models/
|   |   |   +-- services/
|   |   +-- features/
|   |   |   +-- admin/
|   |   |   +-- auth/
|   |   |   +-- booking/
|   |   |   +-- flights/
|   |   |   +-- home/
|   |   |   +-- passenger/
|   |   |   +-- staff/
|   |   +-- shared/
|   +-- environments/
|   +-- index.html
|   +-- main.ts
|   +-- styles.css
+-- angular.json
+-- package.json
+-- vercel.json
```

## Prerequisites

- Node.js 20 or later
- npm
- Angular CLI
- SkyBooker backend running locally, with the API Gateway on `http://localhost:8080`

## Local Setup

1. Clone the repository and move into the frontend folder:

```bash
cd airline-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The app runs at:

```text
http://localhost:4200
```

## Environment Configuration

Development values are stored in:

```text
src/environments/environment.ts
```

Default local configuration:

```text
apiUrl: http://localhost:8080
authServiceUrl: http://localhost:8081
```

For production builds, `scripts/set-env.js` generates `src/environments/environment.prod.ts` using these environment variables:

```text
API_URL
AUTH_SERVICE_URL
RAZORPAY_KEY_ID
```

## Available Scripts

```bash
npm start
```

Starts the Angular development server.

```bash
npm run build
```

Generates a production build.

```bash
npm test
```

Runs unit tests.

```bash
npm run test:coverage
```

Runs unit tests with coverage.

## Main Routes

```text
/home
/auth/login
/auth/register
/auth/forgot-password
/oauth-success
/flights/search
/flights/select/:flightId
/passenger/dashboard
/passenger/my-bookings
/passenger/notifications
/passenger/profile
/booking/seats/:flightId
/booking/passengers/:flightId
/booking/addons/:bookingId
/booking/summary/:bookingId
/booking/payment/:bookingId
/booking/confirmation/:bookingId
/staff/dashboard
/staff/seat-config/:flightId
/admin/dashboard
/unauthorized
```

## Screenshots

### Public Pages

Home page:

<img width="1842" height="1066" alt="Screenshot 2026-05-29 112008" src="https://github.com/user-attachments/assets/13b38fc7-e2e9-46c7-a1ed-9decf369a1f1" />


Login page:


<img width="1873" height="1063" alt="Screenshot 2026-05-29 112023" src="https://github.com/user-attachments/assets/7d490d81-f0c6-446b-8e2e-7d16a8f162b8" />


Registration page:


<img width="1863" height="1059" alt="Screenshot 2026-05-29 112050" src="https://github.com/user-attachments/assets/511b863b-97c9-4503-aad7-84fcb9186f0b" />

### Passenger Role: Aviral

Passenger users can search flights, select a flight, choose a seat, complete payment, view bookings, and receive notifications.


Selected flight:

<img width="1865" height="1063" alt="Screenshot 2026-05-29 112430" src="https://github.com/user-attachments/assets/b584b24d-1ca7-4250-8a03-953c773fee98" />



Seat selection:

<img width="1847" height="1060" alt="Screenshot 2026-05-29 112521" src="https://github.com/user-attachments/assets/ccb0f7e9-4fe5-483f-a919-d2c47c656bd6" />




Booking confirmation:

<img width="1858" height="1066" alt="Screenshot 2026-05-29 112617" src="https://github.com/user-attachments/assets/b5a0233b-fe8e-4868-b56b-c0ea8c4a33d4" />



My bookings:

<img width="1834" height="1014" alt="Screenshot 2026-05-29 112635" src="https://github.com/user-attachments/assets/5eefb193-60a1-40d8-abba-1d86dcd9ea8e" />

Notifications:

<img width="1850" height="1071" alt="Screenshot 2026-05-29 112624" src="https://github.com/user-attachments/assets/612556e1-25d3-4ce2-84bf-c13822b5cc8a" />

### Staff Role: Ankit

Staff users manage airline operations, including schedules, passenger manifests, and seat-related flight actions.

Staff dashboard:

<img width="1848" height="1064" alt="Screenshot 2026-05-29 112250" src="https://github.com/user-attachments/assets/02e7202f-e56a-47c4-8fa2-ee24036d2100" />

### Admin Role: Prem

Admin users manage the full platform and can monitor revenue, airlines, airports, users, bookings, and broadcast messages.

Admin overview:

<img width="1852" height="1063" alt="Screenshot 2026-05-29 112649" src="https://github.com/user-attachments/assets/9757d4a7-849d-4f35-a71a-75461cdd604e" />

Admin broadcast:

<img width="1846" height="1058" alt="Screenshot 2026-05-29 112713" src="https://github.com/user-attachments/assets/39bfe731-4cd8-4c79-945d-5f45468e71f5" />

Email:

<img width="738" height="1600" alt="WhatsApp Image 2026-05-30 at 7 57 28 AM" src="https://github.com/user-attachments/assets/7af93745-a870-4e27-a9e3-79dcb7258ba2" />

## Backend Integration

The frontend communicates with the backend through the API Gateway:

```text
http://localhost:8080
```

Backend API areas used by the app:

```text
/api/v1/auth
/api/v1/airlines
/api/v1/airports
/api/v1/flights
/api/v1/bookings
/api/v1/passengers
/api/v1/seats
/api/v1/payments
/api/v1/notifications
```

## Deployment

This project includes `vercel.json` for Vercel deployment.

Before deploying:

1. Set production environment variables in Vercel.
2. Use the live backend API Gateway URL for `API_URL`.
3. Use the correct Razorpay key for `RAZORPAY_KEY_ID`.
4. Run `npm run build` and verify the build output.

## Security Notes

- Do not commit live payment keys or backend credentials.
- Store production secrets in Vercel environment variables.
- Keep the backend API behind HTTPS in production.

## Author

Saurabh Wanjari

- Java Full Stack Developer
- Angular and Spring Boot Developer
- GitHub: https://github.com/wanjarisaurabh
