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
  // Add interceptors here if needed (e.g. for Auth header)
  return dio;
});
