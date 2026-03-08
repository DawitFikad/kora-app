import 'package:flutter/foundation.dart';

class ApiConstants {
  // Local API default moved to 4001 because 4000 is commonly occupied by Docker/WSL on Windows.
  // Use IPv4 loopback on web to avoid localhost -> ::1 resolution issues.
  static const String _webLocalBaseUrl = 'http://127.0.0.1:4001/api';
  static const String _androidEmulatorBaseUrl = 'http://10.0.2.2:4001/api';
  static const String _iosSimulatorBaseUrl = 'http://127.0.0.1:4001/api';
  static const String _defaultLocalBaseUrl = 'http://127.0.0.1:4001/api';

  // Override priority:
  // 1) API_BASE_URL (global)
  // 2) API_BASE_URL_WEB for web
  // 3) API_BASE_URL_ANDROID / API_BASE_URL_IOS / API_BASE_URL_MOBILE for mobile
  // 4) platform-safe defaults
  static String get baseUrl {
    const globalBaseUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: '',
    );
    if (globalBaseUrl.isNotEmpty) return globalBaseUrl;

    const webBaseUrl = String.fromEnvironment(
      'API_BASE_URL_WEB',
      defaultValue: '',
    );
    const mobileBaseUrl = String.fromEnvironment(
      'API_BASE_URL_MOBILE',
      defaultValue: '',
    );
    const androidBaseUrl = String.fromEnvironment(
      'API_BASE_URL_ANDROID',
      defaultValue: '',
    );
    const iosBaseUrl = String.fromEnvironment(
      'API_BASE_URL_IOS',
      defaultValue: '',
    );

    if (kIsWeb) {
      if (webBaseUrl.isNotEmpty) return webBaseUrl;
      return _webLocalBaseUrl;
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        if (androidBaseUrl.isNotEmpty) return androidBaseUrl;
        if (mobileBaseUrl.isNotEmpty) return mobileBaseUrl;
        return _androidEmulatorBaseUrl;
      case TargetPlatform.iOS:
        if (iosBaseUrl.isNotEmpty) return iosBaseUrl;
        if (mobileBaseUrl.isNotEmpty) return mobileBaseUrl;
        return _iosSimulatorBaseUrl;
      default:
        if (mobileBaseUrl.isNotEmpty) return mobileBaseUrl;
        return _defaultLocalBaseUrl;
    }
  }

  static String get platformLabel {
    if (kIsWeb) return 'web';

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'android';
      case TargetPlatform.iOS:
        return 'ios';
      case TargetPlatform.windows:
        return 'windows';
      case TargetPlatform.macOS:
        return 'macos';
      case TargetPlatform.linux:
        return 'linux';
      default:
        return 'unknown';
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
