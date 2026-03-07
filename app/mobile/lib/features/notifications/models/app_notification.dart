class AppNotification {
  final String id;
  final String title;
  final String description;
  final String type; // UI bucket: 'reminder', 'booking', 'update', 'alert'
  final String? notificationType; // Backend semantic type (e.g. EVENT_REMINDER)
  final String? referenceId;
  final DateTime timestamp;
  final bool isRead;
  final Map<String, dynamic>? metadata;
  final int? userId;
  final int? organizerId;

  AppNotification({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    this.notificationType,
    this.referenceId,
    required this.timestamp,
    this.isRead = false,
    this.metadata,
    this.userId,
    this.organizerId,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final metadata = json['metadata'] as Map<String, dynamic>?;
    final semanticType = metadata?['type']?.toString();

    // Map backend semantic type/title into UI tabs.
    String type = 'update';
    final title = json['title'] ?? '';
    if (semanticType == 'TICKET_CONFIRMATION') {
      type = 'booking';
    } else if (semanticType == 'EVENT_REMINDER') {
      type = 'reminder';
    } else if (semanticType == 'EVENT_CANCELLED') {
      type = 'alert';
    } else if (title.contains('Reminder')) {
      type = 'reminder';
    } else if (title.contains('Booking') || title.contains('Ticket'))
      type = 'booking';
    else if (title.contains('Alert'))
      type = 'alert';

    return AppNotification(
      id: json['id'].toString(),
      title: title,
      description: json['content'] ?? '',
      type: type,
      notificationType: semanticType,
      referenceId: metadata?['referenceId']?.toString(),
      timestamp: DateTime.parse(json['createdAt']),
      isRead: json['isRead'] ?? false,
      metadata: metadata,
      userId: json['userId'] is int
          ? json['userId']
          : (json['userId'] != null
                ? int.tryParse(json['userId'].toString())
                : null),
      organizerId: json['organizerId'] is int
          ? json['organizerId']
          : (json['organizerId'] != null
                ? int.tryParse(json['organizerId'].toString())
                : null),
    );
  }
}
