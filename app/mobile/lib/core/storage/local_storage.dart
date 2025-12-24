import 'package:shared_preferences/shared_preferences.dart';

class LocalStorage {
  static const String keyIsFirstLaunch = 'is_first_launch';
  static const String keyAuthToken = 'auth_token';

  final SharedPreferences _prefs;

  LocalStorage(this._prefs);

  static Future<LocalStorage> init() async {
    final prefs = await SharedPreferences.getInstance();
    return LocalStorage(prefs);
  }

  bool get isFirstLaunch => _prefs.getBool(keyIsFirstLaunch) ?? true;

  Future<void> setFirstLaunchComplete() async {
    await _prefs.setBool(keyIsFirstLaunch, false);
  }

  T? getField<T>(String key) {
    return _prefs.get(key) as T?;
  }

  Future<void> setField(String key, dynamic value) async {
    if (value is bool) await _prefs.setBool(key, value);
    if (value is String) await _prefs.setString(key, value);
    if (value is int) await _prefs.setInt(key, value);
    if (value is double) await _prefs.setDouble(key, value);
  }

  String? get authToken => _prefs.getString(keyAuthToken);

  Future<void> setAuthToken(String token) async {
    await _prefs.setString(keyAuthToken, token);
  }

  Future<void> clearAuth() async {
    await _prefs.remove(keyAuthToken);
  }
}
