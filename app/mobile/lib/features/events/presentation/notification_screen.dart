import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:mobile/features/notifications/models/app_notification.dart';
import 'package:mobile/features/notifications/services/notification_service.dart';

final notificationsProvider = FutureProvider<List<AppNotification>>((ref) async {
  final service = ref.read(notificationServiceProvider);
  return service.getNotifications();
});

class NotificationScreen extends ConsumerWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: const Color(0xFF0F0D15),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            "Notifications",
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 18,
            ),
          ),
          centerTitle: true,
          actions: [
            TextButton(
              onPressed: () {
                // Mark all read logic here if API supports it
              },
              child: Text(
                "Mark all read",
                style: GoogleFonts.poppins(
                  color: const Color(0xFF8B5CF6),
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                ),
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
                unselectedLabelColor: Colors.white60,
                labelStyle: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600),
                unselectedLabelStyle: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500),
                tabAlignment: TabAlignment.start,
                labelPadding: const EdgeInsets.symmetric(horizontal: 24),
                tabs: const [
                  Tab(height: 38, text: "All"),
                  Tab(height: 38, text: "Bookings"),
                  Tab(height: 38, text: "Updates"),
                ],
              ),
            ),
            Expanded(
              child: notificationsAsync.when(
                data: (notifications) {
                    if (notifications.isEmpty) {
                        return Center(child: Text("No notifications", style: GoogleFonts.poppins(color: Colors.white54)));
                    }
                    
                    final now = DateTime.now();
                    final today = notifications.where((n) {
                        final diff = now.difference(n.timestamp);
                        return diff.inHours < 24;
                    }).toList();
                    
                    final earlier = notifications.where((n) {
                         final diff = now.difference(n.timestamp);
                        return diff.inHours >= 24;
                    }).toList();

                    return TabBarView(
                        children: [
                        _NotificationListView(today: today, earlier: earlier),
                        _NotificationListView(
                            today: today.where((n) => n.type == 'booking').toList(), 
                            earlier: earlier.where((n) => n.type == 'booking').toList()
                        ),
                        _NotificationListView(
                             today: today.where((n) => n.type == 'update' || n.type == 'alert').toList(), 
                            earlier: earlier.where((n) => n.type == 'update' || n.type == 'alert').toList()
                        ),
                        ],
                    );
                },
                loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6))),
                error: (err, stack) => Center(child: Text("Error: $err", style: const TextStyle(color: Colors.red))),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationListView extends StatelessWidget {
  final List<AppNotification> today;
  final List<AppNotification> earlier;

  const _NotificationListView({required this.today, required this.earlier});

  @override
  Widget build(BuildContext context) {
    if (today.isEmpty && earlier.isEmpty) {
         return Center(child: Text("No notifications", style: GoogleFonts.poppins(color: Colors.white54)));
    }
  
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      children: [
        if (today.isNotEmpty) ...[
          _SectionHeader(title: "Today"),
          const SizedBox(height: 16),
          ...today.map((n) => _NotificationTile(notification: n)),
        ],
        if (earlier.isNotEmpty) ...[
          const SizedBox(height: 24),
          _SectionHeader(title: "Earlier"),
          const SizedBox(height: 16),
          ...earlier.map((n) => _NotificationTile(notification: n)),
        ],
        const SizedBox(height: 32),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        color: Colors.white,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final AppNotification notification;
  const _NotificationTile({required this.notification});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _NotificationIcon(type: notification.type),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(child: Text(
                          notification.title,
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        )),
                        if (!notification.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFF8B5CF6),
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notification.description,
                      style: GoogleFonts.poppins(
                        color: Colors.white60,
                        fontSize: 13,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _formatTimestamp(notification.timestamp),
                      style: GoogleFonts.poppins(
                        color: Colors.white38,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (notification.metadata != null) ...[
            const SizedBox(height: 16),
            _BookingCard(metadata: notification.metadata!),
          ],
        ],
      ),
    );
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 60) return "${diff.inMinutes}m ago";
    if (diff.inHours < 24) return "${diff.inHours}h ago";
    if (diff.inDays == 1) return "Yesterday";
    if (diff.inDays < 7) return "${diff.inDays} days ago";
    return DateFormat('MMM d').format(dt);
  }
}

class _NotificationIcon extends StatelessWidget {
  final String type;
  const _NotificationIcon({required this.type});

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color bgColor;
    Color iconColor;

    switch (type) {
      case 'reminder':
        icon = Icons.calendar_today_outlined;
        bgColor = const Color(0xFF1D192B);
        iconColor = const Color(0xFF8B5CF6);
        break;
      case 'booking':
        icon = Icons.check_circle_outline;
        bgColor = const Color(0xFF162320);
        iconColor = Colors.greenAccent;
        break;
      case 'update':
        icon = Icons.campaign_outlined;
        bgColor = const Color(0xFF2B1D19);
        iconColor = Colors.orangeAccent;
        break;
      case 'alert':
        icon = Icons.lock_outline;
        bgColor = const Color(0xFF191D2B);
        iconColor = Colors.blueAccent;
        break;
      default:
        icon = Icons.notifications_outlined;
        bgColor = const Color(0xFF1D192B);
        iconColor = Colors.white54;
    }

    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: iconColor, size: 24),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Map<String, dynamic> metadata;
  const _BookingCard({required this.metadata});

  @override
  Widget build(BuildContext context) {
      // Basic fallback if metadata is missing expected keys
      final orderId = metadata['orderId'] ?? '---';
      final eventTitle = metadata['eventTitle'] ?? 'Event';
      final eventTime = metadata['eventTime'] ?? '';

    return Container(
      margin: const EdgeInsets.only(left: 64),
      decoration: BoxDecoration(
        color: const Color(0xFF1D192B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.confirmation_num, color: Color(0xFF8B5CF6), size: 14),
                    const SizedBox(width: 8),
                    Text(
                      "ORDER $orderId".toUpperCase(),
                      style: GoogleFonts.poppins(
                        color: Colors.white38,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  eventTitle,
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  eventTime,
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
    );
  }
}
