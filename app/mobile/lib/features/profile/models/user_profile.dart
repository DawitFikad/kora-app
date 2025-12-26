class UserProfile {
  final int id;
  final String? fullName;
  final String phoneNumber;
  final String? email;
  final String? avatarUrl;

  UserProfile({
    required this.id,
    this.fullName,
    required this.phoneNumber,
    this.email,
    this.avatarUrl,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    // Assuming the backend returns the profile under 'profile' or directly
    final profile = json['profile'] ?? {};
    return UserProfile(
      id: json['id'],
      fullName: profile['fullName'],
      phoneNumber: json['phoneNumber'],
      email: json['email'],
      avatarUrl: profile['avatarUrl'],
    );
  }
}
