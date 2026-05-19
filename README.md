# SkyBooker Frontend

SkyBooker Frontend is an airline booking web application built using Angular. The project provides a modern UI for flight search, airline management, booking, authentication, payment integration, and user profile management.

---

# 🚀 Features

- User Authentication & Authorization
- Flight Search & Booking
- Airline Management
- Airport Search
- Razorpay Payment Integration
- Booking Confirmation
- Responsive UI
- JWT Token Handling
- Route Guards & Protected Routes
- Error Handling & Logging
- API Integration with Spring Boot Backend

---

# 🛠️ Tech Stack

## Frontend
- Angular
- TypeScript
- RxJS
- HTML5
- CSS3
- Bootstrap / Angular Material

## Tools & Services
- Git & GitHub
- Vercel Deployment
- Razorpay
- SonarQube

---

# 📂 Project Structure

```bash
src/
 ┣ app/
 ┃ ┣ components/
 ┃ ┣ services/
 ┃ ┣ guards/
 ┃ ┣ interceptors/
 ┃ ┣ models/
 ┃ ┣ pages/
 ┃ ┗ shared/
 ┣ assets/
 ┣ environments/
 ┗ styles/
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/wanjarisaurabh/SkyBooker-Frontend.git
```

## 2️⃣ Move Into Project

```bash
cd SkyBooker-Frontend
```

## 3️⃣ Install Dependencies

```bash
npm install
```

## 4️⃣ Run Application

```bash
ng serve
```

Application will run at:

```bash
http://localhost:4200
```

---

# 🔐 Authentication Flow

- User logs in using credentials
- Backend returns JWT token
- Token stored in localStorage/sessionStorage
- HTTP Interceptor attaches token to API requests
- Route Guards protect secure pages

---

# 💳 Payment Integration

SkyBooker integrates Razorpay for secure payment processing.

Features:
- Online Payment Gateway
- Booking Confirmation
- Payment Verification
- Transaction Handling

---

# 🌐 API Integration

The frontend communicates with Spring Boot REST APIs for:

- Authentication
- Flight Management
- Airport Management
- Airline Management
- Booking Services
- User Profile Management

---

# 🧪 Testing

Run unit tests:

```bash
ng test
```

Run production build:

```bash
ng build
```

---

# 🚀 Deployment

## Frontend Deployment
- Vercel

## Backend Deployment
- AWS / Render / Railway

---

# 📸 Screenshots

Add project screenshots here.

---

# 👨‍💻 Author

## Saurabh Wanjari

- B.Tech CSE Student
- Java Full Stack Developer
- Angular & Spring Boot Developer
- Data Analytics Enthusiast

GitHub:
https://github.com/wanjarisaurabh

---

# 📄 License

This project is developed for learning and portfolio purposes.
