import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/events/models/event.dart';
import 'package:mobile/features/events/models/ticket_tier.dart';
import 'package:mobile/features/booking/presentation/checkout_screen.dart';
import 'package:mobile/features/events/services/event_service.dart';
import 'package:mobile/core/providers.dart';
import 'package:go_router/go_router.dart';
import 'seat_selection_screen.dart';

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

  void _onCheckout(Event event) async {
    // 0. Check Auth
    final isAuthenticated = ref.read(localStorageProvider).authToken != null;
    if (!isAuthenticated) {
      context.push('/login');
      return;
    }

    // 1. Filter selected tiers
    final selectedEntries = _ticketQuantities.entries.where((e) => e.value > 0).toList();

    if (selectedEntries.isEmpty) return;

    // 2. Enforce single tier selection for MVP (due to API limitation)
    if (selectedEntries.length > 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select only one ticket type per order.")),
      );
      return;
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
          builder: (context) => SeatSelectionScreen(
            eventId: event.id,
            tierId: tier.id,
          ),
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

    Navigator.push(
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
  }

  @override
  Widget build(BuildContext context) {
    final eventAsync = ref.watch(eventDetailsProvider(widget.eventId));

    return eventAsync.when(
      data: (event) {
        _initializeQuantities(event);
        final eventDate = DateTime.parse(event.dateTime);
        final sortedTiers = List<TicketTier>.from(event.tiers)..sort((a, b) => a.price.compareTo(b.price));

        return Scaffold(
          backgroundColor: const Color(0xFF0F0D15),
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            title: Column(
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Flexible(
                      child: Text(
                        event.title,
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
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
                      child: const Icon(Icons.verified, color: Colors.white, size: 12),
                    ),
                  ],
                ),
                Text(
                  "${DateFormat('E, MMM d').format(eventDate)} • ${DateFormat('h:mm a').format(eventDate)}",
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: Colors.white54,
                  ),
                ),
              ],
            ),
            centerTitle: true,
            actions: [
              IconButton(
                icon: const Icon(Icons.share, color: Colors.white),
                onPressed: () {},
              ),
            ],
          ),
          body: Stack(
            children: [
              ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                children: [
                  Text(
                    "Event Details",
                    style: GoogleFonts.poppins(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // New Structured Info Section
                  _buildEventInfoSection(event, eventDate),
                  const SizedBox(height: 32),

                  // About Section
                  Text(
                    "About this event",
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    event.description,
                    style: GoogleFonts.poppins(
                      color: Colors.white70,
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

                  Text(
                    "Select Ticket Type",
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  if (sortedTiers.isEmpty)
                    const Center(child: Text("No tickets available", style: TextStyle(color: Colors.white54))),

                  // Ticket Tiers
                  ...sortedTiers.map((tier) {
                    final isSoldOut = tier.sold >= tier.capacity;
                    final quantity = _ticketQuantities[tier.id] ?? 0;
                    
                    return _TicketTierTile(
                      title: tier.name,
                      desc: "Includes access to event",
                      price: tier.price,
                      badge: isSoldOut ? "SOLD OUT" : (tier.capacity - tier.sold < 20 ? "Running Low" : null),
                      badgeColor: isSoldOut ? Colors.red.withOpacity(0.1) : const Color(0xFFFF9F0A).withOpacity(0.1),
                      badgeTextColor: isSoldOut ? Colors.red : const Color(0xFFFF9F0A),
                      isSoldOut: isSoldOut,
                      quantity: quantity,
                      onChanged: (val) => setState(() => _ticketQuantities[tier.id] = val),
                     );
                  }),

                  
                  
                  const SizedBox(height: 24),
                  
                  // Event Policies - Real Data
                  if (event.refundPolicy != null && event.refundPolicy!.isNotEmpty)
                    _buildExpandableSection(
                      "Refund Policy",
                      event.refundPolicy!,
                    ),
                  
                  if (event.additionalPolicy != null && event.additionalPolicy!.isNotEmpty)
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
              _buildBottomBar(event),
            ],
          ),
        );
      },
      loading: () => const Scaffold(
        backgroundColor: Color(0xFF0F0D15),
        body: Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6))),
      ),
      error: (err, stack) => Scaffold(
        backgroundColor: Color(0xFF0F0D15),
        body: Center(child: Text("Error: $err", style: TextStyle(color: Colors.red))),
      ),
    );
  }

  Widget _buildSeatMapCard() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1D192B),
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
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.view_in_ar, color: Colors.white, size: 14),
                        SizedBox(width: 6),
                        Text("Interactive", style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
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
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Tap sections to see view from seat",
                        style: GoogleFonts.poppins(
                          color: Colors.white54,
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
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                  child: const Text("View Map", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrustSignals(Event event, List<TicketTier> tiers) {
    // Calculate total availability
    int totalAvailable = 0;
    int totalCapacity = 0;
    for (var tier in tiers) {
      totalAvailable += (tier.capacity - tier.sold);
      totalCapacity += tier.capacity;
    }
    
    final availabilityPercent = totalCapacity > 0 ? (totalAvailable / totalCapacity * 100) : 0;
    final isLowAvailability = availabilityPercent < 20 && availabilityPercent > 0;
    
    return Column(
      children: [
        // Organizer Verification
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1D192B),
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
                child: const Icon(Icons.verified_user, color: Color(0xFF8B5CF6), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          "Verified Organizer",
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.check_circle, color: Color(0xFF8B5CF6), size: 16),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "Trusted event organizer",
                      style: GoogleFonts.poppins(
                        color: Colors.white54,
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
                  color: const Color(0xFF1D192B),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.shield_outlined, color: Color(0xFF10B981), size: 16),
                        SizedBox(width: 6),
                        Text(
                          "Refund Policy",
                          style: TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      event.refundPolicy != null && event.refundPolicy!.isNotEmpty
                          ? (event.refundPolicy!.length > 30 
                              ? '${event.refundPolicy!.substring(0, 30)}...'
                              : event.refundPolicy!)
                          : "See policy details",
                      style: GoogleFonts.poppins(
                        color: Colors.white,
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
                      : const Color(0xFF1D192B),
                  borderRadius: BorderRadius.circular(12),
                  border: isLowAvailability 
                      ? Border.all(color: const Color(0xFFFF9F0A).withOpacity(0.3))
                      : null,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          isLowAvailability ? Icons.warning_amber : Icons.confirmation_number_outlined,
                          color: isLowAvailability ? const Color(0xFFFF9F0A) : const Color(0xFF8B5CF6),
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          "Availability",
                          style: TextStyle(
                            color: isLowAvailability ? const Color(0xFFFF9F0A) : Colors.white70,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isLowAvailability ? "Few left!" : "$totalAvailable tickets",
                      style: GoogleFonts.poppins(
                        color: isLowAvailability ? const Color(0xFFFF9F0A) : Colors.white,
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

  Widget _buildExpandableSection(String title, String content) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          title: Text(
            title,
            style: GoogleFonts.poppins(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
          ),
          trailing: const Icon(Icons.keyboard_arrow_down, color: Colors.white54),
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 16, bottom: 16, right: 16, top: 8),
              child: Text(
                content,
                style: GoogleFonts.poppins(
                  color: Colors.white70,
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

  Widget _buildBottomBar(Event event) {
    final total = _calculateTotal(event);
    final count = _totalTickets();
    
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.fromLTRB(24, 20, 24, MediaQuery.of(context).padding.bottom + 20),
        decoration: BoxDecoration(
          color: const Color(0xFF15131C),
          border: const Border(top: BorderSide(color: Colors.white10)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.4),
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
                const Text("TOTAL", style: TextStyle(color: Colors.white54, fontSize: 10, letterSpacing: 1.5, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: "${total.toStringAsFixed(2)} ETB",
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextSpan(
                        text: " /$count tix",
                        style: GoogleFonts.poppins(
                          color: Colors.white54,
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
                onPressed: count > 0 ? () => _onCheckout(event) : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8B5CF6),
                  disabledBackgroundColor: Colors.white10,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: const Text(
                  "Checkout",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEventInfoSection(Event event, DateTime date) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1D192B),
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
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(color: Colors.white10),
          ),
          _buildInfoTile(
            Icons.calendar_today_outlined,
            "Date",
            DateFormat('EEEE, MMM d, yyyy').format(date),
            const Color(0xFF10B981),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(color: Colors.white10),
          ),
          _buildInfoTile(
            Icons.access_time_outlined,
            "Booking Time",
            DateFormat('h:mm a').format(date),
            const Color(0xFFFF9F0A),
          ),
          if (event.isMovie || (event.category != null && event.category!.name == 'Movies')) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Divider(color: Colors.white10),
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

  Widget _buildInfoTile(IconData icon, String label, String value, Color iconColor) {
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
                style: GoogleFonts.poppins(
                  color: Colors.white54,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: GoogleFonts.poppins(
                  color: Colors.white,
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
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.only(bottom: 24),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white10)),
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
                      Row(
                        children: [
                          Text(
                            title,
                            style: GoogleFonts.poppins(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (badge != null) ...[
                            const SizedBox(width: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        desc,
                        style: GoogleFonts.poppins(
                          color: Colors.white54,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                if (!isSoldOut)
                  _QuantitySelector(
                    quantity: quantity,
                    onChanged: onChanged,
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white10,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      "Sold Out",
                      style: TextStyle(color: Colors.white54, fontSize: 13, fontWeight: FontWeight.bold),
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
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFF1D192B),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        children: [
          _buildButton(
            icon: Icons.remove,
            onTap: quantity > 0 ? () => onChanged(quantity - 1) : null,
          ),
          SizedBox(
            width: 32,
            child: Text(
              "$quantity",
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
          _buildButton(
            icon: Icons.add,
            onTap: () => onChanged(quantity + 1),
            isPrimary: true,
          ),
        ],
      ),
    );
  }

  Widget _buildButton({required IconData icon, VoidCallback? onTap, bool isPrimary = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isPrimary ? const Color(0xFF8B5CF6) : Colors.white10,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }
}
