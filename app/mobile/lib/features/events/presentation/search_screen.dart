import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/features/events/services/event_service.dart';
import 'package:mobile/features/events/models/event.dart';
import 'package:mobile/core/widgets/app_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/utils/error_handler.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = "";

  bool _isEventUnavailableForBooking(Event event) {
    final status = (event.status ?? '').toUpperCase();
    final eventDate = DateTime.tryParse(event.dateTime);
    final isCompletedByStatus = status == 'COMPLETED' || status == 'CANCELLED';
    final isCompletedByTime =
        eventDate != null && DateTime.now().isAfter(eventDate);
    final isSoldOut =
        event.tiers.isNotEmpty && event.tiers.every((t) => t.available <= 0);
    return isCompletedByStatus || isCompletedByTime || isSoldOut;
  }

  Future<void> _openEventWithAvailabilityGuard(Event event) async {
    if (!_isEventUnavailableForBooking(event)) {
      context.push('/event/${event.id}');
      return;
    }

    final status = (event.status ?? '').toUpperCase();
    final completed = status == 'COMPLETED' || status == 'CANCELLED';
    final message = completed
        ? 'Sorry, this event is already completed and cannot be booked.'
        : 'Sorry, this event is sold out and cannot be booked.';

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1D192B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Sorry', style: TextStyle(color: Colors.white)),
        content: Text(
          message,
          style: const TextStyle(color: Colors.white70, height: 1.35),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK', style: TextStyle(color: Colors.white70)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // eventsProvider is imported from event_service.dart
    final eventsAsync = ref.watch(eventsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white60 : Colors.black54;
    final cardColor = isDark ? const Color(0xFF232030) : Colors.white;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF15131C)
          : const Color(0xFFF8F7FA),
      body: SafeArea(
        child: Column(
          children: [
            // Search Header
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          Icons.chevron_left,
                          color: textColor,
                          size: 28,
                        ),
                        onPressed: () => context.pop(),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "search.title".tr(),
                        style: GoogleFonts.poppins(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: textColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    height: 56,
                    decoration: BoxDecoration(
                      color: cardColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.05)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.search, color: mutedColor),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            onChanged: (val) =>
                                setState(() => _searchQuery = val),
                            style: TextStyle(color: textColor),
                            decoration: InputDecoration(
                              hintText: "search.hint".tr(),
                              hintStyle: TextStyle(color: mutedColor),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                        if (_searchQuery.isNotEmpty)
                          IconButton(
                            icon: Icon(
                              Icons.clear,
                              color: mutedColor,
                              size: 20,
                            ),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = "");
                            },
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Results
            Expanded(
              child: eventsAsync.when(
                data: (events) {
                  final filteredEvents = events
                      .where(
                        (e) =>
                            e.title.toLowerCase().contains(
                              _searchQuery.toLowerCase(),
                            ) ||
                            e.venue.toLowerCase().contains(
                              _searchQuery.toLowerCase(),
                            ),
                      )
                      .toList();

                  if (filteredEvents.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search_off, size: 64, color: mutedColor),
                          const SizedBox(height: 16),
                          Text(
                            "search.no_results".tr(),
                            style: TextStyle(color: mutedColor, fontSize: 16),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 10,
                    ),
                    itemCount: filteredEvents.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final event = filteredEvents[index];
                      return _SearchResultCard(
                        event: event,
                        isDark: isDark,
                        onOpenEvent: _openEventWithAvailabilityGuard,
                      );
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => Center(
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
                        padding: const EdgeInsets.symmetric(horizontal: 40),
                        child: Text(
                          ErrorMessageHandler.getReadableError(err),
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(color: mutedColor),
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => ref.refresh(eventsProvider),
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
          ],
        ),
      ),
    );
  }
}

class _SearchResultCard extends StatelessWidget {
  final Event event;
  final bool isDark;
  final Future<void> Function(Event event) onOpenEvent;

  const _SearchResultCard({
    required this.event,
    required this.isDark,
    required this.onOpenEvent,
  });

  String? _eventAvailabilityLabel(Event event) {
    final status = (event.status ?? '').toUpperCase();
    final eventDate = DateTime.tryParse(event.dateTime);
    final isCompletedByStatus = status == 'COMPLETED' || status == 'CANCELLED';
    final isCompletedByTime =
        eventDate != null && DateTime.now().isAfter(eventDate);
    final isSoldOut =
        event.tiers.isNotEmpty && event.tiers.every((t) => t.available <= 0);

    if (isCompletedByStatus || isCompletedByTime) return 'COMPLETED';
    if (isSoldOut) return 'SOLD OUT';
    return null;
  }

  Widget _eventAvailabilityBadge(Event event) {
    final label = _eventAvailabilityLabel(event);
    if (label == null) return const SizedBox.shrink();

    final isCompleted = label == 'COMPLETED';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: (isCompleted ? const Color(0xFF6B7280) : const Color(0xFFB91C1C))
            .withOpacity(0.9),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.25,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onOpenEvent(event),
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
                width: 70,
                height: 70,
                placeholder: 'https://picsum.photos/200',
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          event.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white : Colors.black,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      _eventAvailabilityBadge(event),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 12, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        DateFormat(
                          'MMM d, y',
                        ).format(DateTime.parse(event.dateTime)),
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 12, color: Colors.grey),
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
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
