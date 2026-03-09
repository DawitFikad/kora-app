import 'package:dio/dio.dart';
import 'package:mobile/core/network/constants/api_constants.dart';
import 'package:mobile/core/providers.dart';
import 'package:mobile/features/events/models/event.dart';
import 'package:mobile/features/events/models/category.dart';
import 'package:mobile/features/events/models/city.dart';
import 'package:mobile/features/events/models/event_engagement.dart';
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

final eventEngagementProvider = FutureProvider.family<EventEngagement, int>((
  ref,
  id,
) async {
  // Watch storage so engagement reflects current user actions
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  return service.getEventEngagement(id);
});

final bannersProvider = FutureProvider<List<HomepageBanner>>((ref) async {
  final service = ref.watch(eventServiceProvider);
  return service.getBanners();
});

class EventService {
  final Dio _dio;
  EventService(this._dio);

  List<dynamic> _extractListPayload(dynamic payload) {
    if (payload is List) return payload;
    if (payload is Map<String, dynamic>) {
      final dynamic data =
          payload['data'] ?? payload['events'] ?? payload['items'];
      if (data is List) return data;
    }
    return const <dynamic>[];
  }

  int? _extractTotalPages(dynamic payload) {
    if (payload is! Map<String, dynamic>) return null;

    final dynamic pagination = payload['pagination'] ?? payload['meta'];
    if (pagination is Map<String, dynamic>) {
      final dynamic tp = pagination['totalPages'] ?? pagination['pages'];
      if (tp is num) return tp.toInt();

      final dynamic total = pagination['total'];
      final dynamic limit = pagination['limit'] ?? pagination['pageSize'];
      if (total is num && limit is num && limit.toInt() > 0) {
        final int t = total.toInt();
        final int l = limit.toInt();
        return (t / l).ceil();
      }
    }

    return null;
  }

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
    // Safe default if backend supports pagination.
    queryParams['limit'] = 100;

    try {
      final response = await _dio.get(
        ApiConstants.events,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        final Map<int, Event> uniqueEvents = {};

        final firstBatch = _extractListPayload(response.data);
        for (final item in firstBatch) {
          final event = Event.fromJson(item);
          uniqueEvents[event.id] = event;
        }

        final int totalPages = _extractTotalPages(response.data) ?? 1;
        if (totalPages > 1) {
          for (int page = 2; page <= totalPages; page++) {
            final nextRes = await _dio.get(
              ApiConstants.events,
              queryParameters: {...queryParams, 'page': page},
            );

            final nextBatch = _extractListPayload(nextRes.data);
            for (final item in nextBatch) {
              final event = Event.fromJson(item);
              uniqueEvents[event.id] = event;
            }
          }
        }

        return uniqueEvents.values.toList();
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

  Future<List<Event>> getBestEventsThisWeek({
    int? cityId,
    int limit = 10,
  }) async {
    final queryParams = <String, dynamic>{'limit': limit};
    if (cityId != null && cityId != 0) queryParams['cityId'] = cityId;

    try {
      final response = await _dio.get(
        ApiConstants.bestEventsThisWeek,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Event.fromJson(json)).toList();
      }
      throw Exception('Failed to load best events this week');
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Event>> getTrendingNow({int limit = 10}) async {
    final queryParams = <String, dynamic>{'limit': limit};

    try {
      final response = await _dio.get(
        ApiConstants.trendingNow,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Event.fromJson(json)).toList();
      }
      throw Exception('Failed to load trending events');
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Event>> getPersonalizedPicks({
    int? cityId,
    int limit = 12,
  }) async {
    final queryParams = <String, dynamic>{'limit': limit};
    if (cityId != null && cityId != 0) queryParams['cityId'] = cityId;

    try {
      final response = await _dio.get(
        ApiConstants.personalizedPicks,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Event.fromJson(json)).toList();
      }
      throw Exception('Failed to load personalized picks');
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Event>> getUpcomingAwards({int? cityId, int limit = 12}) async {
    final queryParams = <String, dynamic>{'limit': limit};
    if (cityId != null && cityId != 0) queryParams['cityId'] = cityId;

    try {
      final response = await _dio.get(
        ApiConstants.upcomingAwards,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Event.fromJson(json)).toList();
      }
      throw Exception('Failed to load upcoming awards');
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Event>> getWorkshopsShortCourses({
    int? cityId,
    int limit = 10,
  }) async {
    final queryParams = <String, dynamic>{'limit': limit};
    if (cityId != null && cityId != 0) queryParams['cityId'] = cityId;

    try {
      final response = await _dio.get(
        ApiConstants.workshopsShortCourses,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Event.fromJson(json)).toList();
      }
      throw Exception('Failed to load workshops and short courses');
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Event>> getCitySpotlight({int? cityId, int limit = 10}) async {
    final queryParams = <String, dynamic>{'limit': limit};
    if (cityId != null && cityId != 0) queryParams['cityId'] = cityId;

    try {
      final response = await _dio.get(
        ApiConstants.citySpotlight,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Event.fromJson(json)).toList();
      }
      throw Exception('Failed to load city spotlight');
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Event>> getLastMinuteToday({int? cityId, int limit = 10}) async {
    final queryParams = <String, dynamic>{'limit': limit};
    if (cityId != null && cityId != 0) queryParams['cityId'] = cityId;

    try {
      final response = await _dio.get(
        ApiConstants.lastMinuteToday,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Event.fromJson(json)).toList();
      }
      throw Exception('Failed to load last-minute events');
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Event>> getOffersDeals({int? cityId, int limit = 10}) async {
    final queryParams = <String, dynamic>{'limit': limit};
    if (cityId != null && cityId != 0) queryParams['cityId'] = cityId;

    try {
      final response = await _dio.get(
        ApiConstants.offersDeals,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Event.fromJson(json)).toList();
      }
      throw Exception('Failed to load offers and deals');
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Event>> getNewUpcomingExperiences({
    int? cityId,
    int limit = 10,
  }) async {
    final queryParams = <String, dynamic>{'limit': limit};
    if (cityId != null && cityId != 0) queryParams['cityId'] = cityId;

    try {
      final response = await _dio.get(
        ApiConstants.newUpcomingExperiences,
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Event.fromJson(json)).toList();
      }
      throw Exception('Failed to load new and upcoming experiences');
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> preRegisterEvent(int eventId) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.events}/$eventId/pre-register',
      );
      if (response.statusCode == 200) return;
      throw Exception('Failed to pre-register for event');
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> subscribeEventReminder(int eventId) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.events}/$eventId/reminders/subscribe',
      );
      if (response.statusCode == 200) return;
      throw Exception('Failed to subscribe to event reminder');
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

  Future<EventEngagement> getEventEngagement(int eventId) async {
    try {
      final response = await _dio.get(
        '${ApiConstants.events}/$eventId/engagement',
      );
      if (response.statusCode == 200) {
        return EventEngagement.fromJson(response.data as Map<String, dynamic>);
      }
      return const EventEngagement(
        likesCount: 0,
        averageRating: 0,
        ratingsCount: 0,
        userLiked: false,
        userRating: null,
        userComment: null,
      );
    } catch (_) {
      return const EventEngagement(
        likesCount: 0,
        averageRating: 0,
        ratingsCount: 0,
        userLiked: false,
        userRating: null,
        userComment: null,
      );
    }
  }

  Future<void> toggleLikeEvent(int eventId) async {
    try {
      final response = await _dio.post('${ApiConstants.events}/$eventId/like');
      if (response.statusCode != 200) {
        throw Exception('Failed to toggle like');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> rateEvent(
    int eventId, {
    required int rating,
    String? comment,
  }) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.events}/$eventId/rate',
        data: {'rating': rating, 'comment': comment},
      );
      if (response.statusCode != 200) {
        throw Exception('Failed to submit rating');
      }
    } catch (e) {
      throw Exception('Network error: $e');
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
