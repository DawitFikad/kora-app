import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/features/events/models/event.dart';
import 'package:mobile/features/events/services/event_service.dart';
import 'package:mobile/core/widgets/app_image.dart';
import 'package:mobile/core/providers.dart';
import 'package:go_router/go_router.dart';
import 'home_screen.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // In a real app, you might have a dedicated favorites provider
    // For now, let's filter the main events provider or use mock data
    final eventsAsync = ref.watch(eventsProvider);
    final storage = ref.watch(localStorageProvider);
    final favoriteIds = storage.favorites;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final backgroundColor = isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA);

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Navigator.canPop(context) 
            ? IconButton(
                icon: Icon(Icons.arrow_back, color: textColor),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        title: Text(
          "favorites.title".tr(),
          style: GoogleFonts.poppins(
            color: textColor,
            fontWeight: FontWeight.bold,
            fontSize: 24,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.more_horiz, color: textColor),
            onPressed: () {},
          ),
        ],
      ),
      body: eventsAsync.when(
        data: (events) {
          final favoriteEvents = events.where((e) => favoriteIds.contains(e.id.toString())).toList();

          if (favoriteEvents.isEmpty) {
            return _buildEmptyState(context, ref, isDark, textColor);
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            itemCount: favoriteEvents.length,
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: _FavoriteCard(event: favoriteEvents[index]),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6))),
        error: (err, stack) => Center(child: Text("${"common.error".tr()}: $err", style: const TextStyle(color: Colors.red))),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, WidgetRef ref, bool isDark, Color textColor) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1D192B) : Colors.grey[200],
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.favorite_border_rounded, size: 64, color: textColor.withOpacity(0.1)),
          ),
          const SizedBox(height: 24),
          Text(
            "favorites.empty_title".tr(),
            style: GoogleFonts.poppins(
              color: textColor,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "favorites.empty_desc".tr(),
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              color: textColor.withOpacity(0.5),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {
              ref.read(homeIndexProvider.notifier).state = 0;
              context.go('/home');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8B5CF6),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: Text("favorites.explore_btn".tr()),
          ),
        ],
      ),
    );
  }
}

class _FavoriteCard extends ConsumerWidget {
  final Event event;
  const _FavoriteCard({required this.event});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? const Color(0xFF1D192B) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final eventDate = DateTime.parse(event.dateTime);

    return GestureDetector(
      onTap: () {
          // Navigate to details
           context.push('/event/${event.id}');
      },
      child: Container(
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(24),
          boxShadow: isDark ? null : [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  child: AppImage(
                    imageUrl: event.coverImage,
                    height: 180,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                Positioned(
                  top: 16,
                  right: 16,
                  child: GestureDetector(
                    onTap: () => ref.read(localStorageProvider).toggleFavorite(event.id.toString()),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.favorite, color: Color(0xFF8B5CF6), size: 20),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          event.title,
                          style: GoogleFonts.poppins(
                            color: textColor,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        // Display price range or base price
                        (event.tiers.isNotEmpty) ? "${event.tiers.first.price} ETB" : "favorites.free".tr(),
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF8B5CF6),
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.calendar_today, color: textColor.withOpacity(0.4), size: 14),
                      const SizedBox(width: 6),
                      Text(
                        "${DateFormat('E, MMM d').format(eventDate)} • ${DateFormat('h:mm a').format(eventDate)}",
                        style: GoogleFonts.poppins(color: textColor.withOpacity(0.4), fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined, color: textColor.withOpacity(0.4), size: 14),
                      const SizedBox(width: 6),
                      Text(
                        event.venue,
                        style: GoogleFonts.poppins(color: textColor.withOpacity(0.4), fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                              ref.read(localStorageProvider).toggleFavorite(event.id.toString());
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: textColor,
                            side: BorderSide(color: textColor.withOpacity(0.1)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text("favorites.remove".tr()),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                             context.push('/event/${event.id}');
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF8B5CF6),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text("favorites.buy_ticket".tr()),
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
}
