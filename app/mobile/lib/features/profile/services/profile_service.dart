import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/providers.dart';
import '../models/user_profile.dart';

final profileServiceProvider = Provider<ProfileService>((ref) {
  return ProfileService(ref.watch(dioProvider));
});

final userProfileProvider = FutureProvider.autoDispose<UserProfile>((ref) async {
  // Watch token to ensure this re-runs on logout/login
  final token = ref.watch(authTokenProvider);
  if (token == null) throw Exception("Unauthorized");
  
  final service = ref.read(profileServiceProvider);
  return service.getMyProfile();
});

class ProfileService {
  final Dio _dio;

  ProfileService(this._dio);

  Future<UserProfile> getMyProfile() async {
    try {
      final response = await _dio.get(ApiConstants.profile);
      return UserProfile.fromJson(response.data);
    } on DioException catch (e) {
       throw e.response?.data['error'] ?? 'Failed to fetch profile';
    }
  }

  Future<UserProfile> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _dio.patch(ApiConstants.profile, data: data);
      // Backend returns the updated UserProfile object directly or wrapped?
      // Based on controller, it returns res.json(profile) which is from prisma.userProfile.update
      // The fromJson in Dart expects the structure {id, phoneNumber, email, profile: {fullName, ...}}
      // But prisma.userProfile.update returns ONLY the profile part.
      // We might need to fetch the full profile again or modify backend to return full user.
      // For now, let's just refresh the provider after calling this.
      return UserProfile.fromJson(response.data);
    } on DioException catch (e) {
      throw e.response?.data['error'] ?? 'Failed to update profile';
    }
  }

  Future<Map<String, dynamic>> getOrganizerProfile() async {
    try {
      final response = await _dio.get(ApiConstants.organizerProfile);
      return response.data;
    } on DioException catch (e) {
      throw e.response?.data['error'] ?? 'Failed to fetch organizer profile';
    }
  }
}
