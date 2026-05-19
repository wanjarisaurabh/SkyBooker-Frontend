// ============================================================
// Skybooker — Core TypeScript Models & Enums
// Aligned with backend API contracts
// ============================================================

// ---------- Enums ----------

export type Role = 'PASSENGER' | 'AIRLINE_STAFF' | 'ADMIN';
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'GITHUB';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type TripType = 'ONE_WAY' | 'ROUND_TRIP';

export type FlightStatus = 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'DEPARTED' | 'ARRIVED';

export type SeatClass = 'ECONOMY' | 'BUSINESS' | 'FIRST';
export type SeatStatus = 'AVAILABLE' | 'HELD' | 'CONFIRMED' | 'BOOKED' | 'BLOCKED' | 'SELECTED';

export type PassengerType = 'ADULT' | 'CHILD' | 'INFANT';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentMode = 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'RAZORPAY';

export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'FLIGHT_DELAY'
  | 'FLIGHT_CANCELLATION'
  | 'GATE_CHANGE'
  | 'CHECKIN_REMINDER'
  | 'BOARDING_REMINDER'
  | 'GENERAL';

export type NotificationChannel = 'APP' | 'EMAIL' | 'SMS' | 'PUSH';

export type MealPreference = 'VEG' | 'NON_VEG' | 'JAIN' | 'VEGAN';

// ---------- Auth ----------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
  passportNumber?: string;
  nationality?: string;
}

export interface AuthResponse {
  userId: string;
  fullName: string;
  email: string;
  role: Role;
  provider: AuthProvider;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  message: string;
}

export interface ProfileResponse {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  provider: AuthProvider;
  active: boolean;
  passportNumber: string;
  nationality: string;
  createdAt: string;
}

export interface ProfileUpdateRequest {
  fullName?: string;
  phone?: string;
  passportNumber?: string;
  nationality?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UserSummaryResponse {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  provider: AuthProvider;
  active: boolean;
  passportNumber: string;
  nationality: string;
}

// ---------- Airline & Airport ----------

export interface Airline {
  airlineId: string;
  name: string;
  iataCode: string;
  icaoCode: string;
  logoUrl: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: string;
}

export interface Airport {
  airportId: string;
  name: string;
  iataCode: string;
  icaoCode: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  createdAt: string;
}

export interface AirlineCreateRequest {
  airlineId: string;
  name: string;
  iataCode: string;
  icaoCode: string;
  logoUrl: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
}

export interface AirportCreateRequest {
  airportId: string;
  name: string;
  iataCode: string;
  icaoCode: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// ---------- Flight ----------

export interface Flight {
  flightId: string;
  flightNumber: string;
  airlineId: string;
  originAirportCode: string;
  destinationAirportCode: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  status: FlightStatus;
  aircraftType: string;
  totalSeats: number;
  availableSeats: number;
  basePrice: number;
}

export interface RoundTripResponse {
  outboundFlights: Flight[];
  returnFlights: Flight[];
}

export interface FlightCreateRequest {
  flightNumber: string;
  airlineId: string;
  originAirportCode: string;
  destinationAirportCode: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  aircraftType: string;
  totalSeats: number;
  availableSeats: number;
  basePrice: number;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  date: string;
}

export interface RoundTripSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
}

// ---------- Seat ----------

export interface Seat {
  seatId: string;
  flightId: string;
  seatNumber: string;
  seatClass: SeatClass;
  rowNumber: number;
  columnValue: string;
  windowSeat: boolean;
  aisleSeat: boolean;
  hasExtraLegroom: boolean;
  status: SeatStatus;
  seatStatus?: SeatStatus;
  isBooked?: boolean;
  priceMultiplier: number;
  holdExpiresAt: string;
}

export interface SeatCreateRequest {
  flightId: string;
  seats: SeatItem[];
}

export interface SeatItem {
  seatNumber: string;
  seatClass: SeatClass;
  rowNumber: number;
  columnValue: string;
  windowSeat: boolean;
  aisleSeat: boolean;
  hasExtraLegroom: boolean;
  priceMultiplier: number;
}

// ---------- Booking ----------

export interface Booking {
  bookingId: string;
  userId: string;
  flightId: string;
  pnrCode: string;
  tripType: TripType;
  status: BookingStatus;
  totalFare: number;
  baseFare: number;
  taxes: number;
  mealPreference: string;
  luggageKg: number;
  contactEmail: string;
  contactPhone: string;
  bookedAt: string;
  departureTime: string;
  paymentId: string;
}

export interface BookingCreateRequest {
  userId: string;
  flightId: string;
  tripType: TripType;
  baseFare: number;
  taxes: number;
  totalFare: number;
  contactEmail: string;
  contactPhone: string;
  departureTime: string;
}

export interface BookingAddonRequest {
  mealPreference?: MealPreference;
  extraLuggageKg?: number;
  additionalCost?: number;
}

// ---------- Passenger ----------

export interface PassengerInfo {
  passengerId: string;
  userId: string;
  bookingId: string;
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  passportNumber: string;
  nationality: string;
  passportExpiry: string;
  seatId: string;
  seatNumber: string;
  ticketNumber: string;
  passengerType: PassengerType;
}

export interface PassengerCreateRequest {
  userId: string;
  bookingId: string;
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  passportNumber: string;
  nationality: string;
  passportExpiry: string;
  passengerType: PassengerType;
}

// ---------- Payment ----------

export interface PaymentInitiateRequest {
  bookingId: string;
  amount: number;
  currency: string;
  description: string;
}

export interface PaymentVerifyRequest {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentRefundRequest {
  paymentId: string;
  refundAmount?: number;
  reason: string;
}

export interface PaymentResponse {
  paymentId: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMode: PaymentMode;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  transactionId: string;
  paidAt: string;
  refundedAt: string;
  refundAmount: number;
  createdAt: string;
  razorpayKeyId: string;
}

// ---------- Notification ----------

export interface Notification {
  notificationId: string;
  recipientId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  relatedBookingId: string;
  isRead: boolean;
  sentAt: string;
}

export interface BroadcastRequest {
  title: string;
  message: string;
  recipientIds?: string[]; //define optional things 
  targetRole?: Role;
}

// ? ,"Ye property ho bhi sakti hai aur nahi bhi."

// ---------- API Common ----------

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface RevenueResponse {
  totalRevenue: number;
  currency: string;
}

export interface BroadcastResponse {
  sent: number;
  title: string;
}
