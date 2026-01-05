import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers.dart';

final paymentServiceProvider = Provider<PaymentService>((ref) {
  return PaymentService(ref.watch(dioProvider));
});

class PaymentService {
  final Dio _dio;

  PaymentService(this._dio);

  Future<Map<String, dynamic>> initializePayment({
    required int purchaseId,
  }) async {
    try {
      final response = await _dio.post(
        '/payments/initialize',
        data: {
          'purchaseId': purchaseId,
        },
      );
      
      // Return the full response data
      return {
        'checkoutUrl': response.data['checkoutUrl'] ?? '',
        'paymentRef': response.data['paymentRef'] ?? '',
        'amount': response.data['amount'] ?? 0,
        'method': response.data['method'] ?? 'CHAPA',
      };
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
      return Exception('Payment Error [$code]: $msg');
    }
    return Exception(error.toString());
  }
}
