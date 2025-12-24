class ApiConstants {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS Simulator
  // For physical device, use your machine's LAN IP
  static const String baseUrl = 'http://10.232.73.99:4000/api';
  
  static const String authOtpRequest = '$baseUrl/auth/otp/request';
  static const String authOtpVerify = '$baseUrl/auth/otp/verify';
  static const String events = '$baseUrl/events';
  static const String myTickets = '$baseUrl/tickets/me';
  static const String bookTicket = '$baseUrl/tickets/reserve';
  static const String initPayment = '$baseUrl/payments/initialize';
}
