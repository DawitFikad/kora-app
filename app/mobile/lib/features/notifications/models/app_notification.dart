class AppNotification {
  final String id;
  final String title;
  final String description;
  final String type; // 'reminder', 'booking', 'update', 'alert'
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
    required this.timestamp,
    this.isRead = false,
    this.metadata,
    this.userId,
    this.organizerId,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    // Map backend 'channel' or 'title' to UI 'type'
    String type = 'update';
    final title = json['title'] ?? '';
    if (title.contains('Reminder')) {
      type = 'reminder';
    } else if (title.contains('Booking') || title.contains('Ticket')) type = 'booking';
    else if (title.contains('Alert')) type = 'alert';

    return AppNotification(
      id: json['id'].toString(),
      title: title,
      description: json['content'] ?? '',
      type: type,
      timestamp: DateTime.parse(json['createdAt']),
      isRead: json['isRead'] ?? false,
      metadata: json['metadata'],
      userId: json['userId'] is int ? json['userId'] : (json['userId'] != null ? int.tryParse(json['userId'].toString()) : null),
      organizerId: json['organizerId'] is int ? json['organizerId'] : (json['organizerId'] != null ? int.tryParse(json['organizerId'].toString()) : null),
    );
  }
}
