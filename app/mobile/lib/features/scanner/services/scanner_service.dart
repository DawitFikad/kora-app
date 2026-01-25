import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/providers.dart';

final scannerServiceProvider = Provider<ScannerService>((ref) {
  final dio = ref.watch(dioProvider);
  return ScannerService(dio);
});

class ScannerResponse {
  final bool success;
  final String message;
  final Map<String, dynamic>? ticket;
  final bool fraudDetected;

  ScannerResponse({
    required this.success,
    required this.message,
    this.ticket,
    this.fraudDetected = false,
  });

  factory ScannerResponse.fromJson(Map<String, dynamic> json) {
    return ScannerResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? 'Unknown response',
      ticket: json['ticket'],
      fraudDetected: json['fraudDetected'] ?? false,
    );
  }
}

class ScannerService {
  final Dio _dio;

  ScannerService(this._dio);

  Future<ScannerResponse> validateTicket(String qrPayload) async {
    try {
      final response = await _dio.post(
        ApiConstants.validateScan,
        data: {
          'qrPayload': qrPayload,
          'mode': 'ONLINE',
          // Note: In a real app, we would also send deviceId and gateId
        },
      );
      return ScannerResponse.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response?.data != null && e.response?.data is Map) {
        return ScannerResponse.fromJson(e.response!.data);
      }
      return ScannerResponse(
        success: false,
        message: 'Network error: ${e.message}',
      );
    } catch (e) {
      return ScannerResponse(
        success: false,
        message: 'System error: $e',
      );
    }
  }

  Future<List<dynamic>> syncOfflineLogs(List<Map<String, dynamic>> logs) async {
    try {
      final response = await _dio.post(
        ApiConstants.validateSync,
        data: {'logs': logs},
      );
      return response.data as List<dynamic>;
    } catch (e) {
      rethrow;
    }
  }
}
