import 'package:flutter/foundation.dart';

class ApiConstants {
  static const String _webLocalBaseUrl = 'http://127.0.0.1:4000/api';
  static const String _androidEmulatorBaseUrl = 'http://10.0.2.2:4000/api';
  static const String _defaultLocalBaseUrl = 'http://127.0.0.1:4000/api';

  // Optional override, example:
  // flutter run --dart-define=API_BASE_URL=http://192.168.1.20:4000/api
  static String get baseUrl {
    const envBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (envBaseUrl.isNotEmpty) return envBaseUrl;

    if (kIsWeb) return _webLocalBaseUrl;

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return _androidEmulatorBaseUrl;
      default:
        return _defaultLocalBaseUrl;
    }
  }

  static String get authOtpRequest => '$baseUrl/auth/otp/request';
  static String get authOtpVerify => '$baseUrl/auth/otp/verify';
  static String get events => '$baseUrl/events';
  static String get bestEventsThisWeek => '$baseUrl/events/best-this-week';
  static String get trendingNow => '$baseUrl/events/trending-now';
  static String get personalizedPicks => '$baseUrl/events/personalized-picks';
  static String get upcomingAwards => '$baseUrl/events/upcoming-awards';
  static String get workshopsShortCourses =>
      '$baseUrl/events/workshops-short-courses';
  static String get citySpotlight => '$baseUrl/events/city-spotlight';
  static String get lastMinuteToday => '$baseUrl/events/last-minute-today';
  static String get offersDeals => '$baseUrl/events/offers-deals';
  static String get newUpcomingExperiences =>
      '$baseUrl/events/new-upcoming-experiences';
  static String get recommendedMovies => '$baseUrl/events/recommended-movies';
  static String get myTickets => '$baseUrl/tickets/me';
  static String get bookTicket => '$baseUrl/tickets/reserve';
  static String get initPayment => '$baseUrl/payments/initialize';
  static String get notifications => '$baseUrl/notifications';
  static String get profile => '$baseUrl/profiles/me';
  static String get organizerProfile => '$baseUrl/profiles/organizer';
  static String get paymentMethods => '$baseUrl/profiles/payment-methods';
  static String get banners => '$baseUrl/content/banners';
  static String get validateScan => '$baseUrl/validate/scan';
  static String get validateGateList => '$baseUrl/validate/gate-list';
  static String get validateSync => '$baseUrl/validate/sync';
  static String get staff => '$baseUrl/staff';
  static String get staffInvite => '$baseUrl/staff/invite';
  static String get staffAccept => '$baseUrl/staff/accept';
  static String get staffInviteStatus => '$baseUrl/staff/invite-status';
  static String get bookingCalculate => '$baseUrl/booking/calculate-price';
  static String get bookingReserve => '$baseUrl/booking/reserve';
  static String get bookingSeats => '$baseUrl/booking/events';
  static String get bookingValidatePromo => '$baseUrl/booking/validate-promo';
  static String get bookingLockSeats => '$baseUrl/booking/lock-seats';
  static String get bookingReleaseSeats => '$baseUrl/booking/release-seats';
}
