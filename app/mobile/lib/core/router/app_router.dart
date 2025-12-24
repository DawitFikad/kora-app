import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/onboarding/presentation/language_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/events/presentation/home_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../storage/local_storage.dart';

class AppRouter {
  final LocalStorage storage;

  AppRouter(this.storage);

  late final GoRouter router = GoRouter(
    initialLocation: _getInitialRoute(),
    routes: [
      GoRoute(
        path: '/language',
        builder: (context, state) => const LanguageScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
  );

  String _getInitialRoute() {
    if (storage.isFirstLaunch) {
      return '/language';
    }
    if (storage.authToken == null) {
      return '/login';
    }
    return '/home';
  }
}
