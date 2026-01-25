import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers.dart';
import '../../../core/constants/api_constants.dart';

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
        ApiConstants.bookingCalculate,
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
        ApiConstants.bookingValidatePromo,
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
    List<String>? seatNumbers,
    String? paymentMethod,
    String? promoCode,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.bookingReserve,
        data: {
          'eventId': eventId,
          'tierId': tierId,
          'quantity': quantity,
          if (seatNumbers != null) 'seatNumbers': seatNumbers,
          if (paymentMethod != null) 'paymentMethod': paymentMethod,
          if (promoCode != null) 'promoCode': promoCode,
        },
      );
      return response.data['data'];
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<dynamic>> getSeatStatus(int eventId, int tierId) async {
    try {
      final response = await _dio.get('${ApiConstants.bookingSeats}/$eventId/tiers/$tierId/seats');
      return response.data['data'];
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> lockSeats({
    required int eventId,
    required int tierId,
    required List<String> seatNumbers,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.bookingLockSeats,
        data: {
          'eventId': eventId,
          'tierId': tierId,
          'seatNumbers': seatNumbers,
        },
      );
      return response.data['data'];
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<bool> releaseSeats({
    required int eventId,
    required int tierId,
    required List<String> seatNumbers,
  }) async {
    try {
      await _dio.post(
        ApiConstants.bookingReleaseSeats,
        data: {
          'eventId': eventId,
          'tierId': tierId,
          'seatNumbers': seatNumbers,
        },
      );
      return true;
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
