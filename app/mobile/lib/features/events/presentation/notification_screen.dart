import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/features/notifications/models/app_notification.dart';
import 'package:mobile/features/notifications/services/notification_service.dart';

import 'package:mobile/features/profile/services/profile_service.dart';
import '../../../../core/providers.dart';

final notificationsProvider = FutureProvider.autoDispose<List<AppNotification>>((ref) async {
  // Watch token to ensure refresh on logout/login
  final token = ref.watch(authTokenProvider);
  if (token == null) return [];

  final service = ref.read(notificationServiceProvider);
  // We don't necessarily need to wait for profile if the token is enough, 
  // but filtering relies on profile role. 
  // Since userProfileProvider is watched, it will trigger this provider update when profile loads.
  final profile = await ref.watch(userProfileProvider.future);
  
  final allNotifications = await service.getNotifications();
  int? organizerId;
  if (profile.role == 'ORGANIZER') {
    try {
      final organizerProfile = await ref.read(profileServiceProvider).getOrganizerProfile();
      organizerId = organizerProfile['id'] is int
          ? organizerProfile['id']
          : int.tryParse(organizerProfile['id']?.toString() ?? '');
    } catch (_) {
      organizerId = null;
    }
  }
  
  // Filter notifications based on role and IDs
  return allNotifications.where((n) {
    // If it's a general notification (no IDs), show to everyone
    if (n.userId == null && n.organizerId == null) return true;
    
    // If user is a regular user, show only their notifications
    if (profile.role == 'USER') {
      return n.userId == profile.id;
    }
    
    // If user is an organizer, show their notifications
    if (profile.role == 'ORGANIZER') {
       // Check meta for organizer id or if organizerId matches
       // Usually organizerId corresponds to their profile id
       return (organizerId != null && n.organizerId == organizerId) || n.userId == profile.id;
    }
    
    return true;
  }).toList();
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  final notificationsAsync = ref.watch(notificationsProvider);
  return notificationsAsync.when(
    data: (notifications) => notifications.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});

class NotificationScreen extends ConsumerWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final backgroundColor = isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA);
    final unreadCount = notificationsAsync.maybeWhen(
      data: (notifications) => notifications.where((n) => !n.isRead).length,
      orElse: () => 0,
    );

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
            "notifications.title".tr(),
            style: GoogleFonts.poppins(
              color: textColor,
              fontWeight: FontWeight.w600,
              fontSize: 18,
            ),
          ),
          centerTitle: true,
          actions: [
            if (unreadCount > 0)
              TextButton(
                onPressed: () async {
                  final service = ref.read(notificationServiceProvider);
                  await service.markAllAsRead();
                  ref.invalidate(notificationsProvider);
                  
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text("notifications.mark_all_success".tr())),
                    );
                  }
                },
                child: Text(
                  "notifications.mark_all_read".tr(),
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
                unselectedLabelColor: isDark ? Colors.white60 : Colors.black54,
                labelStyle: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600),
                unselectedLabelStyle: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500),
                tabAlignment: TabAlignment.start,
                labelPadding: const EdgeInsets.symmetric(horizontal: 24),
                tabs: [
                  Tab(height: 38, text: "notifications.all_tab".tr()),
                  Tab(height: 38, text: "notifications.bookings_tab".tr()),
                  Tab(height: 38, text: "notifications.updates_tab".tr()),
                ],
              ),
            ),
            Expanded(
              child: notificationsAsync.when(
                data: (notifications) {
                    if (notifications.isEmpty) {
                        return Center(child: Text("notifications.no_notif".tr(), style: GoogleFonts.poppins(color: isDark ? Colors.white54 : Colors.black45)));
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
                        _NotificationListView(today: today, earlier: earlier, isDark: isDark, textColor: textColor),
                        _NotificationListView(
                            today: today.where((n) => n.type == 'booking').toList(), 
                            earlier: earlier.where((n) => n.type == 'booking').toList(),
                            isDark: isDark,
                            textColor: textColor,
                        ),
                        _NotificationListView(
                             today: today.where((n) => n.type == 'update' || n.type == 'alert').toList(), 
                            earlier: earlier.where((n) => n.type == 'update' || n.type == 'alert').toList(),
                            isDark: isDark,
                            textColor: textColor,
                        ),
                        ],
                    );
                },
                loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6))),
                error: (err, stack) => Center(child: Text("${"common.error".tr()}: $err", style: const TextStyle(color: Colors.red))),
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
  final bool isDark;
  final Color textColor;

  const _NotificationListView({
    required this.today,
    required this.earlier,
    required this.isDark,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    if (today.isEmpty && earlier.isEmpty) {
         return Center(child: Text("No notifications", style: GoogleFonts.poppins(color: isDark ? Colors.white54 : Colors.black45)));
    }
  
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      children: [
        if (today.isNotEmpty) ...[
          _SectionHeader(title: "notifications.today".tr(), textColor: textColor),
          const SizedBox(height: 16),
          ...today.map(
            (n) => _DismissibleNotificationTile(
              notification: n,
              textColor: textColor,
              isDark: isDark,
            ),
          ),
        ],
        if (earlier.isNotEmpty) ...[
          const SizedBox(height: 24),
          _SectionHeader(title: "notifications.earlier".tr(), textColor: textColor),
          const SizedBox(height: 16),
          ...earlier.map(
            (n) => _DismissibleNotificationTile(
              notification: n,
              textColor: textColor,
              isDark: isDark,
            ),
          ),
        ],
        const SizedBox(height: 32),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final Color textColor;
  const _SectionHeader({required this.title, required this.textColor});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        color: textColor,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}

class _NotificationTile extends ConsumerWidget {
  final AppNotification notification;
  final Color textColor;
  final bool isDark;
  
  const _NotificationTile({
    required this.notification,
    required this.textColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: InkWell(
        onTap: () async {
          if (!notification.isRead) {
            final service = ref.read(notificationServiceProvider);
            await service.markAsRead(notification.id);
            ref.invalidate(notificationsProvider);
          }
        },
        borderRadius: BorderRadius.circular(12),
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
                            color: textColor,
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
                        color: textColor.withOpacity(0.6),
                        fontSize: 13,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _formatTimestamp(notification.timestamp),
                      style: GoogleFonts.poppins(
                        color: textColor.withOpacity(0.38),
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
            _BookingCard(metadata: notification.metadata!, isDark: isDark, textColor: textColor),
          ],
          ],
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 60) return "notifications.m_ago".tr(args: [diff.inMinutes.toString()]);
    if (diff.inHours < 24) return "notifications.h_ago".tr(args: [diff.inHours.toString()]);
    if (diff.inDays == 1) return "notifications.yesterday".tr();
    if (diff.inDays < 7) return "notifications.days_ago".tr(args: [diff.inDays.toString()]);
    return DateFormat('MMM d').format(dt);
  }
}

class _DismissibleNotificationTile extends ConsumerStatefulWidget {
  final AppNotification notification;
  final Color textColor;
  final bool isDark;

  const _DismissibleNotificationTile({
    required this.notification,
    required this.textColor,
    required this.isDark,
  });

  @override
  ConsumerState<_DismissibleNotificationTile> createState() => _DismissibleNotificationTileState();
}

class _DismissibleNotificationTileState extends ConsumerState<_DismissibleNotificationTile> {
  Timer? _deleteTimer;
  bool _pendingDelete = false;
  bool _isProcessing = false;

  @override
  void dispose() {
    _deleteTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey('notification-${widget.notification.id}'),
      direction: DismissDirection.horizontal,
      background: _buildDismissBackground(Alignment.centerLeft),
      secondaryBackground: _buildDismissBackground(Alignment.centerRight),
      confirmDismiss: (_) async {
        if (_isProcessing) return false;
        _isProcessing = true;
        _startDeleteWithUndo();
        _isProcessing = false;
        return false;
      },
      child: Column(
        children: [
          _NotificationTile(notification: widget.notification, textColor: widget.textColor, isDark: widget.isDark),
          Divider(height: 1, color: widget.textColor.withOpacity(0.06)),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _startDeleteWithUndo() {
    if (_pendingDelete) return;
    _pendingDelete = true;
    _deleteTimer?.cancel();

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Notification deleted'),
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'Undo',
          onPressed: _undoDelete,
        ),
      ),
    );

    _deleteTimer = Timer(const Duration(seconds: 4), () async {
      if (!_pendingDelete) return;
      if (!mounted) return;

      try {
        final service = ref.read(notificationServiceProvider);
        await service.deleteNotification(widget.notification.id);
        if (!mounted) return;
        ref.invalidate(notificationsProvider);
      } catch (e) {
        if (!mounted) return;
        ref.invalidate(notificationsProvider);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete notification: $e')),
        );
      } finally {
        _pendingDelete = false;
      }
    });
  }

  void _undoDelete() {
    if (!mounted) return;
    _pendingDelete = false;
    _deleteTimer?.cancel();
    _deleteTimer = null;
    ref.invalidate(notificationsProvider);
  }

  Widget _buildDismissBackground(Alignment alignment) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      alignment: alignment,
      decoration: BoxDecoration(
        color: const Color(0xFFEF4444).withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: alignment == Alignment.centerLeft
            ? MainAxisAlignment.start
            : MainAxisAlignment.end,
        children: const [
          Icon(Icons.delete_outline, color: Color(0xFFEF4444)),
          SizedBox(width: 8),
          Text('Delete', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.w600)),
        ],
      ),
    );
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
  final bool isDark;
  final Color textColor;
  
  const _BookingCard({
    required this.metadata,
    required this.isDark,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
      // Basic fallback if metadata is missing expected keys
      final orderId = metadata['orderId'] ?? '---';
      final eventTitle = metadata['eventTitle'] ?? 'Event';
      final eventTime = metadata['eventTime'] ?? '';

    return Container(
      margin: const EdgeInsets.only(left: 64, top: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1D192B) : Colors.grey[100],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: textColor.withOpacity(0.05)),
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
                      "${"notifications.order_prefix".tr()} $orderId".toUpperCase(),
                      style: GoogleFonts.poppins(
                        color: textColor.withOpacity(0.38),
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
                    color: textColor,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  eventTime,
                  style: GoogleFonts.poppins(
                    color: textColor.withOpacity(0.5),
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
