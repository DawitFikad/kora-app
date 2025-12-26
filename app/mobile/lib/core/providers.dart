import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import 'storage/local_storage.dart';
import 'router/app_router.dart';
import 'constants/api_constants.dart';

export 'theme/app_theme.dart';

// Will be overridden in main.dart
final localStorageProvider = Provider<LocalStorage>((ref) {
  throw UnimplementedError();
});



final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: ApiConstants.baseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  ));
  final storage = ref.watch(localStorageProvider);
  
  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) {
      final token = storage.authToken;
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      return handler.next(options);
    },
  ));
  
  return dio;
});

final routerProvider = Provider<GoRouter>((ref) {
  final storage = ref.watch(localStorageProvider);
  return AppRouter(storage).router;
});
