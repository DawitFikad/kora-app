import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutScreen extends StatelessWidget {
  final String appVersion;

  const AboutScreen({super.key, required this.appVersion});

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final cardColor = isDark ? const Color(0xFF1D192B) : Colors.white;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: const Color(0xFFFF0000),
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                'About EtTicket',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFFFF0000), Color(0xFF6D28D9)],
                  ),
                ),
                child: Center(
                  child: Hero(
                    tag: 'app_logo',
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.confirmation_number,
                        size: 64,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          SliverList(
            delegate: SliverChildListDelegate([
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Our Mission',
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'EtTicket is Ethiopia\'s premier digital ticketing platform, dedicated to connecting fans with the events they love. We strive to provide a secure, seamless, and transparent booking experience for everyone.',
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        height: 1.6,
                        color: textColor.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(height: 32),
                    _buildFeatureItem(
                      context,
                      icon: Icons.flash_on,
                      title: 'Fast & Easy Booking',
                      description: 'Buy tickets in less than a minute with your favorite mobile money provider.',
                    ),
                    _buildFeatureItem(
                      context,
                      icon: Icons.qr_code_scanner,
                      title: 'Digital Entry',
                      description: 'No more paper waste. Your phone is your ticket at the gate.',
                    ),
                    _buildFeatureItem(
                      context,
                      icon: Icons.security,
                      title: 'Safe & Secure',
                      description: 'Advanced encryption and fraud prevention to keep your tickets safe.',
                    ),
                    const SizedBox(height: 32),
                    Text(
                      'Connect With Us',
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildSocialIcon(Icons.language, 'Website', () => _launchUrl('https://etticket.com')),
                        _buildSocialIcon(Icons.facebook, 'Facebook', () => _launchUrl('https://facebook.com/etticket')),
                        _buildSocialIcon(Icons.camera_alt, 'Instagram', () => _launchUrl('https://instagram.com/etticket')),
                      ],
                    ),
                    const SizedBox(height: 48),
                    Center(
                      child: Column(
                        children: [
                          Text(
                            'EtTicket v$appVersion',
                            style: GoogleFonts.poppins(
                              color: textColor.withOpacity(0.4),
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Made with ❤️ in Addis Ababa',
                            style: GoogleFonts.poppins(
                              color: textColor.withOpacity(0.4),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureItem(BuildContext context, {required IconData icon, required String title, required String description}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFF0000).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: const Color(0xFFFF0000), size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: GoogleFonts.poppins(
                    color: Colors.grey,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSocialIcon(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, color: const Color(0xFFFF0000), size: 28),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
