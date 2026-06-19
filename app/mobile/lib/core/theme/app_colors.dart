import 'package:flutter/material.dart';

class AppColors {

  // Light Theme Colors (white bg, black text, red accents)
  static const Color backgroundLight = Color(0xFFFFFFFF);
  static const Color foregroundLight = Color(0xFF000000);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color cardForegroundLight = Color(0xFF000000);
  static const Color primaryLight = Color(0xFFFF0000);
  static const Color primaryForegroundLight = Color(0xFFFFFFFF);
  static const Color secondaryLight = Color(0xFF000000);
  static const Color secondaryForegroundLight = Color(0xFFFFFFFF);
  static const Color mutedLight = Color(0xFFF5F5F5);
  static const Color mutedForegroundLight = Color(0xFF555555);
  static const Color accentLight = Color(0xFFFF0000);
  static const Color accentForegroundLight = Color(0xFFFFFFFF);
  static const Color destructiveLight = Color(0xFFD95C5C);
  static const Color destructiveForegroundLight = Color(0xFFFFFFFF);
  static const Color borderLight = Color(0xFFE0E0E0);
  static const Color inputLight = Color(0xFFF5F5F5);

  // Dark Theme Colors (dark bg, white text, red accents)
  static const Color backgroundDark = Color(0xFF111111);
  static const Color foregroundDark = Color(0xFFFFFFFF);
  static const Color cardDark = Color(0xFF222222);
  static const Color cardForegroundDark = Color(0xFFFFFFFF);
  static const Color primaryDark = Color(0xFFFF0000);
  static const Color primaryForegroundDark = Color(0xFFFFFFFF);
  static const Color secondaryDark = Color(0xFF000000);
  static const Color secondaryForegroundDark = Color(0xFFFFFFFF);
  static const Color mutedDark = Color(0xFF2A2A2A);
  static const Color mutedForegroundDark = Color(0xFFAAAAAA);
  static const Color accentDark = Color(0xFFFF0000);
  static const Color accentForegroundDark = Color(0xFFFFFFFF);
  static const Color destructiveDark = Color(0xFFE57373);
  static const Color destructiveForegroundDark = Color(0xFF1A1823);
  static const Color borderDark = Color(0xFF333333);
  static const Color inputDark = Color(0xFF2A2A2A);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFFF0000), Color(0xFFCC0000)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
