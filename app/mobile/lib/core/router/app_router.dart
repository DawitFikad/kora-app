import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/login_screen.dart';

import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/events/presentation/home_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../storage/local_storage.dart';

import '../../features/events/presentation/event_details_screen.dart';
import '../../features/tickets/presentation/my_tickets_screen.dart';
import '../../features/events/presentation/favorites_screen.dart';
import '../../features/events/presentation/notification_screen.dart';
import '../../features/scanner/presentation/scanner_screen.dart';
import '../../features/scanner/presentation/staff_management_screen.dart';
import '../../features/events/presentation/seat_selection_screen.dart';

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
    ],
  );
}
