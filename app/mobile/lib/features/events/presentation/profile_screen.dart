import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final cardColor = isDark ? const Color(0xFF232030) : Colors.white;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 20),
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
                      child: const CircleAvatar(
                        radius: 50,
                        backgroundColor: Colors.grey,
                        child: Icon(Icons.person, size: 50, color: Colors.white),
                        // backgroundImage: NetworkImage("..."), // TODO: User Image
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      "User Name", // TODO: Fetch from provider
                      style: GoogleFonts.poppins(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    Text(
                      "+251 911 22 33 44", // TODO: Fetch
                      style: TextStyle(
                        color: isDark ? Colors.white54 : Colors.grey[600],
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),

              // Menu Items
              _buildMenuItem(
                context, 
                icon: Icons.confirmation_number_outlined, 
                title: "My Tickets",
                color: cardColor,
                textColor: textColor,
                onTap: () {},
              ),
              const SizedBox(height: 16),
              _buildMenuItem(
                context, 
                icon: Icons.favorite_border, 
                title: "Favorites",
                 color: cardColor,
                textColor: textColor,
                onTap: () {},
              ),
              const SizedBox(height: 16),
              _buildMenuItem(
                context, 
                icon: Icons.payment, 
                title: "Payment Methods",
                 color: cardColor,
                textColor: textColor,
                onTap: () {},
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
                    // Logic to logout
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
