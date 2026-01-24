import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mobile/core/widgets/app_image.dart';
import 'package:mobile/features/tickets/services/ticket_service.dart';
import 'package:mobile/features/tickets/models/ticket.dart';
import 'package:mobile/features/tickets/presentation/ticket_detail_screen.dart';
import '../../events/presentation/home_screen.dart';
import 'package:go_router/go_router.dart';

final myTicketsProvider = FutureProvider<List<Ticket>>((ref) async {
  // Watch for auth changes to refresh ticket list
  ref.watch(authTokenProvider);
  final service = ref.watch(ticketServiceProvider);
  return service.getMyTickets();
});

class MyTicketsScreen extends ConsumerWidget {
  const MyTicketsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final cardColor = isDark ? const Color(0xFF1D192B) : Colors.white;
    final backgroundColor = isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: backgroundColor,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: textColor),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            "My Tickets",
            style: GoogleFonts.poppins(
              color: textColor,
              fontWeight: FontWeight.w600,
              fontSize: 22,
            ),
          ),
          actions: [
            Container(
              margin: const EdgeInsets.only(right: 16),
              decoration: BoxDecoration(
                color: textColor.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: Icon(Icons.tune, color: textColor, size: 20),
                onPressed: () {},
              ),
            ),
          ],
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: TabBar(
                isScrollable: true,
                indicator: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  color: const Color(0xFF8B5CF6),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: Colors.white,
                unselectedLabelColor: isDark ? Colors.white60 : Colors.black54,
                labelStyle: GoogleFonts.poppins(
                   fontSize: 14,
                   fontWeight: FontWeight.w600,
                ),
                unselectedLabelStyle: GoogleFonts.poppins(
                   fontSize: 14,
                   fontWeight: FontWeight.w500,
                ),
                tabAlignment: TabAlignment.start,
                labelPadding: const EdgeInsets.symmetric(horizontal: 24),
                tabs: const [
                  Tab(height: 38, text: "Upcoming"),
                  Tab(height: 38, text: "Past"),
                  Tab(height: 38, text: "Archived"),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                children: [
                  _TicketsListView(ref: ref, isPast: false, isDark: isDark, textColor: textColor, cardColor: cardColor, backgroundColor: backgroundColor),
                  _TicketsListView(ref: ref, isPast: true, isDark: isDark, textColor: textColor, cardColor: cardColor, backgroundColor: backgroundColor),
                  _buildEmptyState(context, ref, "No archived tickets", textColor.withOpacity(0.5)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, WidgetRef ref, String message, Color color) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            message,
            style: GoogleFonts.poppins(color: color),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () {
              ref.read(homeIndexProvider.notifier).state = 0;
              context.go('/home');
            },
            child: const Text(
              "Explore Events",
              style: TextStyle(color: Color(0xFF8B5CF6), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}

class _TicketsListView extends StatelessWidget {
  final WidgetRef ref;
  final bool isPast;
  final bool isDark;
  final Color textColor;
  final Color cardColor;
  final Color backgroundColor;
  
  const _TicketsListView({
    required this.ref, 
    this.isPast = false,
    required this.isDark,
    required this.textColor,
    required this.cardColor,
    required this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(myTicketsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.refresh(myTicketsProvider),
      child: ticketsAsync.when(
        data: (tickets) {
          final now = DateTime.now();
          final filteredTickets = tickets.where((ticket) {
            final eventDate = DateTime.parse(ticket.event.dateTime);
            final isToday = eventDate.year == now.year && eventDate.month == now.month && eventDate.day == now.day;
            
            if (isPast) {
               // Show if status is not valid (used/refunded) OR if it was a previous day
               return ticket.status != 'VALID' || (eventDate.isBefore(now) && !isToday);
            } else {
               // Show in upcoming if it's VALID and (happening today OR in the future)
               return ticket.status == 'VALID' && (eventDate.isAfter(now) || isToday);
            }
          }).toList();

          if (filteredTickets.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    isPast ? "No past tickets" : "No upcoming tickets",
                    style: TextStyle(color: textColor.withOpacity(0.5)),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () {
                      ref.read(homeIndexProvider.notifier).state = 0;
                      context.go('/home');
                    },
                    child: const Text(
                      "Explore Events",
                      style: TextStyle(color: Color(0xFF8B5CF6), fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            itemCount: filteredTickets.length,
            itemBuilder: (context, index) {
              if (index == 0 && !isPast) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => TicketDetailScreen(ticket: filteredTickets[index])),
                    ),
                    child: _LargeTicketCard(ticket: filteredTickets[index], isDark: isDark, textColor: textColor, cardColor: cardColor, backgroundColor: backgroundColor),
                  ),
                );
              }
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: GestureDetector(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => TicketDetailScreen(ticket: filteredTickets[index])),
                  ),
                  child: _CompactTicketCard(ticket: filteredTickets[index], isDark: isDark, textColor: textColor, cardColor: cardColor),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6))),
        error: (err, stack) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
      ),
    );
  }
}

class _LargeTicketCard extends StatelessWidget {
  final Ticket ticket;
  final bool isDark;
  final Color textColor;
  final Color cardColor;
  final Color backgroundColor;

  const _LargeTicketCard({
    required this.ticket,
    required this.isDark,
    required this.textColor,
    required this.cardColor,
    required this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final eventDate = DateTime.parse(ticket.event.dateTime);

    return Container(
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(28),
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
          // Image and Status Badge
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                child: AppImage(
                  imageUrl: ticket.event.coverImage,
                  height: 200,
                  width: double.infinity,
                  placeholder: 'https://picsum.photos/800/400',
                ),
              ),
              Positioned(
                top: 16,
                left: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        "Active",
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ticket.event.title,
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "${ticket.event.venue} • ${DateFormat('MMM d, y').format(eventDate)} • ${DateFormat('h:mm a').format(eventDate)}",
                  style: GoogleFonts.poppins(
                    color: textColor.withOpacity(0.5),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 24),
                // Section Info
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildTicketDetail("SECTION", "B", textColor),
                    _buildTicketDetail("ROW", "4", textColor),
                    _buildTicketDetail("SEAT", ticket.seatNumber ?? "12", textColor),
                  ],
                ),
              ],
            ),
          ),
          // Dashed Line
          Row(
            children: [
              Container(
                height: 20,
                width: 10,
                decoration: BoxDecoration(
                  color: backgroundColor,
                  borderRadius: const BorderRadius.only(
                    topRight: Radius.circular(10),
                    bottomRight: Radius.circular(10),
                  ),
                ),
              ),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    return Flex(
                      direction: Axis.horizontal,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(
                        (constraints.constrainWidth() / 15).floor(),
                        (index) => SizedBox(
                          width: 8,
                          height: 1,
                          child: DecoratedBox(decoration: BoxDecoration(color: textColor.withOpacity(0.1))),
                        ),
                      ),
                    );
                  },
                ),
              ),
              Container(
                height: 20,
                width: 10,
                decoration: BoxDecoration(
                  color: backgroundColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(10),
                    bottomLeft: Radius.circular(10),
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Text(
                  "ENTRY CODE",
                  style: GoogleFonts.poppins(
                    color: textColor.withOpacity(0.38),
                    fontSize: 12,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  ticket.ticketCode != null 
                    ? ticket.ticketCode!.toUpperCase() 
                    : (ticket.id.length > 8 
                        ? "${ticket.id.substring(0, 4)} - ${ticket.id.substring(4, 8)}".toUpperCase()
                        : ticket.id.toUpperCase()),
                  style: GoogleFonts.poppins(
                    color: textColor,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 24),
                // QR Code
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: QrImageView(
                    data: ticket.qrPayload,
                    version: QrVersions.auto,
                    size: 140.0,
                    padding: EdgeInsets.zero,
                  ),
                ),
                const SizedBox(height: 24),
                // Apple Wallet Button
                ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.wallet, size: 20),
                  label: const Text("Add to Apple Wallet"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.green, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          "Available Offline",
                          style: GoogleFonts.poppins(color: textColor.withOpacity(0.7), fontSize: 13),
                        ),
                      ],
                    ),
                    TextButton(
                      onPressed: () {},
                      child: Text(
                        "Details",
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF8B5CF6),
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
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
    );
  }

  Widget _buildTicketDetail(String label, String value, Color textColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(color: textColor.withOpacity(0.38), fontSize: 10, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.poppins(color: textColor, fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

class _CompactTicketCard extends StatelessWidget {
  final Ticket ticket;
  final bool isDark;
  final Color textColor;
  final Color cardColor;

  const _CompactTicketCard({
    required this.ticket,
    required this.isDark,
    required this.textColor,
    required this.cardColor,
  });

  @override
  Widget build(BuildContext context) {
    final eventDate = DateTime.parse(ticket.event.dateTime);

    return Container(
      height: 100,
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: isDark ? null : [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(16),
              bottomLeft: Radius.circular(16),
            ),
            child: AppImage(
              imageUrl: ticket.event.coverImage,
              width: 100,
              height: 100,
              placeholder: 'https://picsum.photos/200',
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "${DateFormat('MMM d').format(eventDate)} • ${DateFormat('h:mm a').format(eventDate)}".toUpperCase(),
                    style: GoogleFonts.poppins(color: const Color(0xFF8B5CF6), fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    ticket.event.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(color: textColor, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    ticket.event.venue,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(color: textColor.withOpacity(0.53), fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          // Vertical Dashed Divider
          Container(
            width: 1,
            margin: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              children: List.generate(
                5,
                (index) => Expanded(
                  child: Container(
                    width: 1,
                    color: index % 2 == 0 ? textColor.withOpacity(0.12) : Colors.transparent,
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Icon(Icons.qr_code_2, color: textColor.withOpacity(0.54), size: 24),
          ),
        ],
      ),
    );
  }
}
