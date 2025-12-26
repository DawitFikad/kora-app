import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorage extends ChangeNotifier {
  static const String keyIsFirstLaunch = 'is_first_launch';
  static const String keyAuthToken = 'auth_token';
  static const String keyCachedTickets = 'cached_tickets';

  final SharedPreferences _prefs;

  LocalStorage(this._prefs);

  static Future<LocalStorage> init() async {
    final prefs = await SharedPreferences.getInstance();
    return LocalStorage(prefs);
  }

  bool get isFirstLaunch => _prefs.getBool(keyIsFirstLaunch) ?? true;

  Future<void> setFirstLaunchComplete() async {
    await _prefs.setBool(keyIsFirstLaunch, false);
    notifyListeners();
  }

  T? getField<T>(String key) {
    return _prefs.get(key) as T?;
  }

  Future<void> setField(String key, dynamic value) async {
    if (value is bool) await _prefs.setBool(key, value);
    if (value is String) await _prefs.setString(key, value);
    if (value is int) await _prefs.setInt(key, value);
    if (value is double) await _prefs.setDouble(key, value);
    notifyListeners();
  }

  String? get authToken => _prefs.getString(keyAuthToken);

  Future<void> setAuthToken(String token) async {
    await _prefs.setString(keyAuthToken, token);
    notifyListeners();
  }

  Future<void> clearAuth() async {
    await _prefs.remove(keyAuthToken);
    notifyListeners();
  }

  String? get cachedTickets => _prefs.getString(keyCachedTickets);

  Future<void> setCachedTickets(String jsonString) async {
    await _prefs.setString(keyCachedTickets, jsonString);
    notifyListeners(); // Optional: if we want reactive UI based on cache update
  }
}
