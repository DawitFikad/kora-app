import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/ticket.dart';
import '../../../core/widgets/app_image.dart';

class TicketDetailScreen extends StatelessWidget {
  final Ticket ticket;

  const TicketDetailScreen({super.key, required this.ticket});

  @override
  Widget build(BuildContext context) {
    final eventDate = DateTime.parse(ticket.event.dateTime);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final cardColor = isDark ? const Color(0xFF1D192B) : Colors.white;
    final backgroundColor = isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA);

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: textColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Ticket Details",
          style: GoogleFonts.poppins(color: textColor, fontWeight: FontWeight.w600),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: Column(
          children: [
            Container(
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(32),
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
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                    child: AppImage(
                      imageUrl: ticket.event.coverImage,
                      height: 180,
                      width: double.infinity,
                      placeholder: 'https://picsum.photos/800/400',
                    ),
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
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.location_on, color: Color(0xFF8B5CF6), size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                ticket.event.venue,
                                style: GoogleFonts.poppins(color: textColor.withOpacity(0.7), fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.calendar_today, color: Color(0xFF8B5CF6), size: 16),
                            const SizedBox(width: 8),
                            Text(
                              "${DateFormat('EEEE, MMM d').format(eventDate)} • ${DateFormat('h:mm a').format(eventDate)}",
                              style: GoogleFonts.poppins(color: textColor.withOpacity(0.7), fontSize: 14),
                            ),
                          ],
                        ),
                        const SizedBox(height: 32),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildInfoItem("SECTION", "B", textColor),
                            _buildInfoItem("ROW", "4", textColor),
                            _buildInfoItem("SEAT", ticket.seatNumber ?? "12", textColor),
                          ],
                        ),
                        const SizedBox(height: 32),
                        Center(
                          child: Column(
                            children: [
                              Text(
                                "SCAN THIS QR CODE AT THE ENTRY",
                                style: GoogleFonts.poppins(
                                  color: textColor.withOpacity(0.38),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 1.2,
                                ),
                              ),
                              const SizedBox(height: 24),
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(24),
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
                                  size: 180.0,
                                  padding: EdgeInsets.zero,
                                ),
                              ),
                              const SizedBox(height: 24),
                              Text(
                                ticket.ticketCode != null 
                                  ? ticket.ticketCode!.toUpperCase() 
                                  : ticket.id.substring(0, 8).toUpperCase(),
                                style: GoogleFonts.poppins(
                                  color: textColor,
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.download_rounded),
              label: const Text("Download PDF"),
              style: ElevatedButton.styleFrom(
                backgroundColor: isDark ? Colors.white10 : Colors.black.withOpacity(0.05),
                foregroundColor: textColor,
                minimumSize: const Size(double.infinity, 56),
                shadowColor: Colors.transparent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem(String label, String value, Color textColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(color: textColor.withOpacity(0.38), fontSize: 11, fontWeight: FontWeight.w600),
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
