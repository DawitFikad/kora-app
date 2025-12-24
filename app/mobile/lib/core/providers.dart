import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'storage/local_storage.dart';

export 'theme/app_theme.dart';

// Will be overridden in main.dart
final localStorageProvider = Provider<LocalStorage>((ref) {
  throw UnimplementedError();
});

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio();
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
