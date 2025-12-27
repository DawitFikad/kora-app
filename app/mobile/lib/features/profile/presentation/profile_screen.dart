import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../services/profile_service.dart';
import '../../../core/providers.dart';
import 'edit_profile_screen.dart';
import 'payment_methods_screen.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final cardColor = isDark ? const Color(0xFF232030) : Colors.white;
    
    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA),
      appBar: AppBar(
        title: Text('Profile', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: textColor)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.edit_outlined, color: textColor),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const EditProfileScreen()),
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
                          border: Border.all(color: const Color(0xFF8B5CF6), width: 2),
                        ),
                        child: CircleAvatar(
                          radius: 50,
                          backgroundColor: Colors.grey[800],
                          backgroundImage: profile.avatarUrl != null 
                              ? NetworkImage(profile.avatarUrl!) 
                              : null,
                          child: profile.avatarUrl == null 
                              ? const Icon(Icons.person, size: 50, color: Colors.white)
                              : null,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        profile.fullName ?? "User",
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
                      if (profile.email != null && profile.email!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          profile.email!,
                          style: TextStyle(
                            color: isDark ? Colors.white38 : Colors.grey[500],
                            fontSize: 13,
                          ),
                        ),
                      ],
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
                                    "Bio",
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

                // Menu Items
                _buildMenuItem(
                  context, 
                  icon: Icons.confirmation_number_outlined, 
                  title: "My Tickets",
                  color: cardColor,
                  textColor: textColor,
                  onTap: () => context.push('/my-tickets'),
                ),
                const SizedBox(height: 16),
                _buildMenuItem(
                  context, 
                  icon: Icons.favorite_border, 
                  title: "Favorites",
                  color: cardColor,
                  textColor: textColor,
                  onTap: () => context.push('/favorites'),
                ),
                const SizedBox(height: 16),
                _buildMenuItem(
                  context, 
                  icon: Icons.payment, 
                  title: "Payment Methods",
                  color: cardColor,
                  textColor: textColor,
                  onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const PaymentMethodsScreen()),
                ),
                ),
                const SizedBox(height: 16),
                _buildMenuItem(
                  context, 
                  icon: Icons.settings_outlined, 
                  title: "Settings",
                  color: cardColor,
                  textColor: textColor,
                  onTap: () => context.push('/settings'),
                ),
                
                const SizedBox(height: 40),
                
                // Logout
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () async {
                       final storage = ref.read(localStorageProvider);
                       await storage.clearAuth();
                       if(context.mounted) context.go('/login');
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFFFF4B4B),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(color: const Color(0xFFFF4B4B).withOpacity(0.2)),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.logout, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          "Log Out", 
                          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6))),
          error: (err, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Error: $err', style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.refresh(userProfileProvider),
                  child: const Text("Retry"),
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
