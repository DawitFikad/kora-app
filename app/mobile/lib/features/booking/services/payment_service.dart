import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers.dart';

final paymentServiceProvider = Provider<PaymentService>((ref) {
  return PaymentService(ref.read(dioProvider));
});

class PaymentService {
  final Dio _dio;

  PaymentService(this._dio);

  Future<String> initializePayment({
    required int purchaseId,
    required String provider, // 'CHAPA', 'STRIPE', etc.
  }) async {
    try {
      final response = await _dio.post(
        '/payments/initialize',
        data: {
          'purchaseId': purchaseId,
          'provider': provider,
        },
      );
      
      final data = response.data['data'];
      return data['checkoutUrl'] ?? data['paymentUrl'] ?? ''; 
    } catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(dynamic error) {
    if (error is DioException) {
      final code = error.response?.statusCode;
      final data = error.response?.data;
      final msg = error.message;
      return Exception('Payment Error: $msg\nCode: $code\nData: $data');
    }
    return Exception(error.toString());
  }
}
