class EventEngagement {
  final int likesCount;
  final double averageRating;
  final int ratingsCount;
  final bool userLiked;
  final int? userRating;
  final String? userComment;

  static int _toInt(dynamic value, {int fallback = 0}) {
    if (value == null) return fallback;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? fallback;
  }

  static double _toDouble(dynamic value, {double fallback = 0}) {
    if (value == null) return fallback;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? fallback;
  }

  const EventEngagement({
    required this.likesCount,
    required this.averageRating,
    required this.ratingsCount,
    required this.userLiked,
    required this.userRating,
    required this.userComment,
  });

  factory EventEngagement.fromJson(Map<String, dynamic> json) {
    return EventEngagement(
      likesCount: _toInt(json['likesCount']),
      averageRating: _toDouble(json['averageRating']),
      ratingsCount: _toInt(json['ratingsCount']),
      userLiked: json['userLiked'] == true,
      userRating: json['userRating'] == null
          ? null
          : _toInt(json['userRating']),
      userComment: json['userComment'] as String?,
    );
  }
}
