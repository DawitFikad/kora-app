import 'package:dio/dio.dart';
import 'package:mobile/core/constants/api_constants.dart';
import 'package:mobile/core/providers.dart';
import 'package:mobile/features/events/models/event.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final eventServiceProvider = Provider<EventService>((ref) {
  return EventService(ref.read(dioProvider));
});

final eventsProvider = FutureProvider<List<Event>>((ref) async {
  final service = ref.read(eventServiceProvider);
  return service.getEvents();
});

class EventService {
  final Dio _dio;
  EventService(this._dio);

  Future<List<Event>> getEvents() async {
    final response = await _dio.get(ApiConstants.events);
    if (response.statusCode == 200) {
      final List<dynamic> data = response.data;
      return data.map((json) => Event.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load events');
    }
  }
}
