import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/providers.dart';
import '../models/user_profile.dart';

final profileServiceProvider = Provider<ProfileService>((ref) {
  return ProfileService(ref.watch(dioProvider));
});

final userProfileProvider = FutureProvider<UserProfile>((ref) async {
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
}
