import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers.dart';
import '../../auth/services/auth_service.dart';
import '../../profile/services/profile_service.dart';
import '../../profile/presentation/edit_profile_screen.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final isDark = themeMode == ThemeMode.dark;
    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('settings.profile'.tr()),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // User Profile Card
          profileAsync.when(
            data: (profile) => Card(
              child: ListTile(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const EditProfileScreen()),
                ),
                contentPadding: const EdgeInsets.all(16),
                leading: CircleAvatar(
                  radius: 30,
                  backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                  backgroundImage: profile.avatarUrl != null 
                      ? NetworkImage(profile.avatarUrl!) 
                      : null,
                  child: profile.avatarUrl == null 
                      ? Icon(Icons.person, size: 30, color: Theme.of(context).primaryColor)
                      : null,
                ),
                title: Text(
                  profile.fullName ?? 'User',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                subtitle: Text(profile.phoneNumber),
                trailing: const Icon(Icons.chevron_right),
              ),
            ),
            loading: () => const Card(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
            error: (e, s) => Card(
              child: ListTile(
                title: const Text("Error loading profile"),
                subtitle: Text(e.toString()),
                trailing: IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: () => ref.refresh(userProfileProvider),
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),
          
          Text(
            'Settings',
            style: TextStyle(
              fontSize: 14, 
              fontWeight: FontWeight.bold, 
              color: Theme.of(context).colorScheme.primary
            ),
          ).tr(),
          const SizedBox(height: 16),

          // Theme Toggle
          _SettingsTile(
            icon: isDark ? Icons.dark_mode : Icons.light_mode,
            title: isDark ? 'Dark Mode' : 'Light Mode',
            trailing: Switch(
              value: isDark,
              onChanged: (val) {
                ref.read(themeModeProvider.notifier).toggleTheme();
              },
            ),
          ),
          
          const SizedBox(height: 12),

          // Language
           _SettingsTile(
            icon: Icons.language,
            title: 'settings.language'.tr(),
            trailing: DropdownButton<Locale>(
              value: context.locale,
              underline: const SizedBox(),
              items: const [
                DropdownMenuItem(value: Locale('en'), child: Text('English')),
                DropdownMenuItem(value: Locale('am'), child: Text('አማርኛ')),
              ],
              onChanged: (val) {
                if(val != null) context.setLocale(val);
              },
            ),
          ),

          const SizedBox(height: 32),
          
          // Logout
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () async {
                await ref.read(authServiceProvider).logout();
                if(context.mounted) context.go('/login');
              },
              icon: const Icon(Icons.logout),
              label: Text('settings.logout'.tr()),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.all(16),
                side: const BorderSide(color: Colors.red),
                foregroundColor: Colors.red,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget trailing;

  const _SettingsTile({required this.icon, required this.title, required this.trailing});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(16),
        boxShadow: Theme.of(context).cardTheme.elevation != 0 
            ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))] 
            : null,
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Theme.of(context).primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: Theme.of(context).primaryColor),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        trailing: trailing,
      ),
    );
  }
}
