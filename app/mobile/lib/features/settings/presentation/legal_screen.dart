import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LegalScreen extends StatelessWidget {
  const LegalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA),
      appBar: AppBar(
        title: Text('Support & Legal', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: textColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _buildLegalTile(
            context,
            title: 'Terms of Service',
            icon: Icons.description_outlined,
            content: _termsContent,
          ),
          const SizedBox(height: 16),
          _buildLegalTile(
            context,
            title: 'Privacy Policy',
            icon: Icons.privacy_tip_outlined,
            content: _privacyContent,
          ),
          const SizedBox(height: 16),
          _buildLegalTile(
            context,
            title: 'Cookie Policy',
            icon: Icons.cookie_outlined,
            content: "We use cookies to enhance your experience...",
          ),
        ],
      ),
    );
  }

  Widget _buildLegalTile(BuildContext context, {required String title, required IconData icon, required String content}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => LegalDetailScreen(title: title, content: content),
          ),
        );
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1D192B) : Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Icon(icon, color: const Color(0xFF8B5CF6)),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  static const _termsContent = """
Welcome to EtTicket. By using our application, you agree to these terms...
1. Account Registration: You must provide accurate information...
2. Ticket Purchases: All sales are final unless otherwise stated by the organizer...
3. User Conduct: You agree not to use the app for any illegal purposes...
4. Intellectual Property: All content in the app is owned by EtTicket...
...
  """;

  static const _privacyContent = """
EtTicket values your privacy...
1. Information We Collect: We collect phone numbers, emails, and device info...
2. How We Use Info: To process tickets and send notifications...
3. Data Sharing: We share only necessary info with event organizers...
4. Security: We use industry-standard encryption to protect your data...
...
  """;
}

class LegalDetailScreen extends StatelessWidget {
  final String title;
  final String content;

  const LegalDetailScreen({super.key, required this.title, required this.content});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA),
      appBar: AppBar(
        title: Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: textColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Text(
          content,
          style: GoogleFonts.poppins(
            fontSize: 14,
            height: 1.8,
            color: textColor.withOpacity(0.8),
          ),
        ),
      ),
    );
  }
}
