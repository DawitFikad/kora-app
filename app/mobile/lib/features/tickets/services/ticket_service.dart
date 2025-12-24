import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/providers.dart';
import '../models/ticket.dart';

final ticketServiceProvider = Provider<TicketService>((ref) {
  return TicketService(ref.read(dioProvider));
});

class TicketService {
  final Dio _dio;

  TicketService(this._dio);

  Future<List<Ticket>> getMyTickets() async {
    try {
      final response = await _dio.get(ApiConstants.myTickets);
      final List<dynamic> data = response.data;
      return data.map((json) => Ticket.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException e) {
    if (e.response != null) {
      return e.response?.data['error'] ?? 'Server Error';
    }
    return 'Connection Error';
  }
}
