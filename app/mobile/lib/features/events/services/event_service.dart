import 'package:dio/dio.dart';
import 'package:mobile/core/network/constants/api_constants.dart';
import 'package:mobile/core/providers.dart';
import 'package:mobile/features/events/models/event.dart';
import 'package:mobile/features/events/models/category.dart';
import 'package:mobile/features/events/models/city.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/events/models/homepage_banner.dart';

final eventServiceProvider = Provider<EventService>((ref) {
  return EventService(ref.watch(dioProvider));
});

final eventsProvider = FutureProvider.autoDispose<List<Event>>((ref) async {
  // Watch storage so we refresh when user logs in/out
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  return service.getEvents();
});

final eventDetailsProvider = FutureProvider.family<Event, int>((ref, id) async {
  // Watch storage so we refresh when user logs in/out
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  return service.getEventById(id);
});

final bannersProvider = FutureProvider<List<HomepageBanner>>((ref) async {
  final service = ref.watch(eventServiceProvider);
  return service.getBanners();
});

class EventService {
  final Dio _dio;
  EventService(this._dio);

  Future<Event> getEventById(int id) async {
    try {
      final response = await _dio.get('${ApiConstants.events}/$id');
      if (response.statusCode == 200) {
        return Event.fromJson(response.data);
      } else {
        throw Exception('Failed to load event details');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Event>> getEvents({
    int? categoryId,
    int? cityId,
    String? search,
    bool? featured,
  }) async {
    final queryParams = <String, dynamic>{};
    if (categoryId != null && categoryId != 0)
      queryParams['categoryId'] = categoryId;
    if (cityId != null) queryParams['cityId'] = cityId;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (featured != null) queryParams['featured'] = featured;

    try {
      final response = await _dio.get(
        ApiConstants.events,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Event.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load events');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Event>> getRecommendedMovies({
    int? cityId,
    int limit = 12,
  }) async {
    final queryParams = <String, dynamic>{'limit': limit};
    if (cityId != null && cityId != 0) queryParams['cityId'] = cityId;

    try {
      final response = await _dio.get(
        ApiConstants.recommendedMovies,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Event.fromJson(json)).toList();
      }
      throw Exception('Failed to load recommended movies');
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<Map<String, List<dynamic>>> getMetadata() async {
    try {
      final response = await _dio.get('${ApiConstants.events}/meta');
      if (response.statusCode == 200) {
        return {
          'categories': (response.data['categories'] as List)
              .map((e) => Category.fromJson(e))
              .toList(),
          'cities': (response.data['cities'] as List)
              .map((e) => City.fromJson(e))
              .toList(),
        };
      }
      return {'categories': [], 'cities': []};
    } catch (e) {
      return {'categories': [], 'cities': []};
    }
  }

  Future<List<Category>> getCategories() async {
    final meta = await getMetadata();
    return meta['categories'] as List<Category>;
  }

  Future<List<City>> getCities() async {
    final meta = await getMetadata();
    return meta['cities'] as List<City>;
  }

  Future<List<HomepageBanner>> getBanners() async {
    try {
      final response = await _dio.get(ApiConstants.banners);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? [];
        return data.map((json) => HomepageBanner.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}

final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  final service = ref.read(eventServiceProvider);
  return service.getCategories();
});

final citiesProvider = FutureProvider<List<City>>((ref) async {
  final service = ref.read(eventServiceProvider);
  return service.getCities();
});
