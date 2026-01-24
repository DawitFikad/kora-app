class UserProfile {
  final int id;
  final String? fullName;
  final String phoneNumber;
  final String? email;
  final String? avatarUrl;
  final String? bio;
  final String? gender;
  final DateTime? birthDate;
  final String language;
  final String role;

  UserProfile({
    required this.id,
    this.fullName,
    required this.phoneNumber,
    this.email,
    this.avatarUrl,
    this.bio,
    this.gender,
    this.birthDate,
    this.language = 'en',
    this.role = 'USER',
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final profile = json['profile'] ?? {};
    return UserProfile(
      id: (json['id'] ?? 0) as int,
      fullName: profile['fullName'] as String?,
      phoneNumber: (json['phoneNumber'] ?? '') as String,
      email: json['email'] as String?,
      avatarUrl: profile['avatarUrl'] as String?,
      bio: profile['bio'] as String?,
      gender: profile['gender'] as String?,
      birthDate: profile['birthDate'] != null ? DateTime.tryParse(profile['birthDate'].toString()) : null,
      language: (profile['language'] ?? 'en').toString(),
      role: (json['role'] ?? 'USER').toString(),
    );
  }

  UserProfile copyWith({
    int? id,
    String? fullName,
    String? phoneNumber,
    String? email,
    String? avatarUrl,
    String? bio,
    String? gender,
    DateTime? birthDate,
    String? language,
    String? role,
  }) {
    return UserProfile(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
      gender: gender ?? this.gender,
      birthDate: birthDate ?? this.birthDate,
      language: language ?? this.language,
      role: role ?? this.role,
    );
  }
}
