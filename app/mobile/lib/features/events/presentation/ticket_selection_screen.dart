import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/features/events/models/event.dart';
import 'package:mobile/features/events/models/ticket_tier.dart';

class TicketSelectionScreen extends StatefulWidget {
  final Event event;
  final List<TicketTier> tiers;
  final Map<int, int> initialQuantities;

  const TicketSelectionScreen({
    super.key,
    required this.event,
    required this.tiers,
    required this.initialQuantities,
  });

  @override
  State<TicketSelectionScreen> createState() => _TicketSelectionScreenState();
}

class _TicketSelectionScreenState extends State<TicketSelectionScreen> {
  late final Map<int, int> _quantities;

  @override
  void initState() {
    super.initState();
    _quantities = Map<int, int>.from(widget.initialQuantities);
    for (final tier in widget.tiers) {
      _quantities.putIfAbsent(tier.id, () => 0);
    }
  }

  int get _totalTickets => _quantities.values.fold(0, (a, b) => a + b);

  double get _totalAmount {
    double total = 0;
    for (final tier in widget.tiers) {
      total += (_quantities[tier.id] ?? 0) * tier.price;
    }
    return total;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white60 : Colors.black54;
    final bgColor = isDark ? const Color(0xFF0F0D15) : const Color(0xFFF8F7FA);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Select Ticket Type',
          style: GoogleFonts.poppins(
            color: textColor,
            fontWeight: FontWeight.w700,
            fontSize: 17,
          ),
        ),
        iconTheme: IconThemeData(color: textColor),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 130),
        children: [
          Text(
            widget.event.title,
            style: GoogleFonts.poppins(
              color: textColor,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Choose any ticket type and adjust quantities.',
            style: GoogleFonts.poppins(color: mutedColor, fontSize: 12),
          ),
          const SizedBox(height: 14),
          ...widget.tiers.map((tier) {
            final soldOut = tier.sold >= tier.capacity;
            final available = (tier.capacity - tier.sold).clamp(
              0,
              tier.capacity,
            );
            final qty = _quantities[tier.id] ?? 0;
            final availabilityLimit = available is int ? available : 0;
            final perUserLimit = tier.maxPerUser > 0 ? tier.maxPerUser : 5;
            final maxAllowed = availabilityLimit < perUserLimit
                ? availabilityLimit
                : perUserLimit;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1D192B) : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark ? Colors.white10 : const Color(0xFFEAE8F0),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          tier.name,
                          style: GoogleFonts.poppins(
                            color: textColor,
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
                        ),
                      ),
                      if (soldOut)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'SOLD OUT',
                            style: TextStyle(
                              color: Colors.red,
                              fontWeight: FontWeight.w700,
                              fontSize: 11,
                            ),
                          ),
                        )
                      else
                        Text(
                          '$available left • max $perUserLimit/user',
                          style: GoogleFonts.poppins(
                            color: mutedColor,
                            fontSize: 12,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${tier.price.toStringAsFixed(2)} ETB',
                    style: GoogleFonts.poppins(
                      color: const Color(0xFF8B5CF6),
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _QtyControl(
                    quantity: qty,
                    disableIncrement: soldOut || qty >= maxAllowed,
                    onChanged: (next) {
                      if (next < 0) return;
                      if (next > maxAllowed) return;
                      setState(() => _quantities[tier.id] = next);
                    },
                  ),
                ],
              ),
            );
          }),
        ],
      ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.fromLTRB(
          16,
          12,
          16,
          MediaQuery.of(context).padding.bottom + 12,
        ),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF15131C) : Colors.white,
          border: Border(
            top: BorderSide(
              color: isDark ? Colors.white10 : const Color(0xFFEAE8F0),
            ),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'TOTAL',
                    style: TextStyle(
                      color: mutedColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${_totalAmount.toStringAsFixed(2)} ETB / $_totalTickets tix',
                    style: GoogleFonts.poppins(
                      color: textColor,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, _quantities),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF8B5CF6),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Apply',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QtyControl extends StatelessWidget {
  final int quantity;
  final bool disableIncrement;
  final ValueChanged<int> onChanged;

  const _QtyControl({
    required this.quantity,
    required this.disableIncrement,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1825) : const Color(0xFFF6F4FB),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _button(
            icon: Icons.remove,
            enabled: quantity > 0,
            onTap: () => onChanged(quantity - 1),
            isPrimary: false,
            isDark: isDark,
          ),
          SizedBox(
            width: 34,
            child: Text(
              '$quantity',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
            ),
          ),
          _button(
            icon: Icons.add,
            enabled: !disableIncrement,
            onTap: () => onChanged(quantity + 1),
            isPrimary: true,
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _button({
    required IconData icon,
    required bool enabled,
    required VoidCallback onTap,
    required bool isPrimary,
    required bool isDark,
  }) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isPrimary
              ? const Color(0xFF8B5CF6)
              : (isDark ? Colors.white10 : Colors.white),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          size: 18,
          color: enabled
              ? (isPrimary
                    ? Colors.white
                    : (isDark ? Colors.white : const Color(0xFF1A1823)))
              : (isDark ? Colors.white38 : Colors.black38),
        ),
      ),
    );
  }
}
