import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_screen.dart';
import '../../features/events/presentation/event_details_screen.dart';
import '../../features/events/presentation/favorites_screen.dart';
import '../../features/events/presentation/home_screen.dart';
import '../../features/events/presentation/notification_screen.dart';
import '../../features/events/presentation/seat_selection_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/scanner/presentation/scanner_screen.dart';
import '../../features/scanner/presentation/staff_management_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../../features/tickets/presentation/my_tickets_screen.dart';
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

      final location = state.uri.toString();
      final isGoingToOnboarding = state.matchedLocation == '/onboarding';
      final isGoingToLogin = state.matchedLocation == '/login';
      final isGoingToPaymentCallback = state.matchedLocation.startsWith('/payment');

      // Handle deep links with etticket:// scheme
      if (location.startsWith('etticket://')) {
        // Strip the scheme and redirect to the proper path
        final path = location.replaceFirst('etticket:/', '');
        return path;
      }

      // Allow payment callbacks to pass through without redirect
      if (isGoingToPaymentCallback) {
        return null;
      }

      // If it's the first launch, force onboarding UNLESS they are already authenticated.
      // An authenticated user should never be stuck in onboarding.
      if (isFirstLaunch && !isAuthenticated) {
        if (!isGoingToOnboarding) return '/onboarding';
        return null;
      }

      if (!isAuthenticated) {
        if (!isGoingToLogin) return '/login';
        return null;
      }

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
      GoRoute(
        path: '/event/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return EventDetailsScreen(eventId: int.parse(id));
        },
      ),
      GoRoute(
        path: '/my-tickets',
        builder: (context, state) => const MyTicketsScreen(),
      ),
      GoRoute(
        path: '/favorites',
        builder: (context, state) => const FavoritesScreen(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationScreen(),
      ),
      GoRoute(
        path: '/scanner',
        builder: (context, state) => const ScannerScreen(),
      ),
      GoRoute(
        path: '/staff-management',
        builder: (context, state) => const StaffManagementScreen(),
      ),
      GoRoute(
        path: '/event/:eventId/tiers/:tierId/seats',
        builder: (context, state) {
          final eventId = state.pathParameters['eventId']!;
          final tierId = state.pathParameters['tierId']!;
          return SeatSelectionScreen(
            eventId: int.parse(eventId),
            tierId: int.parse(tierId),
          );
        },
      ),
      // Deep link handler for payment callbacks
      GoRoute(
        path: '/payment/:status',
        builder: (context, state) {
          final status = state.pathParameters['status'];
          final purchaseId = state.uri.queryParameters['purchaseId'];
          final ref = state.uri.queryParameters['ref'];
          final reason = state.uri.queryParameters['reason'];

          // Handle payment result
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (status == 'success') {
              // Show success message and navigate to tickets
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Payment successful! Your tickets are ready.'),
                  backgroundColor: Colors.green,
                  duration: Duration(seconds: 3),
                ),
              );
              // Navigate to my tickets after a brief delay
              Future.delayed(const Duration(milliseconds: 500), () {
                if (context.mounted) {
                  context.go('/my-tickets');
                }
              });
            } else {
              // Show error message
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Payment failed: ${reason ?? "Unknown error"}'),
                  backgroundColor: Colors.red,
                  duration: const Duration(seconds: 4),
                ),
              );
              // Navigate to home
              Future.delayed(const Duration(milliseconds: 500), () {
                if (context.mounted) {
                  context.go('/home');
                }
              });
            }
          });

          // Return a temporary loading screen
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        },
      ),
    ],
    errorBuilder: (context, state) {
      return Scaffold(
        appBar: AppBar(title: const Text('Route Error')),
        body: Builder(
          builder: (context) => Center(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  const Text('Page not found', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Location: ${state.uri}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 12)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      // Use pushReplacement to avoid back button issues
                      context.go('/home');
                    },
                    child: const Text('Go Home'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    },
  );
}
