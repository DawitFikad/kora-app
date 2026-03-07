import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../services/profile_service.dart';
import 'edit_profile_screen.dart';
import '../../scanner/services/scanner_service.dart';
import '../../auth/services/auth_service.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:mobile/core/utils/error_handler.dart';
import 'package:mobile/core/utils/avatar_image_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  void _showAcceptInviteDialog(BuildContext context, WidgetRef ref) {
    final codeController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF232030),
        title: Text(
          'profile.join_staff'.tr(),
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: TextField(
          controller: codeController,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'profile.enter_invite_code'.tr(),
            hintStyle: const TextStyle(color: Colors.white38),
            enabledBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.white24),
            ),
          ),
          keyboardType: TextInputType.number,
          maxLength: 6,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('profile.cancel'.tr()),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                await ref
                    .read(scannerServiceProvider)
                    .acceptInvitation(codeController.text);
                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('profile.join_success'.tr())),
                  );
                  ref.invalidate(userProfileProvider);
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(ErrorMessageHandler.getReadableError(e)),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: Text('profile.join'.tr()),
          ),
        ],
      ),
    );
  }

  void _showLogoutConfirmation(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1D192B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.logout, color: Colors.red, size: 28),
            const SizedBox(width: 12),
            Text(
              "profile.logout".tr(),
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Text(
          "settings.logout_confirm".tr(),
          style: GoogleFonts.poppins(fontSize: 14, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              "common.cancel".tr(),
              style: const TextStyle(color: Colors.grey),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(authServiceProvider).logout();
              if (context.mounted) context.go('/login');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: Text(
              "profile.logout".tr(),
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final cardColor = isDark ? const Color(0xFF232030) : Colors.white;

    final profileAsync = ref.watch(userProfileProvider);
    final inviteStatusAsync = ref.watch(staffInviteAvailableProvider);

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF15131C)
          : const Color(0xFFF8F7FA),
      appBar: AppBar(
        title: Text(
          'profile.title'.tr(),
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.edit_outlined, color: textColor),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => const EditProfileScreen(),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: profileAsync.when(
          data: (profile) => SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                // Profile Header
                Center(
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFF8B5CF6),
                            width: 2,
                          ),
                        ),
                        child: CircleAvatar(
                          radius: 50,
                          backgroundColor: Colors.grey[800],
                          backgroundImage: avatarImageProvider(
                            profile.avatarUrl,
                          ),
                          child: profile.avatarUrl == null
                              ? const Icon(
                                  Icons.person,
                                  size: 50,
                                  color: Colors.white,
                                )
                              : null,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        profile.fullName ?? "profile.default_user".tr(),
                        style: GoogleFonts.poppins(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: textColor,
                        ),
                      ),
                      Text(
                        profile.phoneNumber,
                        style: TextStyle(
                          color: isDark ? Colors.white54 : Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),

                // Stats or Bio?
                if (profile.bio != null && profile.bio!.isNotEmpty) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: cardColor,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "profile.bio".tr(),
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF8B5CF6),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          profile.bio!,
                          style: TextStyle(color: textColor.withOpacity(0.8)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // --- SHARED MENU ---
                _buildMenuItem(
                  context,
                  icon: Icons.confirmation_number_outlined,
                  title: "profile.my_tickets".tr(),
                  color: cardColor,
                  textColor: textColor,
                  onTap: () => context.push('/my-tickets'),
                ),
                const SizedBox(height: 16),
                _buildMenuItem(
                  context,
                  icon: Icons.favorite_border,
                  title: "profile.favorites".tr(),
                  color: cardColor,
                  textColor: textColor,
                  onTap: () => context.push('/favorites'),
                ),

                // Organizer or Staff showing Scanner
                if (profile.role == 'ORGANIZER' ||
                    profile.role == 'SCANNER') ...[
                  const SizedBox(height: 16),
                  _buildMenuItem(
                    context,
                    icon: Icons.qr_code_scanner,
                    title: "profile.scan_tickets".tr(),
                    color: cardColor,
                    textColor: textColor,
                    onTap: () => context.push('/scanner'),
                  ),
                ],

                // Organizer Only Features
                if (profile.role == 'ORGANIZER') ...[
                  const SizedBox(height: 16),
                  _buildMenuItem(
                    context,
                    icon: Icons.people_outline,
                    title: "profile.staff_mgmt".tr(),
                    color: cardColor,
                    textColor: textColor,
                    onTap: () => context.push('/staff-management'),
                  ),
                ],

                // Invitation Acceptance for regular users
                if (profile.role == 'USER') ...[
                  const SizedBox(height: 16),
                  inviteStatusAsync.when(
                    data: (hasPendingInvite) {
                      if (!hasPendingInvite) return const SizedBox.shrink();
                      return _buildMenuItem(
                        context,
                        icon: Icons.group_add_outlined,
                        title: "profile.join_staff".tr(),
                        color: cardColor,
                        textColor: textColor,
                        onTap: () => _showAcceptInviteDialog(context, ref),
                      );
                    },
                    loading: () => const SizedBox.shrink(),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                ],

                const SizedBox(height: 16),
                _buildMenuItem(
                  context,
                  icon: Icons.settings_outlined,
                  title: "profile.settings".tr(),
                  color: cardColor,
                  textColor: textColor,
                  onTap: () => context.push('/settings'),
                ),

                const SizedBox(height: 40),

                // Logout
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => _showLogoutConfirmation(context, ref),
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFFFF4B4B),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: const Color(0xFFFF4B4B).withOpacity(0.2),
                        ),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.logout, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          "profile.logout".tr(),
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          loading: () => const Center(
            child: CircularProgressIndicator(color: Color(0xFF8B5CF6)),
          ),
          error: (err, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.wifi_off_rounded,
                  size: 64,
                  color: Colors.grey,
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: Text(
                    ErrorMessageHandler.getReadableError(err),
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      color: textColor.withOpacity(0.7),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => ref.refresh(userProfileProvider),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text("common.retry".tr()),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required Color color,
    required Color textColor,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF8B5CF6).withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: const Color(0xFF8B5CF6), size: 20),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: textColor,
                    ),
                  ),
                ),
                Icon(Icons.chevron_right, color: textColor.withOpacity(0.3)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
