class Event {
  final int id;
  final String title;
  final String description;
  final String venue;
  final String dateTime;
  final String? coverImage;

  Event({
    required this.id,
    required this.title,
    required this.description,
    required this.venue,
    required this.dateTime,
    this.coverImage,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'],
      title: json['title'],
      description: json['description'] ?? '',
      venue: json['venue'],
      dateTime: json['dateTime'],
      coverImage: json['coverImage'],
    );
  }
}
