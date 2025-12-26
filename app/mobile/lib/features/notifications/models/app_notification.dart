class AppNotification {
  final String id;
  final String title;
  final String description;
  final String type; // 'reminder', 'booking', 'update', 'alert'
  final DateTime timestamp;
  final bool isRead;
  final Map<String, dynamic>? metadata;

  AppNotification({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.timestamp,
    this.isRead = false,
    this.metadata,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    // Map backend 'channel' or 'title' to UI 'type'
    String type = 'update';
    final title = json['title'] ?? '';
    if (title.contains('Reminder')) type = 'reminder';
    else if (title.contains('Booking') || title.contains('Ticket')) type = 'booking';
    else if (title.contains('Alert')) type = 'alert';

    return AppNotification(
      id: json['id'].toString(),
      title: title,
      description: json['content'] ?? '',
      type: type,
      timestamp: DateTime.parse(json['createdAt']),
      isRead: json['status'] == 'READ', // Backend mostly uses SENT/FAILED
      metadata: json['metadata'],
    );
  }
}
