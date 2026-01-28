import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/providers.dart';
import '../models/app_notification.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService(ref.watch(dioProvider));
});

class NotificationService {
  final Dio _dio;

  NotificationService(this._dio);

  Future<List<AppNotification>> getNotifications() async {
    try {
      final response = await _dio.get(ApiConstants.notifications);
      // Backend returns { success: true, data: [...] }
      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => AppNotification.fromJson(json)).toList();
    } on DioException catch (e) {
      throw e.response?.data['error'] ?? 'Failed to fetch notifications';
    } catch (e) {
      throw 'Failed to fetch notifications';
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _dio.patch('${ApiConstants.notifications}/$id/read');
    } catch (e) {
      // Log error or handle
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _dio.post('${ApiConstants.notifications}/mark-all-read');
    } catch (e) {
      // Log error or handle
    }
  }

  Future<void> deleteNotification(String id) async {
    try {
      await _dio.delete('${ApiConstants.notifications}/$id');
    } catch (e) {
      // Log error or handle
    }
  }
}
