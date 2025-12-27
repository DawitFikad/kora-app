import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/providers.dart';
import '../models/payment_method.dart';

final paymentMethodsProvider = FutureProvider<List<PaymentMethod>>((ref) async {
  final service = ref.read(profilePaymentServiceProvider);
  return service.getPaymentMethods();
});

final profilePaymentServiceProvider = Provider<ProfilePaymentService>((ref) {
  return ProfilePaymentService(ref.watch(dioProvider));
});

class ProfilePaymentService {
  final Dio _dio;

  ProfilePaymentService(this._dio);

  Future<List<PaymentMethod>> getPaymentMethods() async {
    try {
      final response = await _dio.get(ApiConstants.paymentMethods);
      return (response.data as List).map((m) => PaymentMethod.fromJson(m)).toList();
    } on DioException catch (e) {
      throw e.response?.data['error'] ?? 'Failed to fetch payment methods';
    }
  }

  Future<PaymentMethod> addPaymentMethod(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(ApiConstants.paymentMethods, data: data);
      return PaymentMethod.fromJson(response.data);
    } on DioException catch (e) {
      throw e.response?.data['error'] ?? 'Failed to add payment method';
    }
  }

  Future<void> deletePaymentMethod(int id) async {
    try {
      await _dio.delete('${ApiConstants.paymentMethods}/$id');
    } on DioException catch (e) {
      throw e.response?.data['error'] ?? 'Failed to delete payment method';
    }
  }

  Future<void> setDefaultMethod(int id) async {
    try {
      await _dio.patch('${ApiConstants.paymentMethods}/$id/default');
    } on DioException catch (e) {
      throw e.response?.data['error'] ?? 'Failed to set default method';
    }
  }
}
