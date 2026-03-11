import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/events/models/event.dart';
import 'package:mobile/features/events/models/event_engagement.dart';
import 'package:mobile/features/events/models/ticket_tier.dart';
import 'package:mobile/features/booking/presentation/checkout_screen.dart';
import 'package:mobile/features/events/services/event_service.dart';
import 'package:mobile/core/providers.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/features/profile/services/profile_service.dart';
import 'package:mobile/features/events/presentation/home_screen.dart';
import 'seat_selection_screen.dart';
import 'ticket_selection_screen.dart';
import 'package:share_plus/share_plus.dart';
import 'package:mobile/core/utils/error_handler.dart';

class EventDetailsScreen extends ConsumerStatefulWidget {
  final int eventId;
  const EventDetailsScreen({super.key, required this.eventId});

  @override
  ConsumerState<EventDetailsScreen> createState() => _EventDetailsScreenState();
}

class _EventDetailsScreenState extends ConsumerState<EventDetailsScreen> {
  // Store quantities by TicketTier ID
  final Map<int, int> _ticketQuantities = {};
  bool _initialized = false;
  bool _likeSubmitting = false;
  bool _ratingSubmitting = false;

  Color _titleTagColor(String tag) {
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

  Widget _titleTagChip(String? tag) {
    if (tag == null || tag.isEmpty) return const SizedBox.shrink();
    final color = _titleTagColor(tag);
    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        tag.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 8,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  void _initializeQuantities(Event event) {
    if (_initialized) return;
    for (var tier in event.tiers) {
      _ticketQuantities[tier.id] = 0;
    }
    _initialized = true;
  }

  double _calculateTotal(Event event) {
    double total = 0;
    for (var tier in event.tiers) {
      total += (_ticketQuantities[tier.id] ?? 0) * tier.price;
    }
    return total;
  }

  int _totalTickets() {
    return _ticketQuantities.values.fold(0, (a, b) => a + b);
  }

  bool _isAuthenticated() {
    return ref.read(localStorageProvider).authToken != null;
  }

  bool _isEventCompleted(Event event) {
    final status = (event.status ?? '').toUpperCase();
    if (status == 'COMPLETED' || status == 'CANCELLED') return true;

    final eventDate = DateTime.tryParse(event.dateTime);
    if (eventDate == null) return false;
    return DateTime.now().isAfter(eventDate);
  }

  bool _isEventFullySoldOut(Event event) {
    if (event.tiers.isEmpty) return true;
    return event.tiers.every((tier) => tier.sold >= tier.capacity);
  }

  bool _isEventUnavailable(Event event) {
    return _isEventCompleted(event) || _isEventFullySoldOut(event);
  }

  String _eventUnavailableReason(Event event) {
    if (_isEventCompleted(event)) {
      return 'Sorry, this event is already completed and cannot be booked.';
    }
    return 'Sorry, this event is sold out and cannot be booked.';
  }

  Future<void> _showEventUnavailableDialog(Event event) async {
    if (!mounted) return;

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1D192B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(
              Icons.sentiment_dissatisfied,
              color: Color(0xFFF59E0B),
              size: 26,
            ),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Sorry',
                style: TextStyle(color: Colors.white, fontSize: 18),
              ),
            ),
          ],
        ),
        content: Text(
          _eventUnavailableReason(event),
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 14,
            height: 1.4,
          ),
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

  void _handleBackNavigation() {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.go('/home');
  }

  void _invalidateHomeEventFeeds() {
    // Keep Home sections in sync after engagement changes made in details.
    ref.invalidate(filteredEventsProvider);
    ref.invalidate(recommendedMoviesProvider);
    ref.invalidate(bestEventsThisWeekProvider);
    ref.invalidate(trendingNowProvider);
    ref.invalidate(personalizedPicksProvider);
    ref.invalidate(upcomingAwardsProvider);
    ref.invalidate(workshopsShortCoursesProvider);
    ref.invalidate(citySpotlightProvider);
    ref.invalidate(lastMinuteTodayProvider);
    ref.invalidate(offersDealsProvider);
    ref.invalidate(newUpcomingExperiencesProvider);
    ref.invalidate(homeCarouselProvider);
    ref.invalidate(eventsProvider);
  }

  Future<void> _toggleLike() async {
    if (!_isAuthenticated()) {
      if (!mounted) return;
      context.push('/login');
      return;
    }

    if (_likeSubmitting) return;
    setState(() => _likeSubmitting = true);
    try {
      await ref.read(eventServiceProvider).toggleLikeEvent(widget.eventId);
      ref.invalidate(eventEngagementProvider(widget.eventId));
      ref.invalidate(eventDetailsProvider(widget.eventId));
      _invalidateHomeEventFeeds();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ErrorMessageHandler.getReadableError(e))),
      );
    } finally {
      if (mounted) {
        setState(() => _likeSubmitting = false);
      }
    }
  }

  Future<void> _showRatingSheet(
    Event event,
    EventEngagement? engagement,
  ) async {
    if (!_isAuthenticated()) {
      if (!mounted) return;
      context.push('/login');
      return;
    }

    if (_ratingSubmitting) return;

    final commentController = TextEditingController(
      text: engagement?.userComment ?? '',
    );
    int selectedRating = engagement?.userRating ?? 0;

    final submitted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        final cardColor = isDark ? const Color(0xFF1D192B) : Colors.white;
        final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
        final mutedColor = isDark ? Colors.white60 : Colors.black54;

        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              padding: EdgeInsets.fromLTRB(
                20,
                20,
                20,
                MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(24),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Rate this event',
                    style: GoogleFonts.poppins(
                      color: textColor,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    event.title,
                    style: GoogleFonts.poppins(color: mutedColor, fontSize: 12),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: List.generate(5, (index) {
                      final value = index + 1;
                      final filled = selectedRating >= value;
                      return IconButton(
                        onPressed: () =>
                            setSheetState(() => selectedRating = value),
                        icon: Icon(
                          filled
                              ? Icons.star_rounded
                              : Icons.star_outline_rounded,
                          color: filled ? const Color(0xFFFFB020) : mutedColor,
                          size: 34,
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: commentController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Optional comment',
                      hintStyle: TextStyle(color: mutedColor),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: selectedRating == 0
                          ? null
                          : () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF8B5CF6),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Submit Rating'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );

    if (submitted != true || selectedRating == 0) {
      commentController.dispose();
      return;
    }

    setState(() => _ratingSubmitting = true);
    try {
      await ref
          .read(eventServiceProvider)
          .rateEvent(
            widget.eventId,
            rating: selectedRating,
            comment: commentController.text.trim().isEmpty
                ? null
                : commentController.text.trim(),
          );
      ref.invalidate(eventEngagementProvider(widget.eventId));
      ref.invalidate(eventDetailsProvider(widget.eventId));
      _invalidateHomeEventFeeds();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thanks for rating this event.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ErrorMessageHandler.getReadableError(e))),
      );
    } finally {
      commentController.dispose();
      if (mounted) {
        setState(() => _ratingSubmitting = false);
      }
    }
  }

  void _onCheckout(Event event) async {
    if (_isEventUnavailable(event)) {
      await _showEventUnavailableDialog(event);
      return;
    }

    // 0. Check Auth
    final isAuthenticated = ref.read(localStorageProvider).authToken != null;
    if (!isAuthenticated) {
      context.push('/login');
      return;
    }

    // 1. Filter selected tiers
    final selectedEntries = _ticketQuantities.entries
        .where((e) => e.value > 0)
        .toList();

    if (selectedEntries.isEmpty) return;

    // Organizer confirmation
    try {
      final profile = await ref.read(userProfileProvider.future);
      if (profile.role == 'ORGANIZER') {
        if (!mounted) return;
        final proceed = await _showOrganizerPurchaseDialog();
        if (!proceed) return;
      }
    } catch (_) {
      // If profile fails, continue without blocking
    }

    // 2. API currently books one tier per reservation, let user choose if multiple are selected
    if (selectedEntries.length > 1) {
      final picked = await _chooseTierForCheckout(event, selectedEntries);
      if (picked == null) return;
      selectedEntries
        ..clear()
        ..add(picked);
    }

    final entry = selectedEntries.first;
    final tier = event.tiers.firstWhere((t) => t.id == entry.key);
    List<String>? selectedSeats;

    // 3. Handle Seat Selection if needed
    if (event.hasSeatMap) {
      // Navigate to Seat Selection
      final result = await Navigator.push<List<String>>(
        context,
        MaterialPageRoute(
          builder: (context) =>
              SeatSelectionScreen(eventId: event.id, tierId: tier.id),
        ),
      );

      if (result == null || result.isEmpty) return; // Cancelled
      selectedSeats = result;

      // Update quantity to match selected seats if mismatch occurs
      if (selectedSeats.length != entry.value) {
        // This shouldn't normally happen if SeatSelection enforces quanity,
        // but we'll use the seat count as the final source of truth.
      }
    }

    if (!mounted) return;

    final checkoutResult = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => CheckoutScreen(
          event: event,
          tierId: tier.id,
          tierName: tier.name,
          unitPrice: tier.price,
          quantity: selectedSeats?.length ?? entry.value,
          selectedSeats: selectedSeats,
        ),
      ),
    );

    if (!mounted) return;
    if (checkoutResult == 'adjust_quantity') {
      await _openTicketSelection(event, event.tiers);
    }
  }

  Future<void> _openTicketSelection(Event event, List<TicketTier> tiers) async {
    if (_isEventUnavailable(event)) {
      await _showEventUnavailableDialog(event);
      return;
    }

    final updated = await Navigator.push<Map<int, int>>(
      context,
      MaterialPageRoute(
        builder: (context) => TicketSelectionScreen(
          event: event,
          tiers: tiers,
          initialQuantities: Map<int, int>.from(_ticketQuantities),
        ),
      ),
    );

    if (updated == null || !mounted) return;

    setState(() {
      for (final tier in tiers) {
        _ticketQuantities[tier.id] = updated[tier.id] ?? 0;
      }
    });
  }

  Future<MapEntry<int, int>?> _chooseTierForCheckout(
    Event event,
    List<MapEntry<int, int>> selectedEntries,
  ) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? const Color(0xFF1D192B) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white60 : Colors.black54;

    return showModalBottomSheet<MapEntry<int, int>>(
      context: context,
      backgroundColor: cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),

      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Choose Ticket Type for Checkout',
                  style: GoogleFonts.poppins(
                    color: textColor,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'You selected multiple ticket types. Complete checkout one type at a time.',
                  style: GoogleFonts.poppins(color: mutedColor, fontSize: 12),
                ),
                const SizedBox(height: 12),
                ...selectedEntries.map((entry) {
                  final tier = event.tiers.firstWhere((t) => t.id == entry.key);
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      tier.name,
                      style: GoogleFonts.poppins(
                        color: textColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    subtitle: Text(
                      '${entry.value} x ${tier.price.toStringAsFixed(2)} ETB',
                      style: GoogleFonts.poppins(
                        color: mutedColor,
                        fontSize: 12,
                      ),
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => Navigator.pop(context, entry),
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<bool> _showOrganizerPurchaseDialog() async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final cardColor = isDark ? const Color(0xFF1D192B) : Colors.white;
    final mutedColor = isDark ? Colors.white70 : Colors.black54;

    final result = await showGeneralDialog<bool>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'organizer_purchase.title'.tr(),
      transitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (context, _, __) {
        return Center(
          child: Material(
            color: Colors.transparent,
            child: Container(
              width: MediaQuery.of(context).size.width * 0.86,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF8B5CF6).withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.people_alt_outlined,
                      color: Color(0xFF8B5CF6),
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'organizer_purchase.title'.tr(),
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'organizer_purchase.subtitle'.tr(),
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: mutedColor,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(context, false),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF8B5CF6),
                            side: const BorderSide(color: Color(0xFF8B5CF6)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: Text('organizer_purchase.cancel'.tr()),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => Navigator.pop(context, true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF8B5CF6),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: Text('organizer_purchase.confirm'.tr()),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
      transitionBuilder: (context, animation, _, child) {
        final curved = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutBack,
        );
        return FadeTransition(
          opacity: animation,
          child: ScaleTransition(scale: curved, child: child),
        );
      },
    );

    return result ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final eventAsync = ref.watch(eventDetailsProvider(widget.eventId));
    final engagementAsync = ref.watch(eventEngagementProvider(widget.eventId));
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedTextColor = isDark ? Colors.white54 : Colors.black54;
    final bodyTextColor = isDark ? Colors.white70 : Colors.black87;
    final backgroundColor = isDark
        ? const Color(0xFF0F0D15)
        : const Color(0xFFF8F7FA);

    return eventAsync.when(
      data: (event) {
        _initializeQuantities(event);
        final eventDate = DateTime.parse(event.dateTime);
        final sortedTiers = List<TicketTier>.from(event.tiers)
          ..sort((a, b) => a.price.compareTo(b.price));

        return Scaffold(
          backgroundColor: backgroundColor,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: Icon(Icons.arrow_back_ios_new, color: textColor, size: 20),
              onPressed: _handleBackNavigation,
            ),
            title: Column(
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _titleTagChip(event.titleTag),
                    Flexible(
                      child: Text(
                        event.title,
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: textColor,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: Color(0xFF8B5CF6),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.verified,
                        color: Colors.white,
                        size: 12,
                      ),
                    ),
                  ],
                ),
                Text(
                  "${DateFormat('E, MMM d').format(eventDate)} • ${DateFormat('h:mm a').format(eventDate)}",
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: mutedTextColor,
                  ),
                ),
              ],
            ),
            centerTitle: true,
            actions: [
              IconButton(
                icon: Icon(Icons.share, color: textColor),
                onPressed: () {
                  final dateText = DateFormat(
                    'E, MMM d • h:mm a',
                  ).format(eventDate);
                  final deepLink = "etticket://event/${event.id}";
                  final message =
                      "${event.title}\n${event.venue}\n$dateText\n$deepLink";
                  Share.share(message, subject: event.title);
                },
              ),
            ],
          ),
          body: Stack(
            children: [
              ListView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 24,
                ),
                children: [
                  Text(
                    "Event Details",
                    style: GoogleFonts.poppins(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // New Structured Info Section
                  _buildEventInfoSection(event, eventDate),
                  const SizedBox(height: 32),

                  _buildEngagementSection(event, engagementAsync),
                  const SizedBox(height: 32),

                  // About Section
                  Text(
                    "About this event",
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    event.description,
                    style: GoogleFonts.poppins(
                      color: bodyTextColor,
                      fontSize: 14,
                      height: 1.6,
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Seat Map Card (Conditional)
                  if (event.hasSeatMap) ...[
                    _buildSeatMapCard(),
                    const SizedBox(height: 32),
                  ],

                  // Availability Status & Trust Signals
                  _buildTrustSignals(event, sortedTiers),

                  const SizedBox(height: 40),

                  _buildTicketSelectionEntry(
                    event,
                    sortedTiers,
                    textColor,
                    mutedTextColor,
                  ),

                  const SizedBox(height: 28),

                  // Event Policies - Real Data
                  if (event.refundPolicy != null &&
                      event.refundPolicy!.isNotEmpty)
                    _buildExpandableSection(
                      "Refund Policy",
                      event.refundPolicy!,
                    ),

                  if (event.additionalPolicy != null &&
                      event.additionalPolicy!.isNotEmpty)
                    _buildExpandableSection(
                      "Event Policies",
                      event.additionalPolicy!,
                    ),

                  // Age Restrictions - Real Data
                  _buildExpandableSection(
                    "Age Restrictions",
                    event.minAge > 0
                        ? "This event is restricted to attendees aged ${event.minAge} years and above. Valid ID may be required at entry."
                        : "This event is open to all ages. Minors may attend without age restrictions.",
                  ),

                  const SizedBox(height: 120), // Spacer for bottom bar
                ],
              ),

              // Bottom Checkout Bar
              _buildBottomBar(event, sortedTiers),
            ],
          ),
        );
      },
      loading: () => const Scaffold(
        backgroundColor: Color(0xFF0F0D15),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF8B5CF6)),
        ),
      ),
      error: (err, stack) => Scaffold(
        backgroundColor: backgroundColor,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.wifi_off_rounded, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  ErrorMessageHandler.getReadableError(err),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(color: textColor.withOpacity(0.7)),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () =>
                    ref.refresh(eventDetailsProvider(widget.eventId)),
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
    );
  }

  Widget _buildSeatMapCard() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? const Color(0xFF1D192B) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white54 : Colors.black54;

    return Container(
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            child: Stack(
              children: [
                Image.network(
                  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000',
                  height: 160,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  color: Colors.purple.withOpacity(0.3),
                  colorBlendMode: BlendMode.colorBurn,
                ),
                Positioned(
                  bottom: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.view_in_ar, color: Colors.white, size: 14),
                        SizedBox(width: 6),
                        Text(
                          "Interactive",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Seat Map",
                        style: GoogleFonts.poppins(
                          color: textColor,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Tap sections to see view from seat",
                        style: GoogleFonts.poppins(
                          color: mutedColor,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                  ),
                  child: const Text(
                    "View Map",
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrustSignals(Event event, List<TicketTier> tiers) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? const Color(0xFF1D192B) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white54 : Colors.black54;

    // Calculate total availability
    int totalAvailable = 0;
    int totalCapacity = 0;
    for (var tier in tiers) {
      totalAvailable += (tier.capacity - tier.sold);
      totalCapacity += tier.capacity;
    }

    final availabilityPercent = totalCapacity > 0
        ? (totalAvailable / totalCapacity * 100)
        : 0;
    final isLowAvailability =
        availabilityPercent < 20 && availabilityPercent > 0;

    return Column(
      children: [
        // Organizer Verification
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF8B5CF6).withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.verified_user,
                  color: Color(0xFF8B5CF6),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          "event_details.verified_organizer".tr(),
                          style: GoogleFonts.poppins(
                            color: textColor,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(
                          Icons.check_circle,
                          color: Color(0xFF8B5CF6),
                          size: 16,
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "event_details.trusted_organizer".tr(),
                      style: GoogleFonts.poppins(
                        color: mutedColor,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // Quick Info Row
        Row(
          children: [
            // Refund Policy
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.shield_outlined,
                          color: Color(0xFF10B981),
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          "event_details.refund_policy".tr(),
                          style: TextStyle(color: mutedColor, fontSize: 11),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      event.refundPolicy != null &&
                              event.refundPolicy!.isNotEmpty
                          ? (event.refundPolicy!.length > 30
                                ? '${event.refundPolicy!.substring(0, 30)}...'
                                : event.refundPolicy!)
                          : "See policy details",
                      style: GoogleFonts.poppins(
                        color: textColor,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(width: 12),

            // Ticket Availability
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isLowAvailability
                      ? const Color(0xFFFF9F0A).withOpacity(0.1)
                      : cardColor,
                  borderRadius: BorderRadius.circular(12),
                  border: isLowAvailability
                      ? Border.all(
                          color: const Color(0xFFFF9F0A).withOpacity(0.3),
                        )
                      : null,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          isLowAvailability
                              ? Icons.warning_amber
                              : Icons.confirmation_number_outlined,
                          color: isLowAvailability
                              ? const Color(0xFFFF9F0A)
                              : const Color(0xFF8B5CF6),
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          "event_details.availability".tr(),
                          style: TextStyle(
                            color: isLowAvailability
                                ? const Color(0xFFFF9F0A)
                                : mutedColor,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isLowAvailability
                          ? "event_details.few_left".tr()
                          : "event_details.tickets_available".tr(
                              args: [totalAvailable.toString()],
                            ),
                      style: GoogleFonts.poppins(
                        color: isLowAvailability
                            ? const Color(0xFFFF9F0A)
                            : textColor,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildEngagementSection(
    Event event,
    AsyncValue<EventEngagement> engagementAsync,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? const Color(0xFF1D192B) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white60 : Colors.black54;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: engagementAsync.when(
        data: (engagement) {
          final avg = engagement.averageRating.toStringAsFixed(1);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'Community Feedback',
                    style: GoogleFonts.poppins(
                      color: textColor,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  if (_likeSubmitting || _ratingSubmitting)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.favorite_rounded,
                    color: engagement.userLiked ? Colors.red : mutedColor,
                    size: 18,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${engagement.likesCount} likes',
                    style: GoogleFonts.poppins(color: textColor, fontSize: 13),
                  ),
                  const SizedBox(width: 16),
                  const Icon(
                    Icons.star_rounded,
                    color: Color(0xFFFFB020),
                    size: 18,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '$avg (${engagement.ratingsCount} ratings)',
                    style: GoogleFonts.poppins(color: textColor, fontSize: 13),
                  ),
                ],
              ),
              if (engagement.userRating != null) ...[
                const SizedBox(height: 8),
                Text(
                  'Your rating: ${engagement.userRating}/5',
                  style: GoogleFonts.poppins(color: mutedColor, fontSize: 12),
                ),
              ],
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _likeSubmitting ? null : _toggleLike,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: engagement.userLiked
                            ? Colors.red
                            : textColor,
                        side: BorderSide(
                          color: engagement.userLiked
                              ? Colors.red.withOpacity(0.4)
                              : mutedColor.withOpacity(0.3),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: Icon(
                        engagement.userLiked
                            ? Icons.favorite_rounded
                            : Icons.favorite_outline_rounded,
                      ),
                      label: Text(engagement.userLiked ? 'Liked' : 'Like'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _ratingSubmitting
                          ? null
                          : () => _showRatingSheet(event, engagement),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF8B5CF6),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(Icons.star_rounded),
                      label: Text(
                        engagement.userRating == null
                            ? 'Rate'
                            : 'Update Rating',
                      ),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
        loading: () => const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: CircularProgressIndicator(),
          ),
        ),
        error: (_, __) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Could not load likes and ratings.',
                style: GoogleFonts.poppins(color: mutedColor, fontSize: 13),
              ),
              const SizedBox(height: 10),
              TextButton(
                onPressed: () =>
                    ref.invalidate(eventEngagementProvider(widget.eventId)),
                child: const Text('Retry'),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildExpandableSection(String title, String content) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white54 : Colors.black54;
    final bodyColor = isDark ? Colors.white70 : Colors.black87;
    final borderColor = isDark ? Colors.white10 : Colors.black12;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: borderColor)),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          title: Text(
            title,
            style: GoogleFonts.poppins(
              color: textColor,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
          trailing: Icon(Icons.keyboard_arrow_down, color: mutedColor),
          children: [
            Padding(
              padding: const EdgeInsets.only(
                left: 16,
                bottom: 16,
                right: 16,
                top: 8,
              ),
              child: Text(
                content,
                style: GoogleFonts.poppins(
                  color: bodyColor,
                  fontSize: 14,
                  height: 1.6,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar(Event event, List<TicketTier> tiers) {
    final total = _calculateTotal(event);
    final count = _totalTickets();
    final eventUnavailable = _isEventUnavailable(event);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white54 : Colors.black54;
    final barColor = isDark ? const Color(0xFF15131C) : Colors.white;
    final borderColor = isDark ? Colors.white10 : Colors.black12;

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.fromLTRB(
          24,
          20,
          24,
          MediaQuery.of(context).padding.bottom + 20,
        ),
        decoration: BoxDecoration(
          color: barColor,
          border: Border(top: BorderSide(color: borderColor)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.4 : 0.1),
              blurRadius: 20,
              offset: const Offset(0, -10),
            ),
          ],
        ),
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "TOTAL",
                  style: TextStyle(
                    color: mutedColor,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: "${total.toStringAsFixed(2)} ETB",
                        style: GoogleFonts.poppins(
                          color: textColor,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextSpan(
                        text: " /$count tix",
                        style: GoogleFonts.poppins(
                          color: mutedColor,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(width: 24),
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  if (eventUnavailable) {
                    _showEventUnavailableDialog(event);
                    return;
                  }

                  if (count == 0) {
                    _openTicketSelection(event, tiers);
                    return;
                  }
                  _onCheckout(event);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: eventUnavailable
                      ? const Color(0xFF6B7280)
                      : const Color(0xFF8B5CF6),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  eventUnavailable
                      ? 'Unavailable'
                      : (count > 0
                            ? "event_details.checkout".tr()
                            : "Select Tickets"),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketSelectionEntry(
    Event event,
    List<TicketTier> tiers,
    Color textColor,
    Color mutedColor,
  ) {
    final eventUnavailable = _isEventUnavailable(event);
    final selected = tiers
        .where((tier) => (_ticketQuantities[tier.id] ?? 0) > 0)
        .toList();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1D192B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Ticket Type & Quantity',
                  style: GoogleFonts.poppins(
                    color: textColor,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              TextButton(
                onPressed: () {
                  if (eventUnavailable) {
                    _showEventUnavailableDialog(event);
                    return;
                  }
                  _openTicketSelection(event, tiers);
                },
                child: Text(eventUnavailable ? 'Unavailable' : 'Select'),
              ),
            ],
          ),
          if (selected.isEmpty)
            Text(
              'No tickets selected yet. Tap Select to choose ticket types.',
              style: GoogleFonts.poppins(color: mutedColor, fontSize: 12),
            )
          else
            ...selected.map((tier) {
              final qty = _ticketQuantities[tier.id] ?? 0;
              final lineTotal = qty * tier.price;
              return Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${tier.name} x$qty',
                        style: GoogleFonts.poppins(
                          color: textColor,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Text(
                      '${lineTotal.toStringAsFixed(2)} ETB',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF8B5CF6),
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildEventInfoSection(Event event, DateTime date) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? const Color(0xFF1D192B) : Colors.white;
    final dividerColor = isDark ? Colors.white10 : Colors.black12;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          _buildInfoTile(
            Icons.location_on_outlined,
            "Venue & Location",
            event.venue,
            const Color(0xFF8B5CF6),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Divider(color: dividerColor),
          ),
          _buildInfoTile(
            Icons.calendar_today_outlined,
            "Date",
            DateFormat('EEEE, MMM d, yyyy').format(date),
            const Color(0xFF10B981),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Divider(color: dividerColor),
          ),
          _buildInfoTile(
            Icons.access_time_outlined,
            "Booking Time",
            DateFormat('h:mm a').format(date),
            const Color(0xFFFF9F0A),
          ),
          if (event.isMovie ||
              (event.category != null && event.category!.name == 'Movies')) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Divider(color: dividerColor),
            ),
            _buildInfoTile(
              Icons.movie_outlined,
              "Movie Detail",
              "${event.duration ?? 120} min • ${event.rating ?? 'PG-13'}",
              const Color(0xFFD8B4FE),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoTile(
    IconData icon,
    String label,
    String value,
    Color iconColor,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white54 : Colors.black54;

    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.poppins(color: mutedColor, fontSize: 12),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: GoogleFonts.poppins(
                  color: textColor,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TicketTierTile extends StatelessWidget {
  final String title;
  final String desc;
  final double price;
  final String? badge;
  final Color? badgeColor;
  final Color? badgeTextColor;
  final bool isSoldOut;
  final int quantity;
  final ValueChanged<int> onChanged;

  const _TicketTierTile({
    required this.title,
    required this.desc,
    required this.price,
    this.badge,
    this.badgeColor,
    this.badgeTextColor,
    this.isSoldOut = false,
    required this.quantity,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white54 : Colors.black54;
    final cardBorder = isDark ? Colors.white10 : Colors.black12;
    final soldOutBg = isDark ? Colors.white10 : Colors.black12;

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: cardBorder)),
      ),
      child: Opacity(
        opacity: isSoldOut ? 0.4 : 1.0,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            title,
                            style: GoogleFonts.poppins(
                              color: textColor,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (badge != null)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: badgeColor,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                badge!,
                                style: TextStyle(
                                  color: badgeTextColor,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        desc,
                        style: GoogleFonts.poppins(
                          color: mutedColor,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                if (!isSoldOut)
                  _QuantitySelector(quantity: quantity, onChanged: onChanged)
                else
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: soldOutBg,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      "event_details.sold_out".tr(),
                      style: TextStyle(
                        color: mutedColor,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              "${price.toStringAsFixed(2)} ETB",
              style: GoogleFonts.poppins(
                color: const Color(0xFF8B5CF6),
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuantitySelector extends StatelessWidget {
  final int quantity;
  final ValueChanged<int> onChanged;

  const _QuantitySelector({required this.quantity, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final borderColor = isDark ? Colors.white10 : Colors.black12;

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1D192B) : Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          _buildButton(
            icon: Icons.remove,
            onTap: quantity > 0 ? () => onChanged(quantity - 1) : null,
            isDark: isDark,
          ),
          SizedBox(
            width: 32,
            child: Text(
              "$quantity",
              textAlign: TextAlign.center,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          _buildButton(
            icon: Icons.add,
            onTap: () => onChanged(quantity + 1),
            isPrimary: true,
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildButton({
    required IconData icon,
    VoidCallback? onTap,
    bool isPrimary = false,
    required bool isDark,
  }) {
    final baseBg = isPrimary
        ? const Color(0xFF8B5CF6)
        : (isDark ? Colors.white10 : Colors.black12);
    final baseIcon = isPrimary
        ? Colors.white
        : (isDark ? Colors.white : const Color(0xFF1A1823));
    final iconColor = onTap == null
        ? (isDark ? Colors.white38 : Colors.black38)
        : baseIcon;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: baseBg, shape: BoxShape.circle),
        child: Icon(icon, color: iconColor, size: 20),
      ),
    );
  }
}
