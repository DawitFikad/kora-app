import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'dart:ui' as ui; 
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_nav_bar/google_nav_bar.dart';
import 'package:mobile/features/auth/services/auth_service.dart';
import 'package:mobile/features/events/services/event_service.dart';
import 'package:mobile/features/events/models/event.dart';
import 'package:mobile/features/profile/presentation/profile_screen.dart';
import 'package:mobile/features/events/presentation/search_screen.dart';
import 'package:mobile/features/events/models/category.dart';
import 'package:mobile/features/events/models/city.dart';
import 'package:mobile/features/tickets/presentation/my_tickets_screen.dart';
import 'package:mobile/features/events/presentation/notification_screen.dart';
import 'package:mobile/features/events/presentation/favorites_screen.dart';
import 'package:mobile/features/events/presentation/event_details_screen.dart';
import 'package:mobile/core/widgets/app_image.dart';

final selectedCategoryProvider = StateProvider<Category?>((ref) => null);
final selectedCityProvider = StateProvider<City?>((ref) => null);

final filteredEventsProvider = FutureProvider<List<Event>>((ref) async {
  // Watch for auth changes
  ref.watch(authTokenProvider);
  final service = ref.watch(eventServiceProvider);
  final category = ref.watch(selectedCategoryProvider);
  final city = ref.watch(selectedCityProvider);
  
  return service.getEvents(
    categoryId: category?.id,
    cityId: city?.id,
  );
});

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _selectedIndex = 0;
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
    
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA),
      body: _pages[_selectedIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1823) : Colors.white,
          boxShadow: [
            BoxShadow(
              blurRadius: 20,
              color: Colors.black.withOpacity(.1),
            )
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 15.0, vertical: 8),
            child: GNav(
              rippleColor: Colors.grey[300]!,
              hoverColor: Colors.grey[100]!,
              gap: 8,
              activeColor: const Color(0xFF8B5CF6),
              iconSize: 24,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              duration: const Duration(milliseconds: 400),
              tabBackgroundColor: const Color(0xFF8B5CF6).withOpacity(0.1),
              color: isDark ? Colors.white54 : Colors.black54,
              tabs: const [
                GButton(icon: Icons.home_rounded, text: 'Home'),
                GButton(icon: Icons.favorite_rounded, text: 'Favorites'),
                GButton(icon: Icons.local_activity, text: 'MyTickets'),
                GButton(icon: Icons.person_rounded, text: 'Profile'),
              ],
              selectedIndex: _selectedIndex,
              onTabChange: (index) => setState(() => _selectedIndex = index),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white60 : Colors.black54;

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async => ref.refresh(filteredEventsProvider),
        child: CustomScrollView(
          slivers: [
             SliverPadding(
               padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
               sliver: SliverList(
                 delegate: SliverChildListDelegate([
                    _buildHeader(context, ref, textColor, mutedColor),
                    const SizedBox(height: 24),
                    _buildSearchBar(context, isDark ? const Color(0xFF232030) : Colors.white, mutedColor),
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
                          const TextSpan(text: 'Discover the pulse of \n'),
                          TextSpan(
                            text: 'Events.',
                            style: TextStyle(
                              color: const Color(0xFF8B5CF6),
                              shadows: [
                                Shadow(
                                  color: const Color(0xFF8B5CF6).withOpacity(0.4),
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
                     child: Center(
                       child: Padding(
                         padding: const EdgeInsets.all(32.0),
                         child: Text("No events found", style: TextStyle(color: mutedColor)),
                       ),
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
                          if (featured.isEmpty) return const SizedBox.shrink();

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SizedBox(
                                height: 380,
                                child: ListView.separated(
                                  physics: const BouncingScrollPhysics(),
                                  padding: const EdgeInsets.symmetric(horizontal: 20),
                                  scrollDirection: Axis.horizontal,
                                  itemCount: featured.length,
                                  separatorBuilder: (_, __) => const SizedBox(width: 16),
                                  itemBuilder: (context, i) => _FeaturedCard(event: featured[i]),
                                ),
                              ),
                              const SizedBox(height: 32),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Trending Now',
                                      style: GoogleFonts.poppins(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w600,
                                        color: textColor,
                                      ),
                                    ),
                                    TextButton(
                                      onPressed: () {},
                                      child: Text(
                                        'See All',
                                        style: TextStyle(color: const Color(0xFF8B5CF6).withOpacity(0.8)),
                                      ),
                                    )
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],
                          );
                        }
                        
                        // Vertical List items (minus the featured ones to avoid dupes? or just all)
                        // For simplicity, showing all as vertical list below header
                        final event = events[index - 1]; // Offset by 1 for the header
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                          child: _TrendingCard(event: event, isDark: isDark),
                        );
                     },
                     childCount: events.length + 1, // +1 for the featured header section logic
                   ),
                 );
               },
               loading: () => const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator())),
               error: (e, s) => SliverToBoxAdapter(child: Center(child: Text("Error: $e"))),
             ),
             
             const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref, Color textColor, Color mutedColor) {
    final citiesAsync = ref.watch(citiesProvider);
    final selectedCity = ref.watch(selectedCityProvider);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            GestureDetector(
              onTap: () {
                final state = context.findAncestorStateOfType<_HomeScreenState>();
                state?.setState(() => state._selectedIndex = 3);
              },
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF8B5CF6), width: 2),
                ),
                child: const CircleAvatar(
                  radius: 20,
                  backgroundColor: Colors.grey,
                  child: Icon(Icons.person, color: Colors.white),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("Location", style: TextStyle(color: Colors.grey, fontSize: 12)),
                PopupMenuButton<City>(
                  color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1D192B) : Colors.white,
                  onSelected: (city) {
                    ref.read(selectedCityProvider.notifier).state = city;
                  },
                  itemBuilder: (context) {
                    return citiesAsync.when(
                      data: (cities) => [
                        const PopupMenuItem<City>(
                           value: null, 
                           child: Text("All Cities"),
                        ),
                        ...cities.map((c) => PopupMenuItem<City>(
                          value: c,
                          child: Text(c.name, style: TextStyle(color: textColor)),
                        ))
                      ],
                      loading: () => [],
                      error: (_,__) => [],
                    );
                  },
                  child: Row(
                    children: [
                      Text(
                        selectedCity?.name ?? "All Cities",
                        style: GoogleFonts.poppins(
                          color: textColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      const Icon(Icons.keyboard_arrow_down, color: Colors.grey, size: 18),
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
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF232030) : Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: textColor.withOpacity(0.1)),
              boxShadow: Theme.of(context).brightness == Brightness.dark ? null : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ],
            ),
            child: Icon(Icons.notifications_none, color: textColor, size: 24),
          ),
        ),
      ],
    );
  }

  Widget _buildSearchBar(BuildContext context, Color cardColor, Color mutedColor) {
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
            Text(
              "Search events, artists...",
              style: TextStyle(color: mutedColor),
            ),
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
           final allCategories = [Category(id: 0, name: "All"), ...categories];
           return ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: allCategories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final category = allCategories[index];
              // Check if selected (if null, 'All' (id 0) is default UI wise, but logically null)
              final isSelected = selectedCategory?.id == category.id || (selectedCategory == null && category.id == 0);
              
              return GestureDetector(
                onTap: () {
                   ref.read(selectedCategoryProvider.notifier).state = category.id == 0 ? null : category;
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: isSelected 
                        ? const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)])
                        : null,
                    color: isSelected ? null : (isDark ? const Color(0xFF2E2B3A) : Colors.grey[200]),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: isSelected ? [
                      BoxShadow(
                        color: const Color(0xFF8B5CF6).withOpacity(0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      )
                    ] : null,
                  ),
                  child: Center(
                    child: Text(
                      category.name,
                      style: TextStyle(
                        color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
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
        error: (_,__) => const SizedBox.shrink()
      ),
    );
  }
}

class _FeaturedCard extends ConsumerWidget {
  final Event event;
  const _FeaturedCard({required this.event});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFavorited = ref.watch(localStorageProvider).favorites.contains(event.id.toString());

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
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    color: Colors.white.withOpacity(0.1),
                    child: Text(
                      _formatDate(event.dateTime),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 20,
              left: 20,
              child: GestureDetector(
                onTap: () => ref.read(localStorageProvider).toggleFavorite(event.id.toString()),
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
                  Text(
                    event.title,
                    maxLines: 2,
                    style: GoogleFonts.poppins(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Live • Music", style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF8B5CF6).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.5)),
                        ),
                        child: Text(
                          "${(event.tiers.isNotEmpty) ? event.tiers.first.price.toInt() : 0} ETB", 
                          style: const TextStyle(color: Color(0xFFD8B4FE), fontWeight: FontWeight.bold, fontSize: 12),
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

  String _formatDate(String date) => DateFormat('MMM d').format(DateTime.parse(date));
}

class _TrendingCard extends ConsumerWidget {
  final Event event;
  final bool isDark;
  const _TrendingCard({required this.event, required this.isDark});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFavorited = ref.watch(localStorageProvider).favorites.contains(event.id.toString());

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
                    style: const TextStyle(color: Color(0xFF8B5CF6), fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    event.title,
                    maxLines: 1,
                    style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600, color: isDark ? Colors.white : Colors.black),
                  ),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(event.venue, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
            Text(
              "${(event.tiers.isNotEmpty) ? event.tiers.first.price.toInt() : 0} ETB", 
              style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => ref.read(localStorageProvider).toggleFavorite(event.id.toString()),
              child: Icon(
                isFavorited ? Icons.favorite : Icons.favorite_border,
                color: isFavorited ? const Color(0xFF8B5CF6) : Colors.grey,
                size: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
