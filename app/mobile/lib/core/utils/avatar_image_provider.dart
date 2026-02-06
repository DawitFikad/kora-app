import 'dart:convert';

import 'package:flutter/material.dart';

ImageProvider? avatarImageProvider(String? avatarUrl) {
  if (avatarUrl == null) return null;
  final value = avatarUrl.trim();
  if (value.isEmpty) return null;

  // Supports values like: data:image/jpeg;base64,AAA...
  if (value.startsWith('data:image')) {
    final base64Index = value.indexOf('base64,');
    if (base64Index == -1) return null;
    final raw = value.substring(base64Index + 'base64,'.length);

    try {
      final bytes = base64Decode(raw);
      return MemoryImage(bytes);
    } catch (_) {
      return null;
    }
  }

  return NetworkImage(value);
}
