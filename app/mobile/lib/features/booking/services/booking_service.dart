import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/constants/api_constants.dart';
import 'package:mobile/core/providers.dart';

final bookingServiceProvider = Provider<BookingService>((ref) {
  return BookingService(ref.watch(dioProvider));
});

class BookingService {
  final Dio _dio;

  BookingService(this._dio);

  Future<Map<String, dynamic>> calculatePrice({
    required int eventId,
    required int tierId,
    required int quantity,
    String? promoCode,
  }) async {
    try {
      final response = await _dio.post(
        '/booking/calculate-price',
        data: {
          'eventId': eventId,
          'tierId': tierId,
          'quantity': quantity,
          if (promoCode != null && promoCode.isNotEmpty) 'promoCode': promoCode,
        },
      );
      return response.data['data'];
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> validatePromoCode(String code, int eventId) async {
    try {
      final response = await _dio.post(
        '/booking/validate-promo',
        data: {'code': code, 'eventId': eventId},
      );
      return response.data;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> createReservation({
    required int eventId,
    required int tierId,
    required int quantity,
    String? paymentMethod,
    String? promoCode,
  }) async {
    try {
      final response = await _dio.post(
        '/booking/reserve',
        data: {
          'eventId': eventId,
          'tierId': tierId,
          'quantity': quantity,
          if (paymentMethod != null) 'paymentMethod': paymentMethod,
          if (promoCode != null) 'promoCode': promoCode,
        },
      );
      return response.data['data'];
    } catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(dynamic error) {
    if (error is DioException) {
      final code = error.response?.statusCode;
      final data = error.response?.data;
      String? serverMessage;
      if (data is Map) {
        serverMessage = data['error']?.toString() ?? data['message']?.toString();
      }
      final msg = serverMessage ?? error.message;
      return Exception('DioError [$code]: $msg');
    }
    return Exception(error.toString());
  }
}
