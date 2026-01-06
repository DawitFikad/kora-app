class ApiConstants {
  // Use 10.0.2.2 for Android Emulator
  // Use 127.0.0.1 for Physical Device (via adb reverse) or iOS Simulator
  static const String baseUrl = 'http://localhost:4000/api';
  
  static const String authOtpRequest = '$baseUrl/auth/otp/request';
  static const String authOtpVerify = '$baseUrl/auth/otp/verify';
  static const String events = '$baseUrl/events';
  static const String myTickets = '$baseUrl/tickets/me';
  static const String bookTicket = '$baseUrl/tickets/reserve';
  static const String initPayment = '$baseUrl/payments/initialize';
  static const String notifications = '$baseUrl/notifications';
  static const String profile = '$baseUrl/profiles/me';
  static const String paymentMethods = '$baseUrl/profiles/payment-methods';
}
