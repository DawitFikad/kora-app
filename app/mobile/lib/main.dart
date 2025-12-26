import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/providers.dart';
import 'core/storage/local_storage.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();

  final localStorage = await LocalStorage.init();

  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('en'), Locale('am')],
      path: 'assets/translations',
      fallbackLocale: const Locale('en'),
      child: ProviderScope(
        overrides: [localStorageProvider.overrideWith((ref) => localStorage)],
        child: const EtTicketApp(),
      ),
    ),
  );
}

class EtTicketApp extends ConsumerWidget {
  const EtTicketApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'EtTicket',
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
      routerConfig: router,
      themeMode: themeMode,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      debugShowCheckedModeBanner: false,
    );
  }
}
