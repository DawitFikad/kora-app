class ApiConstants {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS Simulator
  // static const String baseUrl = 'http://10.0.2.2:4000/api';

  // For Web or iOS Simulator
  static const String baseUrl = 'http://localhost:4000/api';

  static const String authOtpRequest = '$baseUrl/auth/otp/request';
  static const String authOtpVerify = '$baseUrl/auth/otp/verify';
  static const String events = '$baseUrl/events';
  static const String recommendedMovies = '$baseUrl/events/recommended-movies';
  static const String myTickets = '$baseUrl/tickets/me';
  static const String bookTicket = '$baseUrl/tickets/reserve';
  static const String initPayment = '$baseUrl/payments/initialize';
  static const String notifications = '$baseUrl/notifications';
  static const String profile = '$baseUrl/profiles/me';
  static const String organizerProfile = '$baseUrl/profiles/organizer';
  static const String paymentMethods = '$baseUrl/profiles/payment-methods';
  static const String banners = '$baseUrl/content/banners';
  static const String validateScan = '$baseUrl/validate/scan';
  static const String validateGateList = '$baseUrl/validate/gate-list';
  static const String validateSync = '$baseUrl/validate/sync';
  static const String staff = '$baseUrl/staff';
  static const String staffInvite = '$baseUrl/staff/invite';
  static const String staffAccept = '$baseUrl/staff/accept';
  static const String bookingCalculate = '$baseUrl/booking/calculate-price';
  static const String bookingReserve = '$baseUrl/booking/reserve';
  static const String bookingSeats = '$baseUrl/booking/events';
  static const String bookingValidatePromo = '$baseUrl/booking/validate-promo';
  static const String bookingLockSeats = '$baseUrl/booking/lock-seats';
  static const String bookingReleaseSeats = '$baseUrl/booking/release-seats';
}
