import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:mobile/core/network/constants/api_constants.dart';
import 'package:crypto/crypto.dart';
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
  static const String _offlineQrSecret = String.fromEnvironment(
    'SCANNER_QR_SECRET',
    defaultValue: '',
  );
  static const bool _strictOnlineValidation = bool.fromEnvironment(
    'SCANNER_STRICT_ONLINE',
    defaultValue: false,
  );

  ScannerService(this._dio, this._db);

  Future<ScannerResponse> validateTicket(String qrPayload) async {
    final connectivityResult = await Connectivity().checkConnectivity();
    final isOffline = connectivityResult == ConnectivityResult.none;

    if (isOffline) {
      if (_strictOnlineValidation) {
        return ScannerResponse(
          success: false,
          message: 'No internet. Live database validation is required.',
          offline: false,
        );
      }
      return _validateOffline(qrPayload);
    }

    try {
      final response = await _dio.post(
        ApiConstants.validateScan,
        data: {'qrPayload': qrPayload, 'mode': 'ONLINE'},
      );
      return ScannerResponse.fromJson(response.data);
    } on DioException catch (e) {
      // If strict mode is off, allow local fallback when server is unreachable.
      if (!_strictOnlineValidation &&
          (e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout ||
              e.type == DioExceptionType.connectionError)) {
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
      final parts = qrPayload.split('.');
      if (parts.length != 3) throw Exception('Invalid Ticket Format');

      if (_offlineQrSecret.isNotEmpty && !_verifyJwtHs256(qrPayload)) {
        return ScannerResponse(
          success: false,
          message: 'Invalid QR signature. Sync required.',
          offline: true,
          fraudDetected: true,
        );
      }

      final payloadStr = utf8.decode(
        base64Url.decode(base64Url.normalize(parts[1])),
      );
      final payload = jsonDecode(payloadStr);
      final ticketId = payload['tid']?.toString();
      final eventId = (payload['eid'] as num?)?.toInt();

      if (ticketId == null || ticketId.isEmpty || eventId == null) {
        return ScannerResponse(
          success: false,
          message: 'Invalid QR payload data.',
          offline: true,
          fraudDetected: true,
        );
      }

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

  bool _verifyJwtHs256(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return false;

      final unsignedToken = '${parts[0]}.${parts[1]}';
      final digest = Hmac(
        sha256,
        utf8.encode(_offlineQrSecret),
      ).convert(utf8.encode(unsignedToken));

      final expectedSig = _base64UrlNoPadding(digest.bytes);
      return _constantTimeEquals(expectedSig, parts[2]);
    } catch (_) {
      return false;
    }
  }

  String _base64UrlNoPadding(List<int> bytes) {
    return base64UrlEncode(bytes).replaceAll('=', '');
  }

  bool _constantTimeEquals(String a, String b) {
    if (a.length != b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) {
      diff |= a.codeUnitAt(i) ^ b.codeUnitAt(i);
    }
    return diff == 0;
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
