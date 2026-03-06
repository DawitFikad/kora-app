class EventEngagement {
  final int likesCount;
  final double averageRating;
  final int ratingsCount;
  final bool userLiked;
  final int? userRating;
  final String? userComment;

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
      likesCount: (json['likesCount'] as num?)?.toInt() ?? 0,
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0,
      ratingsCount: (json['ratingsCount'] as num?)?.toInt() ?? 0,
      userLiked: json['userLiked'] == true,
      userRating: (json['userRating'] as num?)?.toInt(),
      userComment: json['userComment'] as String?,
    );
  }
}
