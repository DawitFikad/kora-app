class HomepageBanner {
  final int id;
  final String? title;
  final String? subtitle;
  final String imageUrl;
  final String? linkUrl;
  final String? ctaText;

  HomepageBanner({
    required this.id,
    this.title,
    this.subtitle,
    required this.imageUrl,
    this.linkUrl,
    this.ctaText,
  });

  factory HomepageBanner.fromJson(Map<String, dynamic> json) {
    return HomepageBanner(
      id: json['id'],
      title: json['title'],
      subtitle: json['subtitle'],
      imageUrl: json['imageUrl'] ?? '',
      linkUrl: json['linkUrl'],
      ctaText: json['ctaText'],
    );
  }
}
