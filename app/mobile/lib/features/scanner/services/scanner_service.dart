import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:mobile/core/network/constants/api_constants.dart';
import '../../../core/providers.dart';
import 'scanner_database.dart';
import 'dart:convert';

final scannerServiceProvider = Provider<ScannerService>((ref) {
  final dio = ref.watch(dioProvider);
  return ScannerService(dio, ScannerDatabase());
});

final staffInviteAvailableProvider = FutureProvider.autoDispose<bool>((
  ref,
) async {
  final token = ref.watch(authTokenProvider);
  if (token == null) return false;

  final service = ref.watch(scannerServiceProvider);
  try {
    return await service.hasPendingInvitation();
  } catch (_) {
    return false;
  }
});

class ScannerResponse {
  final bool success;
  final String message;
  final Map<String, dynamic>? ticket;
  final bool fraudDetected;
  final bool offline;

  ScannerResponse({
    required this.success,
    required this.message,
    this.ticket,
    this.fraudDetected = false,
    this.offline = false,
  });

  factory ScannerResponse.fromJson(Map<String, dynamic> json) {
    return ScannerResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? 'Unknown response',
      ticket: json['ticket'],
      fraudDetected: json['fraudDetected'] ?? false,
      offline: json['offline'] ?? false,
    );
  }
}

class ScannerService {
  final Dio _dio;
  final ScannerDatabase _db;

  ScannerService(this._dio, this._db);

  Future<ScannerResponse> validateTicket(String qrPayload) async {
    final connectivityResult = await Connectivity().checkConnectivity();
    final isOffline = connectivityResult == ConnectivityResult.none;

    if (isOffline) {
      return _validateOffline(qrPayload);
    }

    try {
      final response = await _dio.post(
        ApiConstants.validateScan,
        data: {'qrPayload': qrPayload, 'mode': 'ONLINE'},
      );
      return ScannerResponse.fromJson(response.data);
    } on DioException catch (e) {
      // If server is unreachable but internet is technically "on", try offline fallback
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        return _validateOffline(qrPayload);
      }

      if (e.response?.data != null && e.response?.data is Map) {
        return ScannerResponse.fromJson(e.response!.data);
      }
      return ScannerResponse(
        success: false,
        message: 'Network error: ${e.message}',
      );
    } catch (e) {
      return ScannerResponse(success: false, message: 'System error: $e');
    }
  }

  Future<ScannerResponse> _validateOffline(String qrPayload) async {
    try {
      // Basic JWT decoding (Offline)
      // Note: We'd ideally check the signature here too if we have the shared secret,
      // but for MVP we check if the ID exists in our local gate_list.
      final parts = qrPayload.split('.');
      if (parts.length < 2) throw Exception("Invalid Ticket Format");

      final payloadStr = utf8.decode(
        base64Url.decode(base64Url.normalize(parts[1])),
      );
      final payload = jsonDecode(payloadStr);
      final String ticketId = payload['tid'];
      final int eventId = payload['eid'];

      final localTicket = await _db.getTicketById(ticketId);

      if (localTicket == null) {
        return ScannerResponse(
          success: false,
          message: "Ticket not in local database. Sync required.",
          offline: true,
        );
      }

      if (localTicket['isUsedLocally'] == 1 ||
          localTicket['status'] == 'USED') {
        return ScannerResponse(
          success: false,
          message: "DUPLICATE ENTRY (Offline check)",
          offline: true,
          fraudDetected: true,
        );
      }

      // Mark as used locally
      await _db.markAsUsedLocally(ticketId, eventId);

      return ScannerResponse(
        success: true,
        message: "STAGED FOR SYNC (Offline)",
        ticket: localTicket,
        offline: true,
      );
    } catch (e) {
      return ScannerResponse(
        success: false,
        message: "Critical Error: Offline validation failed.",
        offline: true,
      );
    }
  }

  Future<void> downloadGateList(int eventId) async {
    try {
      final response = await _dio.get(
        '${ApiConstants.validateGateList}/$eventId',
      );
      final List<dynamic> tickets = response.data['data'];
      await _db.saveGateList(tickets.cast<Map<String, dynamic>>());
    } catch (e) {
      throw Exception('Failed to download gate list: $e');
    }
  }

  Future<void> syncOfflineLogs() async {
    final logs = await _db.getPendingLogs();
    if (logs.isEmpty) return;

    try {
      final payload = logs
          .map(
            (l) => {
              'ticketId': l['ticketId'],
              'eventId': l['eventId'],
              'scannedAt': l['scannedAt'],
              'id': l['id'], // so we can mark as synced
            },
          )
          .toList();

      final response = await _dio.post(
        ApiConstants.validateSync,
        data: {'logs': payload},
      );

      final List<dynamic> syncedIds = response.data['syncedIds'];
      await _db.markLogsAsSynced(syncedIds.cast<int>());
    } catch (e) {
      debugPrint('Sync failed: $e');
    }
  }

  // --- STAFF MANAGEMENT ---

  Future<List<dynamic>> listStaff() async {
    try {
      final response = await _dio.get(ApiConstants.staff);
      return response.data;
    } catch (e) {
      throw Exception('Failed to list staff: $e');
    }
  }

  Future<dynamic> inviteStaff(String phone, String role) async {
    try {
      final response = await _dio.post(
        ApiConstants.staffInvite,
        data: {'phoneNumber': phone, 'role': role},
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to invite staff: $e');
    }
  }

  Future<void> acceptInvitation(String code) async {
    try {
      await _dio.post(ApiConstants.staffAccept, data: {'inviteCode': code});
    } catch (e) {
      throw Exception('Failed to accept invitation: $e');
    }
  }

  Future<bool> hasPendingInvitation() async {
    try {
      final response = await _dio.get(ApiConstants.staffInviteStatus);
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return data['hasPendingInvite'] == true;
      }
      return false;
    } catch (e) {
      throw Exception('Failed to check invitation status: $e');
    }
  }

  Future<void> removeStaff(int staffId) async {
    try {
      await _dio.delete('${ApiConstants.staff}/$staffId');
    } catch (e) {
      throw Exception('Failed to remove staff: $e');
    }
  }
}
