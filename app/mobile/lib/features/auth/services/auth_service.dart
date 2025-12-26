import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_storage.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.watch(dioProvider), ref.watch(localStorageProvider));
});

class AuthService {
  final Dio _dio;
  final LocalStorage _storage;

  AuthService(this._dio, this._storage);

  Future<void> requestOtp(String phoneNumber) async {
    try {
      await _dio.post(ApiConstants.authOtpRequest, data: {'phoneNumber': phoneNumber});
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> verifyOtp(String phoneNumber, String otp) async {
    try {
      final response = await _dio.post(ApiConstants.authOtpVerify, data: {
        'phoneNumber': phoneNumber,
        'otp': otp,
      });

      final accessToken = response.data['accessToken'];
      if (accessToken != null) {
        await _storage.setAuthToken(accessToken);
      } else {
        throw Exception('No access token in response');
      }
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> logout() async {
    await _storage.clearAuth();
  }

  Exception _handleError(DioException e) {
    final code = e.response?.statusCode;
    final data = e.response?.data;
    String? serverMessage;
    if (data is Map) {
      serverMessage = data['error']?.toString() ?? data['message']?.toString();
    }
    final msg = serverMessage ?? e.message;
    return Exception('Auth Error [$code]: $msg');
  }
}
