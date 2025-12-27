import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorage extends ChangeNotifier {
  static const String keyIsFirstLaunch = 'is_first_launch';
  static const String keyAuthToken = 'auth_token';
  static const String keyCachedTickets = 'cached_tickets';
  static const String keyFavorites = 'favorites';

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
    if (value is List<String>) await _prefs.setStringList(key, value);
    notifyListeners();
  }

  List<String> get favorites => _prefs.getStringList(keyFavorites) ?? [];

  Future<void> toggleFavorite(String eventId) async {
    final current = favorites;
    if (current.contains(eventId)) {
      current.remove(eventId);
    } else {
      current.add(eventId);
    }
    await _prefs.setStringList(keyFavorites, current);
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
    // Do NOT notifyListeners() here as it causes infinite loops 
    // when providers watch storage and call services that update cache.
  }
}
