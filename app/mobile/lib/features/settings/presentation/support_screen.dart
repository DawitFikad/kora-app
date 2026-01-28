import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'All';

  final List<String> _categories = const [
    'All',
    'Tickets',
    'Payments',
    'Account',
    'Event Day',
  ];

  final List<_FaqItem> _faqItems = const [
    _FaqItem(
      category: 'Tickets',
      question: 'How do I buy a ticket?',
      answer: 'Find your event on the home screen, select your ticket type, and complete payment using Telebirr or other methods.',
    ),
    _FaqItem(
      category: 'Tickets',
      question: 'Where can I find my ticket?',
      answer: 'Go to My Tickets to see your ticket and QR code. You can use it offline at the venue.',
    ),
    _FaqItem(
      category: 'Payments',
      question: 'Payment failed but money was deducted',
      answer: 'Payments usually reverse automatically. If it doesn’t within 24 hours, contact support with the transaction ID.',
    ),
    _FaqItem(
      category: 'Payments',
      question: 'Is my ticket refundable?',
      answer: 'Refund policies vary by event. Check the refund policy on the event details page before purchasing.',
    ),
    _FaqItem(
      category: 'Account',
      question: 'I changed my phone number',
      answer: 'Contact support to update your account if you no longer have access to your original number.',
    ),
    _FaqItem(
      category: 'Event Day',
      question: 'How do I enter the event?',
      answer: 'Show the QR code from My Tickets at the entrance for scanning.',
    ),
  ];

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final cardColor = isDark ? const Color(0xFF1D192B) : Colors.white;
    final mutedColor = isDark ? Colors.white70 : Colors.black54;
    final chipBg = isDark ? Colors.white10 : Colors.black12;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA),
      appBar: AppBar(
        title: Text('Support & Help', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: textColor)),
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
          _buildHeroCard(textColor, mutedColor, cardColor),
          const SizedBox(height: 20),
          _buildSearchBar(textColor, mutedColor, cardColor),
          const SizedBox(height: 16),
          SizedBox(
            height: 36,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = category == _selectedCategory;
                return GestureDetector(
                  onTap: () => setState(() => _selectedCategory = category),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF8B5CF6) : chipBg,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Text(
                      category,
                      style: GoogleFonts.poppins(
                        color: isSelected ? Colors.white : textColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                );
              },
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemCount: _categories.length,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Quick Actions',
            style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: textColor),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildQuickAction(
                  icon: Icons.email_outlined,
                  title: 'Email',
                  subtitle: 'support@etticket.com',
                  onTap: () => _launchUrl('mailto:support@etticket.com'),
                  color: const Color(0xFFF59E0B),
                  cardColor: cardColor,
                  textColor: textColor,
                  mutedColor: mutedColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQuickAction(
                  icon: Icons.phone_outlined,
                  title: 'Call',
                  subtitle: '+251 911 223 344',
                  onTap: () => _launchUrl('tel:+251911223344'),
                  color: const Color(0xFF10B981),
                  cardColor: cardColor,
                  textColor: textColor,
                  mutedColor: mutedColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildQuickAction(
                  icon: Icons.chat_bubble_outline,
                  title: 'Live Chat',
                  subtitle: 'Usually replies in minutes',
                  onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Live chat is currently unavailable. Please email us.")),
                  ),
                  color: const Color(0xFF3B82F6),
                  cardColor: cardColor,
                  textColor: textColor,
                  mutedColor: mutedColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQuickAction(
                  icon: Icons.support_agent,
                  title: 'WhatsApp',
                  subtitle: 'Start a chat',
                  onTap: () => _launchUrl('https://wa.me/251911223344'),
                  color: const Color(0xFF22C55E),
                  cardColor: cardColor,
                  textColor: textColor,
                  mutedColor: mutedColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          Text(
            'Frequently Asked Questions',
            style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: textColor),
          ),
          const SizedBox(height: 12),
          ..._filteredFaqs().map((item) => _buildFaqItem(item, textColor, mutedColor, isDark)),
        ],
      ),
    );
  }

  List<_FaqItem> _filteredFaqs() {
    final query = _searchController.text.toLowerCase().trim();
    return _faqItems.where((item) {
      final matchesCategory = _selectedCategory == 'All' || item.category == _selectedCategory;
      if (!matchesCategory) return false;
      if (query.isEmpty) return true;
      return item.question.toLowerCase().contains(query) || item.answer.toLowerCase().contains(query);
    }).toList();
  }

  Widget _buildHeroCard(Color textColor, Color mutedColor, Color cardColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF8B5CF6).withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.support_agent, color: Color(0xFF8B5CF6)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('How can we help?', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: textColor)),
                const SizedBox(height: 4),
                Text('Find answers, contact support, or report an issue.', style: GoogleFonts.poppins(fontSize: 12, color: mutedColor)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(Color textColor, Color mutedColor, Color cardColor) {
    return TextField(
      controller: _searchController,
      onChanged: (_) => setState(() {}),
      style: TextStyle(color: textColor),
      decoration: InputDecoration(
        hintText: 'Search help articles',
        hintStyle: TextStyle(color: mutedColor),
        prefixIcon: Icon(Icons.search, color: mutedColor),
        filled: true,
        fillColor: cardColor,
        contentPadding: const EdgeInsets.symmetric(vertical: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
      ),
    );
  }

  Widget _buildQuickAction({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required Color color,
    required Color cardColor,
    required Color textColor,
    required Color mutedColor,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: color.withOpacity(0.12), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 12),
            Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: textColor, fontSize: 14)),
            const SizedBox(height: 4),
            Text(subtitle, style: GoogleFonts.poppins(color: mutedColor, fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _buildFaqItem(_FaqItem item, Color textColor, Color mutedColor, bool isDark) {
    return Theme(
      data: ThemeData().copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        title: Text(
          item.question,
          style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600, color: textColor),
        ),
        trailing: Icon(Icons.expand_more, color: mutedColor),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(0, 0, 0, 16),
            child: Text(
              item.answer,
              style: GoogleFonts.poppins(fontSize: 13, color: mutedColor, height: 1.5),
            ),
          ),
          Divider(color: isDark ? Colors.white10 : Colors.black12, height: 1),
        ],
      ),
    );
  }
}

class _FaqItem {
  final String category;
  final String question;
  final String answer;

  const _FaqItem({
    required this.category,
    required this.question,
    required this.answer,
  });
}
