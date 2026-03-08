import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:ui' as ui;
import 'package:google_nav_bar/google_nav_bar.dart';
import 'package:mobile/features/events/services/event_service.dart';
import 'package:mobile/features/events/models/event.dart';
import 'package:mobile/features/profile/presentation/profile_screen.dart';
import 'package:mobile/features/events/presentation/search_screen.dart';
import 'package:mobile/features/events/models/category.dart';
import 'package:mobile/features/events/models/city.dart';
import 'package:mobile/features/tickets/presentation/my_tickets_screen.dart';
import 'package:mobile/features/events/presentation/notification_screen.dart';
import 'package:mobile/features/events/presentation/favorites_screen.dart';
import 'package:mobile/core/widgets/app_image.dart';
import 'package:mobile/core/widgets/offline_banner.dart';
import 'package:mobile/features/events/models/homepage_banner.dart';
import 'package:mobile/core/utils/error_handler.dart';
import 'package:mobile/features/profile/services/profile_service.dart';
import 'package:mobile/core/utils/avatar_image_provider.dart';

final selectedCategoryProvider = StateProvider<Category?>((ref) => null);
final selectedCityProvider = StateProvider<City?>((ref) => null);
final homeIndexProvider = StateProvider<int>((ref) => 0);

final filteredEventsProvider = FutureProvider<List<Event>>((ref) async {
  // Watch for auth changes
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  final category = ref.watch(selectedCategoryProvider);
  final city = ref.watch(selectedCityProvider);

  return service.getEvents(categoryId: category?.id, cityId: city?.id);
});

final recommendedMoviesProvider = FutureProvider.autoDispose<List<Event>>((
  ref,
) async {
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  final city = ref.watch(selectedCityProvider);
  return service.getRecommendedMovies(cityId: city?.id, limit: 12);
});

final bestEventsThisWeekProvider = FutureProvider.autoDispose<List<Event>>((
  ref,
) async {
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  final city = ref.watch(selectedCityProvider);
  return service.getBestEventsThisWeek(cityId: city?.id, limit: 10);
});

final trendingNowProvider = FutureProvider.autoDispose<List<Event>>((
  ref,
) async {
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  return service.getTrendingNow(limit: 10);
});

final personalizedPicksProvider = FutureProvider.autoDispose<List<Event>>((
  ref,
) async {
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  final city = ref.watch(selectedCityProvider);
  return service.getPersonalizedPicks(cityId: city?.id, limit: 10);
});

final upcomingAwardsProvider = FutureProvider.autoDispose<List<Event>>((
  ref,
) async {
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  final city = ref.watch(selectedCityProvider);
  return service.getUpcomingAwards(cityId: city?.id, limit: 10);
});

final workshopsShortCoursesProvider = FutureProvider.autoDispose<List<Event>>((
  ref,
) async {
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  final city = ref.watch(selectedCityProvider);
  return service.getWorkshopsShortCourses(cityId: city?.id, limit: 10);
});

final citySpotlightProvider = FutureProvider.autoDispose<List<Event>>((
  ref,
) async {
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  final city = ref.watch(selectedCityProvider);
  return service.getCitySpotlight(cityId: city?.id, limit: 10);
});

final lastMinuteTodayProvider = FutureProvider.autoDispose<List<Event>>((
  ref,
) async {
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  final city = ref.watch(selectedCityProvider);
  return service.getLastMinuteToday(cityId: city?.id, limit: 10);
});

final offersDealsProvider = FutureProvider.autoDispose<List<Event>>((
  ref,
) async {
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  final city = ref.watch(selectedCityProvider);
  return service.getOffersDeals(cityId: city?.id, limit: 10);
});

final newUpcomingExperiencesProvider = FutureProvider.autoDispose<List<Event>>((
  ref,
) async {
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  final city = ref.watch(selectedCityProvider);
  return service.getNewUpcomingExperiences(cityId: city?.id, limit: 10);
});

final homeCarouselProvider = FutureProvider<List<dynamic>>((ref) async {
  final service = ref.watch(eventServiceProvider);

  // 1. Fetch super admin created banners
  final adminBanners = await ref.watch(
    bannersProvider.future,
  ); // Assuming bannersProvider exists

  // 2. Fetch featured events
  final featuredEvents = await service.getEvents(featured: true);

  // Combine all items for the carousel
  final List<dynamic> combined = [...adminBanners, ...featuredEvents];

  // 3. Fallback if empty
  if (combined.isEmpty) {
    final allEvents = await service.getEvents();
    return allEvents.take(5).toList();
  }

  return combined;
});

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  late List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      const _HomeBody(),
      const FavoritesScreen(),
      const MyTicketsScreen(),
      const ProfileScreen(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selectedIndex = ref.watch(homeIndexProvider);
    final screenWidth = MediaQuery.of(context).size.width;
    final compactNav = screenWidth < 370;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF15131C)
          : const Color(0xFFF8F7FA),
      body: _pages[selectedIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1823) : Colors.white,
          boxShadow: [
            BoxShadow(blurRadius: 20, color: Colors.black.withOpacity(.1)),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: compactNav ? 10.0 : 15.0,
              vertical: 8,
            ),
            child: GNav(
              rippleColor: Colors.grey[300]!,
              hoverColor: Colors.grey[100]!,
              gap: compactNav ? 6 : 8,
              activeColor: const Color(0xFF8B5CF6),
              iconSize: compactNav ? 23 : 24,
              padding: EdgeInsets.symmetric(
                horizontal: compactNav ? 16 : 20,
                vertical: compactNav ? 11 : 12,
              ),
              duration: const Duration(milliseconds: 400),
              tabBackgroundColor: const Color(0xFF8B5CF6).withOpacity(0.1),
              color: isDark ? Colors.white54 : Colors.black54,
              tabs: [
                GButton(icon: Icons.home_rounded, text: 'home.nav_home'.tr()),
                GButton(
                  icon: Icons.favorite_rounded,
                  text: 'home.nav_favorites'.tr(),
                ),
                GButton(
                  icon: Icons.local_activity,
                  text: 'home.nav_tickets'.tr(),
                ),
                GButton(
                  icon: Icons.person_rounded,
                  text: 'home.nav_profile'.tr(),
                ),
              ],
              selectedIndex: selectedIndex,
              onTabChange: (index) =>
                  ref.read(homeIndexProvider.notifier).state = index,
            ),
          ),
        ),
      ),
    );
  }
}

class _HomeBody extends ConsumerWidget {
  const _HomeBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(filteredEventsProvider);
    final recommendedMoviesAsync = ref.watch(recommendedMoviesProvider);
    final bestEventsWeekAsync = ref.watch(bestEventsThisWeekProvider);
    final trendingNowAsync = ref.watch(trendingNowProvider);
    final personalizedPicksAsync = ref.watch(personalizedPicksProvider);
    final upcomingAwardsAsync = ref.watch(upcomingAwardsProvider);
    final workshopsAsync = ref.watch(workshopsShortCoursesProvider);
    final citySpotlightAsync = ref.watch(citySpotlightProvider);
    final lastMinuteTodayAsync = ref.watch(lastMinuteTodayProvider);
    final offersDealsAsync = ref.watch(offersDealsProvider);
    final newUpcomingExperiencesAsync = ref.watch(
      newUpcomingExperiencesProvider,
    );
    final selectedCity = ref.watch(selectedCityProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white60 : Colors.black54;

    return SafeArea(
      child: Column(
        children: [
          // Offline Banner
          const OfflineBanner(),

          // Main Content
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.refresh(filteredEventsProvider),
              child: CustomScrollView(
                slivers: [
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 24,
                    ),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        _buildHeader(context, ref, textColor, mutedColor),
                        const SizedBox(height: 24),
                        _buildSearchBar(
                          context,
                          isDark ? const Color(0xFF232030) : Colors.white,
                          mutedColor,
                        ),
                        const SizedBox(height: 24),
                        _buildCategories(ref, isDark),

                        const SizedBox(height: 32),
                        RichText(
                          text: TextSpan(
                            style: GoogleFonts.poppins(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              height: 1.2,
                              color: textColor,
                            ),
                            children: [
                              TextSpan(text: 'home.pulse_prefix'.tr()),
                              TextSpan(
                                text: 'home.pulse_suffix'.tr(),
                                style: TextStyle(
                                  color: const Color(0xFF8B5CF6),
                                  shadows: [
                                    Shadow(
                                      color: const Color(
                                        0xFF8B5CF6,
                                      ).withOpacity(0.4),
                                      blurRadius: 20,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                      ]),
                    ),
                  ),

                  // Content or Loading
                  eventsAsync.when(
                    data: (events) {
                      if (events.isEmpty) {
                        return SliverToBoxAdapter(
                          child: _buildEmptyState(
                            context,
                            ref,
                            textColor,
                            mutedColor,
                          ),
                        );
                      }

                      return SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            // First item could be Featured if we want, but simpler to just list trending for now similar to design
                            // Or we can separate sections again.
                            // Let's keep the Featured Carousel + Vertical list pattern
                            if (index == 0) {
                              // Featured Section (Horizontal)
                              final featured = events.take(3).toList();
                              final recommended = events.take(4).toList();
                              if (featured.isEmpty)
                                return const SizedBox.shrink();

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  SizedBox(
                                    height: 380,
                                    child: ListView.separated(
                                      physics: const BouncingScrollPhysics(),
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 20,
                                      ),
                                      scrollDirection: Axis.horizontal,
                                      itemCount: featured.length,
                                      separatorBuilder: (_, __) =>
                                          const SizedBox(width: 16),
                                      itemBuilder: (context, i) =>
                                          _FeaturedCard(event: featured[i]),
                                    ),
                                  ),
                                  const SizedBox(height: 32),
                                  recommendedMoviesAsync.when(
                                    data: (movies) => _MovieSection(
                                      movies: movies,
                                      isDark: isDark,
                                      textColor: textColor,
                                    ),
                                    loading: () => const SizedBox.shrink(),
                                    error: (_, __) => const SizedBox.shrink(),
                                  ),
                                  const SizedBox(height: 24),
                                  bestEventsWeekAsync.when(
                                    data: (events) => _BestEventsWeekSection(
                                      events: events,
                                      isDark: isDark,
                                      textColor: textColor,
                                    ),
                                    loading: () => const SizedBox.shrink(),
                                    error: (_, __) => const SizedBox.shrink(),
                                  ),
                                  const SizedBox(height: 24),
                                  trendingNowAsync.when(
                                    data: (events) => _TrendingNowSection(
                                      events: events,
                                      isDark: isDark,
                                      textColor: textColor,
                                    ),
                                    loading: () => const SizedBox.shrink(),
                                    error: (_, __) => const SizedBox.shrink(),
                                  ),
                                  const SizedBox(height: 24),
                                  personalizedPicksAsync.when(
                                    data: (events) => _PersonalizedPicksSection(
                                      events: events,
                                      isDark: isDark,
                                      textColor: textColor,
                                    ),
                                    loading: () => const SizedBox.shrink(),
                                    error: (_, __) => const SizedBox.shrink(),
                                  ),
                                  const SizedBox(height: 24),
                                  upcomingAwardsAsync.when(
                                    data: (events) => _UpcomingAwardsSection(
                                      events: events,
                                      isDark: isDark,
                                      textColor: textColor,
                                    ),
                                    loading: () => const SizedBox.shrink(),
                                    error: (_, __) => const SizedBox.shrink(),
                                  ),
                                  const SizedBox(height: 24),
                                  workshopsAsync.when(
                                    data: (events) =>
                                        _WorkshopsShortCoursesSection(
                                          events: events,
                                          isDark: isDark,
                                          textColor: textColor,
                                        ),
                                    loading: () => const SizedBox.shrink(),
                                    error: (_, __) => const SizedBox.shrink(),
                                  ),
                                  const SizedBox(height: 24),
                                  citySpotlightAsync.when(
                                    data: (events) => _CitySpotlightSection(
                                      events: events,
                                      isDark: isDark,
                                      textColor: textColor,
                                      selectedCityName: selectedCity?.name,
                                    ),
                                    loading: () => const SizedBox.shrink(),
                                    error: (_, __) => const SizedBox.shrink(),
                                  ),
                                  const SizedBox(height: 24),
                                  lastMinuteTodayAsync.when(
                                    data: (events) => _LastMinuteTodaySection(
                                      events: events,
                                      isDark: isDark,
                                      textColor: textColor,
                                    ),
                                    loading: () => const SizedBox.shrink(),
                                    error: (_, __) => const SizedBox.shrink(),
                                  ),
                                  const SizedBox(height: 24),
                                  offersDealsAsync.when(
                                    data: (events) => _OffersDealsSection(
                                      events: events,
                                      isDark: isDark,
                                      textColor: textColor,
                                    ),
                                    loading: () => const SizedBox.shrink(),
                                    error: (_, __) => const SizedBox.shrink(),
                                  ),
                                  const SizedBox(height: 24),
                                  newUpcomingExperiencesAsync.when(
                                    data: (events) =>
                                        _NewUpcomingExperiencesSection(
                                          events: events,
                                          isDark: isDark,
                                          textColor: textColor,
                                        ),
                                    loading: () => const SizedBox.shrink(),
                                    error: (_, __) => const SizedBox.shrink(),
                                  ),
                                  if (recommended.isNotEmpty) ...[
                                    Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 20,
                                      ),
                                      child: Text(
                                        'home.recommended'.tr(),
                                        style: GoogleFonts.poppins(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w600,
                                          color: textColor,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    ...recommended.map(
                                      (event) => Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                          vertical: 8,
                                        ),
                                        child: _VerticalEventCard(
                                          event: event,
                                          isDark: isDark,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 24),
                                  ],
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 20,
                                    ),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'home.all_events'.tr(),
                                          style: GoogleFonts.poppins(
                                            fontSize: 18,
                                            fontWeight: FontWeight.w600,
                                            color: textColor,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                              );
                            }

                            // Vertical List items (minus the featured ones to avoid dupes? or just all)
                            // For simplicity, showing all as vertical list below header
                            final event =
                                events[index - 1]; // Offset by 1 for the header
                            return Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 8,
                              ),
                              child: _TrendingCard(
                                event: event,
                                isDark: isDark,
                              ),
                            );
                          },
                          childCount:
                              events.length +
                              1, // +1 for the featured header section logic
                        ),
                      );
                    },
                    loading: () => SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) => _buildSkeletonCard(isDark),
                          childCount: 3,
                        ),
                      ),
                    ),
                    error: (e, s) => SliverToBoxAdapter(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.wifi_off_rounded,
                                size: 64,
                                color: Colors.grey,
                              ),
                              const SizedBox(height: 16),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 40,
                                ),
                                child: Text(
                                  ErrorMessageHandler.getReadableError(e),
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.poppins(
                                    color: textColor.withOpacity(0.7),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),
                              ElevatedButton(
                                onPressed: () =>
                                    ref.refresh(filteredEventsProvider),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF8B5CF6),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: Text("common.retry".tr()),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SliverToBoxAdapter(child: SizedBox(height: 80)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(
    BuildContext context,
    WidgetRef ref,
    Color textColor,
    Color mutedColor,
  ) {
    final citiesAsync = ref.watch(citiesProvider);
    final profileAsync = ref.watch(userProfileProvider);
    final avatarUrl = profileAsync.maybeWhen(
      data: (profile) => profile.avatarUrl,
      orElse: () => null,
    );
    final avatarImage = avatarImageProvider(avatarUrl);
    final selectedCity = ref.watch(selectedCityProvider);
    final allCities = City(id: 0, name: "home.all_cities".tr());

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            GestureDetector(
              onTap: () {
                ref.read(homeIndexProvider.notifier).state = 3;
              },
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF8B5CF6), width: 2),
                ),
                child: CircleAvatar(
                  radius: 20,
                  backgroundColor: Colors.grey,
                  backgroundImage: avatarImage,
                  child: avatarImage == null
                      ? const Icon(Icons.person, color: Colors.white)
                      : null,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "home.location".tr(),
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
                PopupMenuButton<City>(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF1D192B)
                      : Colors.white,
                  onSelected: (city) {
                    ref.read(selectedCityProvider.notifier).state = city.id == 0
                        ? null
                        : city;
                  },
                  itemBuilder: (context) {
                    return citiesAsync.when(
                      data: (cities) => [
                        PopupMenuItem<City>(
                          value: allCities,
                          child: Text("home.all_cities".tr()),
                        ),
                        ...cities.map(
                          (c) => PopupMenuItem<City>(
                            value: c,
                            child: Text(
                              c.name,
                              style: TextStyle(color: textColor),
                            ),
                          ),
                        ),
                      ],
                      loading: () => [],
                      error: (_, __) => [],
                    );
                  },
                  child: Row(
                    children: [
                      Text(
                        selectedCity?.name ?? "home.all_cities".tr(),
                        style: GoogleFonts.poppins(
                          color: textColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      const Icon(
                        Icons.keyboard_arrow_down,
                        color: Colors.grey,
                        size: 18,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
        GestureDetector(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const NotificationScreen()),
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF232030)
                      : Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: textColor.withOpacity(0.1)),
                  boxShadow: Theme.of(context).brightness == Brightness.dark
                      ? null
                      : [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                ),
                child: Icon(
                  Icons.notifications_none,
                  color: textColor,
                  size: 24,
                ),
              ),
              Consumer(
                builder: (context, ref, _) {
                  final unreadCount = ref.watch(
                    unreadNotificationsCountProvider,
                  );
                  if (unreadCount == 0) return const SizedBox.shrink();

                  return Positioned(
                    top: -2,
                    right: -2,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Color(0xFF8B5CF6),
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        unreadCount > 9 ? "9+" : unreadCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSearchBar(
    BuildContext context,
    Color cardColor,
    Color mutedColor,
  ) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const SearchScreen()),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        height: 52,
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            Icon(Icons.search, color: mutedColor),
            const SizedBox(width: 12),
            Text("home.search".tr(), style: TextStyle(color: mutedColor)),
          ],
        ),
      ),
    );
  }

  Widget _buildCategories(WidgetRef ref, bool isDark) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final selectedCategory = ref.watch(selectedCategoryProvider);

    return SizedBox(
      height: 38,
      child: categoriesAsync.when(
        data: (categories) {
          final allCategories = [
            Category(id: 0, name: "home.all_categories".tr()),
            ...categories,
          ];
          return ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: allCategories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final category = allCategories[index];
              // Check if selected (if null, 'All' (id 0) is default UI wise, but logically null)
              final isSelected =
                  selectedCategory?.id == category.id ||
                  (selectedCategory == null && category.id == 0);

              return GestureDetector(
                onTap: () {
                  ref.read(selectedCategoryProvider.notifier).state =
                      category.id == 0 ? null : category;
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? const LinearGradient(
                            colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                          )
                        : null,
                    color: isSelected
                        ? null
                        : (isDark ? const Color(0xFF2E2B3A) : Colors.grey[200]),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: const Color(0xFF8B5CF6).withOpacity(0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Center(
                    child: Text(
                      category.name,
                      style: TextStyle(
                        color: isSelected
                            ? Colors.white
                            : (isDark ? Colors.white70 : Colors.black87),
                        fontWeight: isSelected
                            ? FontWeight.bold
                            : FontWeight.w500,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: LinearProgressIndicator()),
        error: (_, __) => const SizedBox.shrink(),
      ),
    );
  }

  Widget _buildEmptyState(
    BuildContext context,
    WidgetRef ref,
    Color textColor,
    Color mutedColor,
  ) {
    final selectedCity = ref.watch(selectedCityProvider);
    final selectedCategory = ref.watch(selectedCategoryProvider);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.event_busy,
                size: 64,
                color: const Color(0xFF8B5CF6).withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              selectedCity != null || selectedCategory != null
                  ? "home.no_events_filtered".tr()
                  : "home.no_events".tr(),
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              selectedCity != null || selectedCategory != null
                  ? "home.clear_filters".tr()
                  : "home.no_events_suggestion".tr(),
              style: TextStyle(fontSize: 14, color: mutedColor, height: 1.5),
              textAlign: TextAlign.center,
            ),
            if (selectedCity != null || selectedCategory != null) ...[
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () {
                  ref.read(selectedCityProvider.notifier).state = null;
                  ref.read(selectedCategoryProvider.notifier).state = null;
                },
                icon: const Icon(Icons.clear_all),
                label: Text("home.clear_filters".tr()),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF8B5CF6),
                  side: const BorderSide(color: Color(0xFF8B5CF6)),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSkeletonCard(bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF232030) : Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1D192B) : Colors.grey[200],
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 100,
                  height: 12,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1D192B) : Colors.grey[200],
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  height: 16,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1D192B) : Colors.grey[200],
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: 120,
                  height: 12,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1D192B) : Colors.grey[200],
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FeaturedCard extends ConsumerWidget {
  final Event event;
  const _FeaturedCard({required this.event});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFavorited = ref
        .watch(localStorageProvider)
        .favorites
        .contains(event.id.toString());
    final engagementAsync = ref.watch(eventEngagementProvider(event.id));
    final likesCount = engagementAsync.maybeWhen(
      data: (engagement) => engagement.likesCount,
      orElse: () => event.likesCount,
    );
    final averageRating = engagementAsync.maybeWhen(
      data: (engagement) => engagement.averageRating,
      orElse: () => event.averageRating,
    );
    final ratingsCount = engagementAsync.maybeWhen(
      data: (engagement) => engagement.ratingsCount,
      orElse: () => event.ratingsCount,
    );

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        width: 280,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          color: Colors.grey[900],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            AppImage(
              imageUrl: event.coverImage,
              placeholder: 'https://picsum.photos/400/600',
              fit: BoxFit.cover,
            ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.transparent, Colors.black.withOpacity(0.9)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: const [0.5, 1.0],
                ),
              ),
            ),
            Positioned(
              top: 20,
              right: 20,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: BackdropFilter(
                  filter: ui.ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    color: Colors.white.withOpacity(0.1),
                    child: Text(
                      _formatDate(event.dateTime),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 20,
              left: 20,
              child: GestureDetector(
                onTap: () => ref
                    .read(localStorageProvider)
                    .toggleFavorite(event.id.toString()),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isFavorited ? Icons.favorite : Icons.favorite_border,
                    color: isFavorited ? const Color(0xFF8B5CF6) : Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: 20,
              left: 20,
              right: 20,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (event.titleTag != null) ...[
                    _eventTitleTagChip(event.titleTag, compact: true),
                    const SizedBox(height: 6),
                  ],
                  Text(
                    event.title,
                    maxLines: 2,
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(
                        Icons.favorite_rounded,
                        color: Color(0xFFF43F5E),
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$likesCount',
                        style: GoogleFonts.poppins(
                          color: Colors.white.withOpacity(0.85),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Icon(
                        Icons.star_rounded,
                        color: Color(0xFFFFB020),
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${averageRating.toStringAsFixed(1)} ($ratingsCount)',
                        style: GoogleFonts.poppins(
                          color: Colors.white.withOpacity(0.85),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          "Live • Music",
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.8),
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF8B5CF6).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: const Color(0xFF8B5CF6).withOpacity(0.5),
                          ),
                        ),
                        child: Text(
                          "${(event.tiers.isNotEmpty) ? event.tiers.first.price.toInt() : 0} ETB",
                          style: const TextStyle(
                            color: Color(0xFFD8B4FE),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String date) =>
      DateFormat('MMM d').format(DateTime.parse(date));
}

Color _eventTitleTagColor(String tag) {
  final normalized = tag.toLowerCase();
  if (normalized.contains('award')) return const Color(0xFF9333EA);
  if (normalized.contains('workshop') || normalized.contains('course')) {
    return const Color(0xFF0EA5E9);
  }
  if (normalized.contains('offer') || normalized.contains('deal')) {
    return const Color(0xFFF59E0B);
  }
  if (normalized.contains('movie') || normalized.contains('film')) {
    return const Color(0xFF7C3AED);
  }
  if (normalized.contains('music') || normalized.contains('concert')) {
    return const Color(0xFF10B981);
  }
  return const Color(0xFF8B5CF6);
}

Widget _eventTitleTagChip(String? tag, {bool compact = false}) {
  if (tag == null || tag.isEmpty) return const SizedBox.shrink();
  final color = _eventTitleTagColor(tag);
  return Container(
    padding: EdgeInsets.symmetric(
      horizontal: compact ? 7 : 8,
      vertical: compact ? 2 : 3,
    ),
    decoration: BoxDecoration(
      color: color.withOpacity(0.14),
      borderRadius: BorderRadius.circular(999),
    ),
    child: Text(
      tag.toUpperCase(),
      style: TextStyle(
        fontSize: compact ? 8 : 9,
        fontWeight: FontWeight.w700,
        color: color,
        letterSpacing: 0.3,
      ),
    ),
  );
}

class _MovieSection extends StatelessWidget {
  final List<Event> movies;
  final bool isDark;
  final Color textColor;

  const _MovieSection({
    required this.movies,
    required this.isDark,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    if (movies.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Recommended Movies',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: textColor,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF8B5CF6).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'PERSONALIZED',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                    color: const Color(0xFF8B5CF6),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 240,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            itemCount: movies.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final movie = movies[index];
              return _MovieCard(movie: movie, isDark: isDark);
            },
          ),
        ),
      ],
    );
  }
}

class _MovieCard extends StatelessWidget {
  final Event movie;
  final bool isDark;
  const _MovieCard({required this.movie, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final highlights = movie.movieHighlights.isNotEmpty
        ? movie.movieHighlights
        : _fallbackMovieHighlights(movie);

    return GestureDetector(
      onTap: () => context.push('/event/${movie.id}'),
      child: SizedBox(
        width: 140,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    AppImage(
                      imageUrl: movie.coverImage,
                      fit: BoxFit.cover,
                      placeholder: 'https://picsum.photos/200/300',
                    ),
                    if (movie.rating != null)
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            movie.rating!,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              movie.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white : Colors.black,
              ),
            ),
            if (movie.titleTag != null) ...[
              const SizedBox(height: 4),
              _eventTitleTagChip(movie.titleTag, compact: true),
            ],
            const SizedBox(height: 2),
            Text(
              "${movie.duration ?? 120} min • ${movie.venue}",
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                color: isDark ? Colors.white54 : Colors.black54,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              _formatDateTime(movie.dateTime),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                color: isDark
                    ? const Color(0xFFD8B4FE)
                    : const Color(0xFF7C3AED),
                fontWeight: FontWeight.w600,
              ),
            ),
            if (highlights.isNotEmpty) ...[
              const SizedBox(height: 5),
              SizedBox(
                height: 20,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: highlights.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 5),
                  itemBuilder: (context, index) {
                    return _moviePill(highlights[index]);
                  },
                ),
              ),
            ],
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 28,
              child: ElevatedButton(
                onPressed: () => context.push('/event/${movie.id}'),
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.zero,
                  elevation: 0,
                  backgroundColor: const Color(0xFF8B5CF6),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  'Ticket',
                  style: GoogleFonts.poppins(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDateTime(String dateTime) {
    final parsed = DateTime.tryParse(dateTime);
    if (parsed == null) return 'Date TBA';
    return DateFormat('MMM d, h:mm a').format(parsed);
  }

  List<String> _fallbackMovieHighlights(Event event) {
    final text = '${event.title} ${event.description}'.toLowerCase();
    final labels = <String>[];
    if (text.contains('premiere')) labels.add('Premiere');
    if (text.contains('festival')) labels.add('Film Festival');
    final numericRating = double.tryParse(event.rating ?? '');
    if (numericRating != null && numericRating >= 4) labels.add('Top Rated');
    if (labels.isEmpty) labels.add('New Release');
    return labels.take(2).toList();
  }

  Widget _moviePill(String label) {
    final color = switch (label) {
      'Top Rated' => const Color(0xFFF59E0B),
      'Premiere' => const Color(0xFF0EA5E9),
      'Film Festival' => const Color(0xFF16A34A),
      _ => const Color(0xFF8B5CF6),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

class _BestEventsWeekSection extends StatelessWidget {
  final List<Event> events;
  final bool isDark;
  final Color textColor;

  const _BestEventsWeekSection({
    required this.events,
    required this.isDark,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Best Events This Week',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'TRENDING',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF10B981),
                    letterSpacing: 1,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 170,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            itemCount: events.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, i) =>
                _BestEventsWeekCard(event: events[i], isDark: isDark),
          ),
        ),
      ],
    );
  }
}

class _BestEventsWeekCard extends StatelessWidget {
  final Event event;
  final bool isDark;

  const _BestEventsWeekCard({required this.event, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final cardColor = isDark ? const Color(0xFF1F1C2A) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final muted = isDark ? Colors.white60 : Colors.black54;
    final categoryName = event.category?.name ?? 'Event';
    final cityName = event.city?.name ?? 'City';

    String availabilityText;
    if (event.ticketsAvailable == null) {
      availabilityText = 'Open availability';
    } else if (event.ticketsAvailable == 0) {
      availabilityText = 'Sold out';
    } else {
      availabilityText = '${event.ticketsAvailable} tickets left';
    }

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        width: 280,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFEAE8F0),
          ),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: AppImage(
                imageUrl: event.coverImage,
                width: 80,
                height: 130,
                fit: BoxFit.cover,
                placeholder: 'https://picsum.photos/300/400',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (event.titleTag != null) ...[
                    _eventTitleTagChip(event.titleTag, compact: true),
                    const SizedBox(height: 5),
                  ],
                  Text(
                    event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    DateFormat(
                      'EEE, MMM d • h:mm a',
                    ).format(DateTime.parse(event.dateTime)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: muted),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _badge(categoryName, const Color(0xFF8B5CF6), isDark),
                      _badge(cityName, const Color(0xFF0EA5E9), isDark),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    availabilityText,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: event.ticketsAvailable == 0
                          ? const Color(0xFFEF4444)
                          : const Color(0xFF10B981),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _badge(String label, Color color, bool isDark) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 120),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.22 : 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

class _TrendingNowSection extends StatelessWidget {
  final List<Event> events;
  final bool isDark;
  final Color textColor;

  const _TrendingNowSection({
    required this.events,
    required this.isDark,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Trending Now',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'HOT & POPULAR',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFEF4444),
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 180,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: events.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              return _TrendingNowCard(event: events[index], isDark: isDark);
            },
          ),
        ),
      ],
    );
  }
}

class _TrendingNowCard extends StatelessWidget {
  final Event event;
  final bool isDark;

  const _TrendingNowCard({required this.event, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final cardColor = isDark ? const Color(0xFF1F1C2A) : Colors.white;
    final actionLabel = _isLivestream(event) ? 'Watch Livestream' : 'Book Now';
    final actionColor = _isLivestream(event)
        ? const Color(0xFF2563EB)
        : const Color(0xFF16A34A);

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        width: 310,
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFEAE8F0),
          ),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(
                left: Radius.circular(14),
              ),
              child: AppImage(
                imageUrl: event.coverImage,
                width: 110,
                height: double.infinity,
                fit: BoxFit.cover,
                placeholder: 'https://picsum.photos/400/500',
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (event.titleTag != null) ...[
                      _eventTitleTagChip(event.titleTag, compact: true),
                      const SizedBox(height: 5),
                    ],
                    Text(
                      event.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat(
                        'EEE, MMM d • h:mm a',
                      ).format(DateTime.parse(event.dateTime)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? Colors.white60 : Colors.black54,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        _chip(
                          event.city?.name ?? 'Ethiopia',
                          const Color(0xFF0EA5E9),
                          isDark,
                        ),
                        _chip(
                          event.category?.name ?? 'Event',
                          const Color(0xFF8B5CF6),
                          isDark,
                        ),
                      ],
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: actionColor.withOpacity(0.14),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        actionLabel,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: actionColor,
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _isLivestream(Event event) {
    if (event.livestreamAvailable == true) return true;
    final text = '${event.title} ${event.description}'.toLowerCase();
    return text.contains('livestream') ||
        text.contains('live stream') ||
        text.contains('virtual') ||
        text.contains('online');
  }

  Widget _chip(String text, Color color, bool isDark) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 110),
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.22 : 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _PersonalizedPicksSection extends StatelessWidget {
  final List<Event> events;
  final bool isDark;
  final Color textColor;

  const _PersonalizedPicksSection({
    required this.events,
    required this.isDark,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Recommended for You',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.14),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'PERSONALIZED',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFF59E0B),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 170,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: events.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, i) =>
                _PersonalizedPickCard(event: events[i], isDark: isDark),
          ),
        ),
      ],
    );
  }
}

class _PersonalizedPickCard extends StatelessWidget {
  final Event event;
  final bool isDark;

  const _PersonalizedPickCard({required this.event, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final muted = isDark ? Colors.white60 : Colors.black54;

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        width: 290,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F1C2A) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFEAE8F0),
          ),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: AppImage(
                imageUrl: event.coverImage,
                width: 88,
                height: 136,
                fit: BoxFit.cover,
                placeholder: 'https://picsum.photos/320/480',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (event.titleTag != null) ...[
                    _eventTitleTagChip(event.titleTag, compact: true),
                    const SizedBox(height: 4),
                  ],
                  Text(
                    event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    event.personalizedTag ?? 'Based on your interests',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: event.isExplorationPick == true
                          ? const Color(0xFF0EA5E9)
                          : const Color(0xFF10B981),
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${event.category?.name ?? 'Event'} • ${event.city?.name ?? 'Ethiopia'}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: muted, fontSize: 11),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color:
                          (event.isExplorationPick == true
                                  ? const Color(0xFF0EA5E9)
                                  : const Color(0xFF10B981))
                              .withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      event.isExplorationPick == true ? 'Explore' : 'Top Match',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: event.isExplorationPick == true
                            ? const Color(0xFF0EA5E9)
                            : const Color(0xFF10B981),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UpcomingAwardsSection extends StatelessWidget {
  final List<Event> events;
  final bool isDark;
  final Color textColor;

  const _UpcomingAwardsSection({
    required this.events,
    required this.isDark,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Upcoming Awards & Recognitions',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF9333EA).withOpacity(0.14),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'AWARDS HUB',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF9333EA),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 190,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: events.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, i) =>
                _UpcomingAwardCard(event: events[i], isDark: isDark),
          ),
        ),
      ],
    );
  }
}

class _UpcomingAwardCard extends StatelessWidget {
  final Event event;
  final bool isDark;

  const _UpcomingAwardCard({required this.event, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final muted = isDark ? Colors.white60 : Colors.black54;
    final availability = event.ticketsAvailable == null
        ? 'Open availability'
        : event.ticketsAvailable == 0
        ? 'Sold out'
        : '${event.ticketsAvailable} tickets left';

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        width: 320,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F1C2A) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFEAE8F0),
          ),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: AppImage(
                imageUrl: event.coverImage,
                width: 90,
                height: 150,
                fit: BoxFit.cover,
                placeholder: 'https://picsum.photos/340/500',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (event.titleTag != null) ...[
                    _eventTitleTagChip(event.titleTag, compact: true),
                    const SizedBox(height: 4),
                  ],
                  Text(
                    event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${event.category?.name ?? 'Awards'} • ${event.city?.name ?? 'Ethiopia'}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: muted),
                  ),
                  const SizedBox(height: 7),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      if (event.livestreamAvailable == true)
                        _pill('Livestream', const Color(0xFF2563EB), isDark),
                      if (event.nomineesInfoAvailable == true)
                        _pill('Nominees', const Color(0xFFF59E0B), isDark),
                      if (event.winnersInfoAvailable == true)
                        _pill('Winners', const Color(0xFF10B981), isDark),
                    ],
                  ),
                  const Spacer(),
                  Text(
                    availability,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: event.ticketsAvailable == 0
                          ? const Color(0xFFEF4444)
                          : const Color(0xFF10B981),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _pill(String label, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.22 : 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _WorkshopsShortCoursesSection extends StatelessWidget {
  final List<Event> events;
  final bool isDark;
  final Color textColor;

  const _WorkshopsShortCoursesSection({
    required this.events,
    required this.isDark,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Workshops & Short Courses',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF0EA5E9).withOpacity(0.14),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'TRENDING SKILLS',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0EA5E9),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 198,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: events.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, i) =>
                _WorkshopCourseCard(event: events[i], isDark: isDark),
          ),
        ),
      ],
    );
  }
}

class _WorkshopCourseCard extends StatelessWidget {
  final Event event;
  final bool isDark;

  const _WorkshopCourseCard({required this.event, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final muted = isDark ? Colors.white60 : Colors.black54;
    final date = DateTime.parse(event.dateTime);
    final seats = event.ticketsAvailable;
    final hasLimitedSeats = seats != null && seats > 0 && seats <= 30;
    final topics = event.workshopTopics.isNotEmpty
        ? event.workshopTopics
        : [event.category?.name ?? 'Workshop'];

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        width: 320,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F1C2A) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFEAE8F0),
          ),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: AppImage(
                imageUrl: event.coverImage,
                width: 92,
                height: 148,
                fit: BoxFit.cover,
                placeholder: 'https://picsum.photos/340/520',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (event.titleTag != null) ...[
                    _eventTitleTagChip(event.titleTag, compact: true),
                    const SizedBox(height: 4),
                  ],
                  Text(
                    event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    'Starts ${DateFormat('MMM d').format(date)}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF2563EB),
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    event.category?.name ?? 'Workshop',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: muted, fontSize: 11),
                  ),
                  const SizedBox(height: 6),
                  SizedBox(
                    height: 24,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: topics
                          .take(3)
                          .map(
                            (topic) => Padding(
                              padding: const EdgeInsets.only(right: 6),
                              child: _pill(topic, _topicColor(topic), isDark),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color:
                          (hasLimitedSeats
                                  ? const Color(0xFFEF4444)
                                  : const Color(0xFF10B981))
                              .withOpacity(0.14),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      seats == null
                          ? 'Open seats'
                          : seats == 0
                          ? 'Sold out'
                          : hasLimitedSeats
                          ? 'Limited seats: $seats'
                          : '$seats seats left',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: hasLimitedSeats
                            ? const Color(0xFFEF4444)
                            : const Color(0xFF10B981),
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _pill(String label, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.22 : 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Color _topicColor(String topic) {
    final text = topic.toLowerCase();
    if (text.contains('video') || text.contains('edit')) {
      return const Color(0xFF7C3AED);
    }
    if (text.contains('cook') || text.contains('culinary')) {
      return const Color(0xFFEA580C);
    }
    if (text.contains('market') || text.contains('seo')) {
      return const Color(0xFF0891B2);
    }
    if (text.contains('photo') || text.contains('design')) {
      return const Color(0xFF16A34A);
    }
    return const Color(0xFF8B5CF6);
  }
}

class _CitySpotlightSection extends StatelessWidget {
  final List<Event> events;
  final bool isDark;
  final Color textColor;
  final String? selectedCityName;

  const _CitySpotlightSection({
    required this.events,
    required this.isDark,
    required this.textColor,
    this.selectedCityName,
  });

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();
    final cityName =
        selectedCityName ?? events.first.city?.name ?? 'Addis Ababa';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Featured in $cityName',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF16A34A).withOpacity(0.14),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'CITY SPOTLIGHT',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF16A34A),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 178,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: events.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, i) =>
                _CitySpotlightCard(event: events[i], isDark: isDark),
          ),
        ),
      ],
    );
  }
}

class _CitySpotlightCard extends StatelessWidget {
  final Event event;
  final bool isDark;

  const _CitySpotlightCard({required this.event, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final muted = isDark ? Colors.white60 : Colors.black54;

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        width: 300,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F1C2A) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFEAE8F0),
          ),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(
                left: Radius.circular(14),
              ),
              child: AppImage(
                imageUrl: event.coverImage,
                width: 106,
                height: double.infinity,
                fit: BoxFit.cover,
                placeholder: 'https://picsum.photos/360/500',
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (event.titleTag != null) ...[
                      _eventTitleTagChip(event.titleTag, compact: true),
                      const SizedBox(height: 4),
                    ],
                    Text(
                      event.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat(
                        'EEE, MMM d • h:mm a',
                      ).format(DateTime.parse(event.dateTime)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 11, color: muted),
                    ),
                    const SizedBox(height: 7),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        _pill(
                          event.city?.name ?? 'City',
                          const Color(0xFF0EA5E9),
                          isDark,
                        ),
                        _pill(
                          event.category?.name ?? 'Event',
                          const Color(0xFF8B5CF6),
                          isDark,
                        ),
                      ],
                    ),
                    const Spacer(),
                    Text(
                      event.venue,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: muted,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _pill(String label, Color color, bool isDark) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 116),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.22 : 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 10,
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _LastMinuteTodaySection extends StatelessWidget {
  final List<Event> events;
  final bool isDark;
  final Color textColor;

  const _LastMinuteTodaySection({
    required this.events,
    required this.isDark,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  "Last-Minute / Today's Events",
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withOpacity(0.14),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'STARTS SOON',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFEF4444),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 174,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: events.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, i) =>
                _LastMinuteEventCard(event: events[i], isDark: isDark),
          ),
        ),
      ],
    );
  }
}

class _LastMinuteEventCard extends StatelessWidget {
  final Event event;
  final bool isDark;

  const _LastMinuteEventCard({required this.event, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final muted = isDark ? Colors.white60 : Colors.black54;
    final startsAt = DateTime.parse(event.dateTime);
    final hoursLeft =
        ((startsAt.millisecondsSinceEpoch -
                    DateTime.now().millisecondsSinceEpoch) /
                const Duration(hours: 1).inMilliseconds)
            .ceil();

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        width: 300,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F1C2A) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFEAE8F0),
          ),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(
                left: Radius.circular(14),
              ),
              child: AppImage(
                imageUrl: event.coverImage,
                width: 104,
                height: double.infinity,
                fit: BoxFit.cover,
                placeholder: 'https://picsum.photos/360/500',
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (event.titleTag != null) ...[
                      _eventTitleTagChip(event.titleTag, compact: true),
                      const SizedBox(height: 4),
                    ],
                    Text(
                      event.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('EEE, MMM d • h:mm a').format(startsAt),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 11, color: muted),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444).withOpacity(0.14),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        hoursLeft <= 0
                            ? 'Starting now'
                            : 'Starts in $hoursLeft h',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFEF4444),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OffersDealsSection extends StatelessWidget {
  final List<Event> events;
  final bool isDark;
  final Color textColor;

  const _OffersDealsSection({
    required this.events,
    required this.isDark,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Offers & Deals',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.14),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'DEALS LIVE',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFF59E0B),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 182,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: events.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, i) =>
                _OfferDealCard(event: events[i], isDark: isDark),
          ),
        ),
      ],
    );
  }
}

class _OfferDealCard extends StatelessWidget {
  final Event event;
  final bool isDark;

  const _OfferDealCard({required this.event, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final (tag, tagColor) = _resolveDealTag(event);

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        width: 296,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F1C2A) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFEAE8F0),
          ),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: AppImage(
                imageUrl: event.coverImage,
                width: 92,
                height: 158,
                fit: BoxFit.cover,
                placeholder: 'https://picsum.photos/360/520',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (event.titleTag != null) ...[
                    _eventTitleTagChip(event.titleTag, compact: true),
                    const SizedBox(height: 4),
                  ],
                  Text(
                    event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: tagColor.withOpacity(0.14),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      tag,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        color: tagColor,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    DateFormat(
                      'MMM d • h:mm a',
                    ).format(DateTime.parse(event.dateTime)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark ? Colors.white60 : Colors.black54,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  (String, Color) _resolveDealTag(Event event) {
    if (event.hasBundle == true) {
      return ('Bundle Deal', const Color(0xFF8B5CF6));
    }
    if (event.hasPartner == true) {
      return ('Partner Exclusive', const Color(0xFF0EA5E9));
    }
    if (event.hasLimitedTime == true) {
      return ('Limited Time', const Color(0xFFEF4444));
    }

    final backendTag = event.dealTag?.trim();
    if (backendTag != null && backendTag.isNotEmpty) {
      final upper = backendTag.toUpperCase();
      if (upper.contains('% OFF') || upper.contains('ETB OFF')) {
        return (backendTag, const Color(0xFFF59E0B));
      }
      return (backendTag, const Color(0xFFF59E0B));
    }

    return ('Special Offer', const Color(0xFFF59E0B));
  }
}

class _NewUpcomingExperiencesSection extends StatelessWidget {
  final List<Event> events;
  final bool isDark;
  final Color textColor;

  const _NewUpcomingExperiencesSection({
    required this.events,
    required this.isDark,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'New & Upcoming Experiences',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF8B5CF6).withOpacity(0.14),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'EARLY ACCESS',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF8B5CF6),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 188,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: events.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, i) =>
                _UpcomingExperienceCard(event: events[i], isDark: isDark),
          ),
        ),
      ],
    );
  }
}

class _UpcomingExperienceCard extends ConsumerWidget {
  final Event event;
  final bool isDark;

  const _UpcomingExperienceCard({required this.event, required this.isDark});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final muted = isDark ? Colors.white60 : Colors.black54;
    final desc = '${event.title} ${event.description}'.toLowerCase();

    final earlyBird =
        event.earlyBirdAvailable == true ||
        desc.contains('early bird') ||
        desc.contains('early-bird');
    final preReg =
        event.preRegistrationAvailable == true ||
        desc.contains('pre-registration') ||
        desc.contains('pre registration') ||
        desc.contains('register now');
    final reminder =
        event.reminderAvailable == true ||
        desc.contains('reminder') ||
        desc.contains('notify');
    final preRegistered = event.userPreRegistered == true;
    final reminderSubscribed = event.userReminderSubscribed == true;

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        width: 312,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F1C2A) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFEAE8F0),
          ),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: AppImage(
                imageUrl: event.coverImage,
                width: 92,
                height: 164,
                fit: BoxFit.cover,
                placeholder: 'https://picsum.photos/360/520',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (event.titleTag != null) ...[
                    _eventTitleTagChip(event.titleTag, compact: true),
                    const SizedBox(height: 4),
                  ],
                  Text(
                    event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    DateFormat(
                      'MMM d • h:mm a',
                    ).format(DateTime.parse(event.dateTime)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: muted),
                  ),
                  const SizedBox(height: 7),
                  _engagementMiniRow(
                    likesCount: event.likesCount,
                    averageRating: event.averageRating,
                    ratingsCount: event.ratingsCount,
                    textColor: muted,
                  ),
                  const SizedBox(height: 7),
                  SizedBox(
                    height: 24,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        if (earlyBird)
                          _chip('Early Bird', const Color(0xFF8B5CF6), isDark),
                        if (earlyBird && (preReg || reminder))
                          const SizedBox(width: 6),
                        if (preReg)
                          _chip(
                            preRegistered ? 'Registered' : 'Pre-Register',
                            const Color(0xFF0EA5E9),
                            isDark,
                            onTap: preRegistered
                                ? null
                                : () => _handlePreRegister(context, ref),
                          ),
                        if (preReg && reminder) const SizedBox(width: 6),
                        if (reminder)
                          _chip(
                            reminderSubscribed
                                ? 'Reminder Set'
                                : 'Set Reminder',
                            const Color(0xFF16A34A),
                            isDark,
                            onTap: reminderSubscribed
                                ? null
                                : () => _handleReminderSubscribe(context, ref),
                          ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  Text(
                    event.category?.name ?? 'Experience',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: muted,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handlePreRegister(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(eventServiceProvider).preRegisterEvent(event.id);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pre-registration successful')),
      );
      ref.invalidate(newUpcomingExperiencesProvider);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Pre-registration failed: $e')));
    }
  }

  Future<void> _handleReminderSubscribe(
    BuildContext context,
    WidgetRef ref,
  ) async {
    try {
      await ref.read(eventServiceProvider).subscribeEventReminder(event.id);
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Reminder enabled')));
      ref.invalidate(newUpcomingExperiencesProvider);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Reminder setup failed: $e')));
    }
  }

  Widget _chip(String text, Color color, bool isDark, {VoidCallback? onTap}) {
    final chip = Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.22 : 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );

    if (onTap == null) return chip;
    return GestureDetector(onTap: onTap, child: chip);
  }
}

class _TrendingCard extends ConsumerWidget {
  final Event event;
  final bool isDark;
  const _TrendingCard({required this.event, required this.isDark});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFavorited = ref
        .watch(localStorageProvider)
        .favorites
        .contains(event.id.toString());

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF232030) : Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AppImage(
                imageUrl: event.coverImage,
                width: 80,
                height: 80,
                placeholder: 'https://picsum.photos/200',
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "TODAY • ${DateFormat('h:mm a').format(DateTime.parse(event.dateTime))}",
                    style: const TextStyle(
                      color: Color(0xFF8B5CF6),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (event.titleTag != null) ...[
                    const SizedBox(height: 4),
                    _eventTitleTagChip(event.titleTag, compact: true),
                  ],
                  Text(
                    event.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white : Colors.black,
                    ),
                  ),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on,
                        size: 14,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          event.venue,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.grey,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  _engagementMiniRow(
                    likesCount: event.likesCount,
                    averageRating: event.averageRating,
                    ratingsCount: event.ratingsCount,
                    textColor: Colors.grey,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                SizedBox(
                  width: 64,
                  child: Text(
                    "${(event.tiers.isNotEmpty) ? event.tiers.first.price.toInt() : 0} ETB",
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.end,
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                GestureDetector(
                  onTap: () => ref
                      .read(localStorageProvider)
                      .toggleFavorite(event.id.toString()),
                  child: Icon(
                    isFavorited ? Icons.favorite : Icons.favorite_border,
                    color: isFavorited ? const Color(0xFF8B5CF6) : Colors.grey,
                    size: 20,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _VerticalEventCard extends ConsumerWidget {
  final Event event;
  final bool isDark;

  const _VerticalEventCard({required this.event, required this.isDark});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFavorited = ref
        .watch(localStorageProvider)
        .favorites
        .contains(event.id.toString());
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white60 : Colors.black54;

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF232030) : Colors.white,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(18),
              ),
              child: AppImage(
                imageUrl: event.coverImage,
                width: double.infinity,
                height: 160,
                fit: BoxFit.cover,
                placeholder: 'https://picsum.photos/600/400',
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (event.titleTag != null) ...[
                              _eventTitleTagChip(event.titleTag, compact: true),
                              const SizedBox(height: 4),
                            ],
                            Text(
                              event.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: textColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: () => ref
                            .read(localStorageProvider)
                            .toggleFavorite(event.id.toString()),
                        child: Icon(
                          isFavorited ? Icons.favorite : Icons.favorite_border,
                          color: isFavorited
                              ? const Color(0xFF8B5CF6)
                              : mutedColor,
                          size: 20,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    DateFormat(
                      'EEE, MMM d • h:mm a',
                    ).format(DateTime.parse(event.dateTime)),
                    style: TextStyle(
                      color: const Color(0xFF8B5CF6),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on,
                        size: 14,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          event.venue,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: mutedColor, fontSize: 12),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "${(event.tiers.isNotEmpty) ? event.tiers.first.price.toInt() : 0} ETB",
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold,
                          color: textColor,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  _engagementMiniRow(
                    likesCount: event.likesCount,
                    averageRating: event.averageRating,
                    ratingsCount: event.ratingsCount,
                    textColor: mutedColor,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Widget _engagementMiniRow({
  required int likesCount,
  required double averageRating,
  required int ratingsCount,
  required Color textColor,
}) {
  return Row(
    children: [
      const Icon(Icons.favorite_rounded, color: Color(0xFFF43F5E), size: 13),
      const SizedBox(width: 4),
      Text(
        '$likesCount',
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
      const SizedBox(width: 10),
      const Icon(Icons.star_rounded, color: Color(0xFFFFB020), size: 13),
      const SizedBox(width: 4),
      Text(
        '${averageRating.toStringAsFixed(1)} ($ratingsCount)',
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    ],
  );
}

class _FeaturedBanners extends ConsumerStatefulWidget {
  const _FeaturedBanners();

  @override
  ConsumerState<_FeaturedBanners> createState() => _FeaturedBannersState();
}

class _FeaturedBannersState extends ConsumerState<_FeaturedBanners> {
  late PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.9);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final carouselAsync = ref.watch(homeCarouselProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return carouselAsync.when(
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();

        return Column(
          children: [
            SizedBox(
              height: 180,
              child: Stack(
                children: [
                  PageView.builder(
                    controller: _pageController,
                    itemCount: items.length,
                    onPageChanged: (index) =>
                        setState(() => _currentPage = index),
                    itemBuilder: (context, index) {
                      final item = items[index];
                      if (item is Event) {
                        return _buildEventBannerCard(item, isDark);
                      } else if (item is HomepageBanner) {
                        return _buildPromotionBannerCard(item, isDark);
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                  if (items.length > 1) ...[
                    Positioned(
                      left: 8,
                      top: 0,
                      bottom: 0,
                      child: Center(
                        child: _BannerNavButton(
                          icon: Icons.chevron_left,
                          onTap: () {
                            final prev = (_currentPage - 1) < 0
                                ? items.length - 1
                                : _currentPage - 1;
                            _pageController.animateToPage(
                              prev,
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeOut,
                            );
                          },
                        ),
                      ),
                    ),
                    Positioned(
                      right: 8,
                      top: 0,
                      bottom: 0,
                      child: Center(
                        child: _BannerNavButton(
                          icon: Icons.chevron_right,
                          onTap: () {
                            final next = (_currentPage + 1) >= items.length
                                ? 0
                                : _currentPage + 1;
                            _pageController.animateToPage(
                              next,
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeOut,
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                items.length,
                (index) => AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  height: 6,
                  width: _currentPage == index ? 24 : 6,
                  decoration: BoxDecoration(
                    color: _currentPage == index
                        ? const Color(0xFF8B5CF6)
                        : (isDark ? Colors.white24 : Colors.black12),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ),
          ],
        );
      },
      loading: () => Container(
        height: 180,
        margin: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05),
          borderRadius: BorderRadius.circular(24),
        ),
        child: const Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildEventBannerCard(Event event, bool isDark) {
    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            children: [
              // Cover Image
              AppImage(
                imageUrl: event.coverImage,
                height: 180,
                width: double.infinity,
                placeholder: 'https://picsum.photos/800/400',
              ),

              // Gradient Overlay
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black.withOpacity(0.8)],
                  ),
                ),
              ),

              // Content
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF8B5CF6),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  "FEATURED",
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 6),
                              if (event.titleTag != null) ...[
                                _eventTitleTagChip(
                                  event.titleTag,
                                  compact: true,
                                ),
                                const SizedBox(height: 4),
                              ],
                              Text(
                                event.title,
                                style: GoogleFonts.poppins(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.location_on,
                                    color: Colors.white70,
                                    size: 12,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    event.venue,
                                    style: GoogleFonts.poppins(
                                      color: Colors.white70,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white24),
                          ),
                          child: ClipRRect(
                            child: BackdropFilter(
                              filter: ui.ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                              child: Text(
                                "${(event.tiers.isNotEmpty) ? event.tiers.first.price.toInt() : 0} ETB",
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPromotionBannerCard(HomepageBanner banner, bool isDark) {
    return GestureDetector(
      onTap: () {
        if (banner.linkUrl != null && banner.linkUrl!.startsWith('/')) {
          context.push(banner.linkUrl!);
        } else if (banner.linkUrl != null) {
          // Handle external link with url_launcher if needed
        }
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            children: [
              AppImage(
                imageUrl: banner.imageUrl,
                height: 180,
                width: double.infinity,
                placeholder: 'https://picsum.photos/800/400',
              ),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black.withOpacity(0.7)],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Center(
                  child: SingleChildScrollView(
                    physics: const NeverScrollableScrollPhysics(),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        if (banner.title != null)
                          Text(
                            banner.title!,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        if (banner.subtitle != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            banner.subtitle!,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BannerNavButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _BannerNavButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 36,
        width: 36,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.35),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white24),
        ),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
    );
  }
}
