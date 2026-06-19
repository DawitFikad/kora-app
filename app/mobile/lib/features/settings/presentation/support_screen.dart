import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:url_launcher/url_launcher.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'all';

  final List<String> _categories = const [
    'all',
    'tickets',
    'payments',
    'account',
    'event_day',
  ];

  final List<_FaqItem> _faqItems = const [
    _FaqItem(
      categoryKey: 'tickets',
      questionKey: 'support.faq.buy_ticket_q',
      answerKey: 'support.faq.buy_ticket_a',
    ),
    _FaqItem(
      categoryKey: 'tickets',
      questionKey: 'support.faq.find_ticket_q',
      answerKey: 'support.faq.find_ticket_a',
    ),
    _FaqItem(
      categoryKey: 'payments',
      questionKey: 'support.faq.payment_failed_q',
      answerKey: 'support.faq.payment_failed_a',
    ),
    _FaqItem(
      categoryKey: 'payments',
      questionKey: 'support.faq.refund_q',
      answerKey: 'support.faq.refund_a',
    ),
    _FaqItem(
      categoryKey: 'account',
      questionKey: 'support.faq.phone_change_q',
      answerKey: 'support.faq.phone_change_a',
    ),
    _FaqItem(
      categoryKey: 'event_day',
      questionKey: 'support.faq.entry_q',
      answerKey: 'support.faq.entry_a',
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
        title: Text('support.title'.tr(), style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: textColor)),
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
                      color: isSelected ? const Color(0xFFFF0000) : chipBg,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Text(
                      'support.categories.$category'.tr(),
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
            'support.quick_actions'.tr(),
            style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: textColor),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildQuickAction(
                  icon: Icons.email_outlined,
                  title: 'support.actions.email'.tr(),
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
                  title: 'support.actions.call'.tr(),
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
                  title: 'support.actions.live_chat'.tr(),
                  subtitle: 'support.actions.live_chat_subtitle'.tr(),
                  onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('support.live_chat_unavailable'.tr())),
                  ),
                  color: const Color(0xFFFF0000),
                  cardColor: cardColor,
                  textColor: textColor,
                  mutedColor: mutedColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQuickAction(
                  icon: Icons.support_agent,
                  title: 'support.actions.whatsapp'.tr(),
                  subtitle: 'support.actions.whatsapp_subtitle'.tr(),
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
            'support.faq_title'.tr(),
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
      final matchesCategory = _selectedCategory == 'all' || item.categoryKey == _selectedCategory;
      if (!matchesCategory) return false;
      if (query.isEmpty) return true;
      final question = item.questionKey.tr().toLowerCase();
      final answer = item.answerKey.tr().toLowerCase();
      return question.contains(query) || answer.contains(query);
    }).toList();
  }

  Widget _buildHeroCard(Color textColor, Color mutedColor, Color cardColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFF0000).withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFF0000).withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.support_agent, color: Color(0xFFFF0000)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('support.hero_title'.tr(), style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: textColor)),
                const SizedBox(height: 4),
                Text('support.hero_subtitle'.tr(), style: GoogleFonts.poppins(fontSize: 12, color: mutedColor)),
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
        hintText: 'support.search_hint'.tr(),
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
          item.questionKey.tr(),
          style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600, color: textColor),
        ),
        trailing: Icon(Icons.expand_more, color: mutedColor),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(0, 0, 0, 16),
            child: Text(
              item.answerKey.tr(),
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
  final String categoryKey;
  final String questionKey;
  final String answerKey;

  const _FaqItem({
    required this.categoryKey,
    required this.questionKey,
    required this.answerKey,
  });
}
