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
      
      // Assuming response structure: { success: true, data: { paymentUrl: '...' } }
      // Or checking backend controller... let's assume it returns checkoutUrl
      final data = response.data['data'];
      return data['checkoutUrl'] ?? data['paymentUrl'] ?? ''; 
    } catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(dynamic error) {
    if (error is DioException) {
      return Exception(error.response?.data['error'] ?? 'Payment initialization failed');
    }
    return Exception(error.toString());
  }
}
