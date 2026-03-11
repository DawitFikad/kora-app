import 'package:mobile/features/events/models/ticket_tier.dart';
import 'package:mobile/features/events/models/category.dart';
import 'package:mobile/features/events/models/city.dart';

class Event {
  final int id;
  final String title;
  final String? titleTag;
  final String description;
  final String venue;
  final String dateTime;
  final String? coverImage;
  final bool featured;
  final int? totalCapacity;
  final int? ticketsAvailable;
  final bool? isExplorationPick;
  final String? personalizedTag;
  final bool? livestreamAvailable;
  final bool? nomineesInfoAvailable;
  final bool? winnersInfoAvailable;
  final bool? earlyBirdAvailable;
  final bool? preRegistrationAvailable;
  final bool? reminderAvailable;
  final bool? userPreRegistered;
  final bool? userReminderSubscribed;
  final List<String> movieHighlights;
  final List<String> workshopTopics;
  final String? dealTag;
  final bool? hasBundle;
  final bool? hasPartner;
  final bool? hasLimitedTime;

  // Policy fields
  final String? refundPolicy;
  final int minAge;
  final String? additionalPolicy;
  final bool hasSeatMap;

  // Relations
  final List<TicketTier> tiers;
  final Category? category;
  final City? city;

  // Movie Metadata
  final bool isMovie;
  final String? director;
  final String? cast;
  final int? duration;
  final String? rating;
  final String? trailerUrl;
  final String? status;
  final int likesCount;
  final double averageRating;
  final int ratingsCount;

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

  static (String cleanTitle, String? titleTag) _parseTitle(dynamic rawTitle) {
    final source = (rawTitle?.toString() ?? 'Untitled').trim();
    final match = RegExp(r'^\[([^\]]+)\]\s*(.+)$').firstMatch(source);
    if (match == null) {
      return (source.isEmpty ? 'Untitled' : source, null);
    }
    final tag = match.group(1)?.trim();
    final clean = match.group(2)?.trim();
    return (
      (clean == null || clean.isEmpty) ? source : clean,
      (tag == null || tag.isEmpty) ? null : tag,
    );
  }

  Event({
    required this.id,
    required this.title,
    this.titleTag,
    required this.description,
    required this.venue,
    required this.dateTime,
    this.coverImage,
    this.featured = false,
    this.totalCapacity,
    this.ticketsAvailable,
    this.isExplorationPick,
    this.personalizedTag,
    this.livestreamAvailable,
    this.nomineesInfoAvailable,
    this.winnersInfoAvailable,
    this.earlyBirdAvailable,
    this.preRegistrationAvailable,
    this.reminderAvailable,
    this.userPreRegistered,
    this.userReminderSubscribed,
    this.movieHighlights = const [],
    this.workshopTopics = const [],
    this.dealTag,
    this.hasBundle,
    this.hasPartner,
    this.hasLimitedTime,
    this.refundPolicy,
    this.minAge = 0,
    this.additionalPolicy,
    this.hasSeatMap = false,
    this.tiers = const [],
    this.category,
    this.city,
    this.isMovie = false,
    this.director,
    this.cast,
    this.duration,
    this.rating,
    this.trailerUrl,
    this.status,
    this.likesCount = 0,
    this.averageRating = 0,
    this.ratingsCount = 0,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    final parsedTitle = _parseTitle(json['title']);

    return Event(
      id: json['id'] is int
          ? json['id']
          : (int.tryParse(json['id']?.toString() ?? '') ?? 0),
      title: parsedTitle.$1,
      titleTag: parsedTitle.$2,
      description: json['description'] ?? '',
      venue: json['venue'] ?? 'TBA',
      dateTime: json['dateTime'] ?? DateTime.now().toIso8601String(),
      coverImage: json['coverImage'],
      featured: json['featured'] ?? false,
      totalCapacity: json['totalCapacity'],
      ticketsAvailable: json['ticketsAvailable'],
      isExplorationPick: json['isExplorationPick'],
      personalizedTag: json['personalizedTag'],
      livestreamAvailable: json['livestreamAvailable'],
      nomineesInfoAvailable: json['nomineesInfoAvailable'],
      winnersInfoAvailable: json['winnersInfoAvailable'],
      earlyBirdAvailable: json['earlyBirdAvailable'],
      preRegistrationAvailable: json['preRegistrationAvailable'],
      reminderAvailable: json['reminderAvailable'],
      userPreRegistered: json['userPreRegistered'],
      userReminderSubscribed: json['userReminderSubscribed'],
      movieHighlights:
          (json['movieHighlights'] as List<dynamic>?)
              ?.map((item) => item.toString())
              .toList() ??
          const [],
      workshopTopics:
          (json['workshopTopics'] as List<dynamic>?)
              ?.map((item) => item.toString())
              .toList() ??
          const [],
      dealTag: json['dealTag']?.toString(),
      hasBundle: json['hasBundle'] as bool?,
      hasPartner: json['hasPartner'] as bool?,
      hasLimitedTime: json['hasLimitedTime'] as bool?,
      refundPolicy: json['refundPolicy'],
      minAge: json['minAge'] ?? 0,
      additionalPolicy: json['additionalPolicy'],
      hasSeatMap: json['hasSeatMap'] ?? false,
      tiers:
          (json['tiers'] as List<dynamic>?)
              ?.map((e) => TicketTier.fromJson(e))
              .toList() ??
          [],
      category: json['category'] != null
          ? Category.fromJson(json['category'])
          : null,
      city: json['city'] != null ? City.fromJson(json['city']) : null,
      isMovie: json['isMovie'] ?? false,
      director: json['director'],
      cast: json['cast'],
      duration: json['duration'],
      rating: json['rating'],
      trailerUrl: json['trailerUrl'],
      status: json['status']?.toString(),
      likesCount: _toInt(json['likesCount']),
      averageRating: _toDouble(
        json['averageRating'],
        fallback: _toDouble(json['rating']),
      ),
      ratingsCount: _toInt(json['ratingsCount']),
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'titleTag': titleTag,
      'description': description,
      'venue': venue,
      'dateTime': dateTime,
      'coverImage': coverImage,
      'featured': featured,
      'totalCapacity': totalCapacity,
      'ticketsAvailable': ticketsAvailable,
      'isExplorationPick': isExplorationPick,
      'personalizedTag': personalizedTag,
      'livestreamAvailable': livestreamAvailable,
      'nomineesInfoAvailable': nomineesInfoAvailable,
      'winnersInfoAvailable': winnersInfoAvailable,
      'earlyBirdAvailable': earlyBirdAvailable,
      'preRegistrationAvailable': preRegistrationAvailable,
      'reminderAvailable': reminderAvailable,
      'userPreRegistered': userPreRegistered,
      'userReminderSubscribed': userReminderSubscribed,
      'movieHighlights': movieHighlights,
      'workshopTopics': workshopTopics,
      'dealTag': dealTag,
      'hasBundle': hasBundle,
      'hasPartner': hasPartner,
      'hasLimitedTime': hasLimitedTime,
      'refundPolicy': refundPolicy,
      'minAge': minAge,
      'additionalPolicy': additionalPolicy,
      'hasSeatMap': hasSeatMap,
      'tiers': tiers.map((e) => e.toJson()).toList(),
      'category': category?.toJson(),
      'city': city?.toJson(),
      'isMovie': isMovie,
      'director': director,
      'cast': cast,
      'duration': duration,
      'rating': rating,
      'trailerUrl': trailerUrl,
      'status': status,
      'likesCount': likesCount,
      'averageRating': averageRating,
      'ratingsCount': ratingsCount,
    };
  }
}
