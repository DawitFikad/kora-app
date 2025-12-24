import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:mobile/features/events/models/event.dart';

class EventDetailsScreen extends StatefulWidget {
  final Event event;
  const EventDetailsScreen({super.key, required this.event});

  @override
  State<EventDetailsScreen> createState() => _EventDetailsScreenState();
}

class _EventDetailsScreenState extends State<EventDetailsScreen> {
  final Map<String, int> _ticketQuantities = {
    'General Admission': 0,
    'VIP Experience': 0,
    'Group Bundle (4+)': 0,
    'Super Fan Pit': 0,
  };

  double _calculateTotal() {
    double total = 0;
    total += (_ticketQuantities['General Admission'] ?? 0) * 850;
    total += (_ticketQuantities['VIP Experience'] ?? 0) * 2500;
    total += (_ticketQuantities['Group Bundle (4+)'] ?? 0) * 750;
    total += (_ticketQuantities['Super Fan Pit'] ?? 0) * 5000;
    return total;
  }

  int _totalTickets() {
    return _ticketQuantities.values.reduce((a, b) => a + b);
  }

  @override
  Widget build(BuildContext context) {
    final eventDate = DateTime.parse(widget.event.dateTime);
    
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
            Text(
              widget.event.title,
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
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
            icon: const Icon(Icons.more_vert, color: Colors.white),
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
                "Select Tickets",
                style: GoogleFonts.poppins(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              
              // Seat Map Card
              _buildSeatMapCard(),
              
              const SizedBox(height: 32),
              
              // Ticket Tiers
              _TicketTierTile(
                title: "General Admission",
                desc: "Standing room only • Main floor access",
                price: 850,
                badge: "Selling Fast",
                badgeColor: const Color(0xFFFF9F0A).withOpacity(0.1),
                badgeTextColor: const Color(0xFFFF9F0A),
                quantity: _ticketQuantities['General Admission']!,
                onChanged: (val) => setState(() => _ticketQuantities['General Admission'] = val),
              ),
              
              _TicketTierTile(
                title: "VIP Experience",
                desc: "Skip the line • Private bar access • Lanyard",
                price: 2500,
                quantity: _ticketQuantities['VIP Experience']!,
                onChanged: (val) => setState(() => _ticketQuantities['VIP Experience'] = val),
              ),
              
              _TicketTierTile(
                title: "Group Bundle (4+)",
                desc: "Discount applied automatically",
                price: 750,
                badge: "Save 15%",
                badgeColor: Colors.green.withOpacity(0.1),
                badgeTextColor: Colors.green,
                quantity: _ticketQuantities['Group Bundle (4+)']!,
                onChanged: (val) => setState(() => _ticketQuantities['Group Bundle (4+)'] = val),
              ),
              
              _TicketTierTile(
                title: "Super Fan Pit",
                desc: "Front row access • Meet & Greet",
                price: 5000,
                isSoldOut: true,
                quantity: _ticketQuantities['Super Fan Pit']!,
                onChanged: (val) {},
              ),
              
              const SizedBox(height: 24),
              _buildExpandableSection("Event Policies"),
              _buildExpandableSection("Age Restrictions"),
              
              const SizedBox(height: 120), // Spacer for bottom bar
            ],
          ),
          
          // Bottom Checkout Bar
          _buildBottomBar(),
        ],
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

  Widget _buildExpandableSection(String title) {
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
              padding: const EdgeInsets.only(left: 16, bottom: 16, right: 16),
              child: Text(
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                style: GoogleFonts.poppins(color: Colors.white54, fontSize: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    final total = _calculateTotal();
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
                onPressed: count > 0 ? () {} : null,
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
