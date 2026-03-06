import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/network/constants/api_constants.dart';
import 'storage/local_storage.dart';
import 'router/app_router.dart';

export 'theme/app_theme.dart';

// Will be overridden in main.dart
final localStorageProvider = ChangeNotifierProvider<LocalStorage>((ref) {
  throw UnimplementedError();
});

final authTokenProvider = Provider<String?>((ref) {
  final storage = ref.watch(localStorageProvider);
  return storage.authToken;
});

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  // Use read here for stability. The interceptor below will
  // dynamically read the latest token from the storage object
  // without needing to re-create the entire Dio instance.
  final storage = ref.read(localStorageProvider);

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = storage.authToken;
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        final isConnectionError =
            error.type == DioExceptionType.connectionError;
        final isGet = error.requestOptions.method.toUpperCase() == 'GET';
        final alreadyRetried = error.requestOptions.extra['retried'] == true;

        if (isConnectionError && isGet && !alreadyRetried) {
          final retryOptions = error.requestOptions;
          retryOptions.extra = {...retryOptions.extra, 'retried': true};

          try {
            await Future<void>.delayed(const Duration(milliseconds: 350));
            final retryResponse = await dio.fetch<dynamic>(retryOptions);
            return handler.resolve(retryResponse);
          } catch (_) {
            // Fall through to normal error handling
          }
        }

        final statusCode = error.response?.statusCode;
        if (statusCode == 401) {
          await storage.clearAuth();
        }
        return handler.next(error);
      },
    ),
  );

  dio.interceptors.add(
    LogInterceptor(
      requestHeader: true,
      requestBody: true,
      responseHeader: false,
      responseBody: true,
      error: true,
    ),
  );

  return dio;
});

final routerProvider = Provider<GoRouter>((ref) {
  // Use read here! We don't want to re-create the Router instance
  // every time storage notifies. GoRouter handles its own refreshes
  // via the refreshListenable below.
  final storage = ref.read(localStorageProvider);
  return AppRouter(storage).router;
});
