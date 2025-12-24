import 'package:flutter/material.dart';

class AppColors {
  // Light Theme Colors (based on CSS variables)
  static const Color backgroundLight = Color(0xFFF8F7FA);
  static const Color foregroundLight = Color(0xFF3D3C4F);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color cardForegroundLight = Color(0xFF3D3C4F);
  static const Color primaryLight = Color(0xFF8A79AB);
  static const Color primaryForegroundLight = Color(0xFFF8F7FA);
  static const Color secondaryLight = Color(0xFFDFD9EC);
  static const Color secondaryForegroundLight = Color(0xFF3D3C4F);
  static const Color mutedLight = Color(0xFFDCD9E3);
  static const Color mutedForegroundLight = Color(0xFF6B6880);
  static const Color accentLight = Color(0xFFE6A5B8);
  static const Color accentForegroundLight = Color(0xFF4B2E36);
  static const Color destructiveLight = Color(0xFFD95C5C);
  static const Color destructiveForegroundLight = Color(0xFFF8F7FA);
  static const Color borderLight = Color(0xFFCEC9D9);
  static const Color inputLight = Color(0xFFEAE7F0);

  // Dark Theme Colors (based on CSS variables)
  static const Color backgroundDark = Color(0xFF1A1823);
  static const Color foregroundDark = Color(0xFFE0DDEF);
  static const Color cardDark = Color(0xFF232030);
  static const Color cardForegroundDark = Color(0xFFE0DDEF); // Same as foreground?
  static const Color primaryDark = Color(0xFFA995C9);
  static const Color primaryForegroundDark = Color(0xFF1A1823);
  static const Color secondaryDark = Color(0xFF5A5370);
  static const Color secondaryForegroundDark = Color(0xFFE0DDEF);
  static const Color mutedDark = Color(0xFF242031);
  static const Color mutedForegroundDark = Color(0xFFA09AAD);
  static const Color accentDark = Color(0xFF372E3F);
  static const Color accentForegroundDark = Color(0xFFF2B8C6);
  static const Color destructiveDark = Color(0xFFE57373);
  static const Color destructiveForegroundDark = Color(0xFF1A1823);
  static const Color borderDark = Color(0xFF302C40);
  static const Color inputDark = Color(0xFF2A273A);

  // Gradients (Optional, kept from previous)
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF8A79AB), Color(0xFFA995C9)], // Updated to match primary colors
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
