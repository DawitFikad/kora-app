import 'package:mobile/features/events/models/ticket_tier.dart';
import 'package:mobile/features/events/models/category.dart';
import 'package:mobile/features/events/models/city.dart';

class Event {
  final int id;
  final String title;
  final String description;
  final String venue;
  final String dateTime;
  final String? coverImage;
  final bool featured;
  
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

  Event({
    required this.id,
    required this.title,
    required this.description,
    required this.venue,
    required this.dateTime,
    this.coverImage,
    this.featured = false,
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
  });


  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      title: json['title'] ?? 'Untitled',
      description: json['description'] ?? '',
      venue: json['venue'] ?? 'TBA',
      dateTime: json['dateTime'] ?? DateTime.now().toIso8601String(),
      coverImage: json['coverImage'],
      featured: json['featured'] ?? false,
      refundPolicy: json['refundPolicy'],
      minAge: json['minAge'] ?? 0,
      additionalPolicy: json['additionalPolicy'],
      hasSeatMap: json['hasSeatMap'] ?? false,
      tiers: (json['tiers'] as List<dynamic>?)
          ?.map((e) => TicketTier.fromJson(e))
          .toList() ?? [],
      category: json['category'] != null ? Category.fromJson(json['category']) : null,
      city: json['city'] != null ? City.fromJson(json['city']) : null,
      isMovie: json['isMovie'] ?? false,
      director: json['director'],
      cast: json['cast'],
      duration: json['duration'],
      rating: json['rating'],
      trailerUrl: json['trailerUrl'],
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'venue': venue,
      'dateTime': dateTime,
      'coverImage': coverImage,
      'featured': featured,
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
    };
  }
}

