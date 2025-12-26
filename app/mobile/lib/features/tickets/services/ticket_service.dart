import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/providers.dart';
import '../../../core/storage/local_storage.dart';
import '../models/ticket.dart';

final ticketServiceProvider = Provider<TicketService>((ref) {
  final dio = ref.watch(dioProvider);
  final storage = ref.watch(localStorageProvider);
  return TicketService(dio, storage);
});

class TicketService {
  final Dio _dio;
  final LocalStorage _storage;

  TicketService(this._dio, this._storage);

  Future<List<Ticket>> getMyTickets() async {
    try {
      final response = await _dio.get(ApiConstants.myTickets);
      final List<dynamic> data = response.data;
      final tickets = data.map((json) => Ticket.fromJson(json)).toList();
      
      // Save to cache
      await _saveToCache(tickets);
      
      return tickets;
    } on DioException catch (e) {
      // Try load from cache
      final cached = await _loadFromCache();
      if (cached.isNotEmpty) {
        return cached;
      }
      throw _handleError(e);
    } catch (e) {
      // Try load from cache on other errors
      final cached = await _loadFromCache();
      if (cached.isNotEmpty) {
        return cached;
      }
      rethrow;
    }
  }

  Future<void> _saveToCache(List<Ticket> tickets) async {
    try {
      final jsonList = tickets.map((t) => t.toJson()).toList();
      final jsonString = jsonEncode(jsonList);
      await _storage.setCachedTickets(jsonString);
    } catch (e) {
      print('Failed to write tickets cache: $e');
    }
  }

  Future<List<Ticket>> _loadFromCache() async {
    try {
      final jsonString = _storage.cachedTickets;
      if (jsonString != null && jsonString.isNotEmpty) {
         final List<dynamic> jsonList = jsonDecode(jsonString);
         return jsonList.map((json) => Ticket.fromJson(json)).toList();
      }
    } catch (e) {
      print('Failed to read tickets cache: $e');
    }
    return [];
  }

  Exception _handleError(DioException e) {
    final code = e.response?.statusCode;
    final data = e.response?.data;
    String? serverMessage;
    if (data is Map) {
      serverMessage = data['error']?.toString() ?? data['message']?.toString();
    }
    final msg = serverMessage ?? e.message;
    return Exception('Ticket Error [$code]: $msg');
  }
}
