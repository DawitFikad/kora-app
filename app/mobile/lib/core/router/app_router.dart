import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/login_screen.dart';

import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/events/presentation/home_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../storage/local_storage.dart';

class AppRouter {
  final LocalStorage storage;

  AppRouter(this.storage);

  late final GoRouter router = GoRouter(
    refreshListenable: storage,
    initialLocation: '/login',
    redirect: (context, state) {
      final isFirstLaunch = storage.isFirstLaunch;
      final isAuthenticated = storage.authToken != null;

      final isGoingToOnboarding = state.matchedLocation == '/onboarding';
      final isGoingToLogin = state.matchedLocation == '/login';

      if (isFirstLaunch) {
        if (!isGoingToOnboarding) return '/onboarding';
        return null; // Let them stay in onboarding
      }

      if (!isAuthenticated) {
        if (!isGoingToLogin) return '/login';
        return null;
      }

      // If authenticated and going to login/onboarding, send to home
      if (isAuthenticated && (isGoingToLogin || isGoingToOnboarding)) {
        return '/home';
      }

      return null;
    },
    routes: [
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
}
