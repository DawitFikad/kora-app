import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:google_fonts/google_fonts.dart';

import 'core/providers.dart';
import 'core/router/app_router.dart';
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
        overrides: [
          localStorageProvider.overrideWithValue(localStorage),
        ],
        child: const EtTicketApp(),
      ),
    ),
  );
}

class EtTicketApp extends ConsumerWidget {
  const EtTicketApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    
    
    // We need to keep router alive or recreate it. 
    // Usually defining it in a provider is better, but since AppRouter depends on storage which is available now:
    final storage = ref.watch(localStorageProvider);
    final themeMode = ref.watch(themeModeProvider); // Watch Theme
    final appRouter = AppRouter(storage);

    return MaterialApp.router(
      title: 'EtTicket',
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale, // This is key for dynamic switching
      routerConfig: appRouter.router,
      themeMode: themeMode,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      debugShowCheckedModeBanner: false,
    );
  }
}
