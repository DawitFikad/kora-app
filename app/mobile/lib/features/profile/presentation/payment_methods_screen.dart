import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:qr_flutter/qr_flutter.dart';

class PaymentMethodsScreen extends ConsumerWidget {
  const PaymentMethodsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final cardColor = isDark ? const Color(0xFF232030) : Colors.white;

    final providers = [
      {
        'id': 'telebirr',
        'name': 'TeleBirr',
        'icon': Icons.account_balance_wallet,
        'color': Colors.red,
        'merchantId': 'MERCH-123-TELE',
      },
      {
        'id': 'cbe_birr',
        'name': 'CBE Birr',
        'icon': Icons.account_balance,
        'color': Colors.red,
        'merchantId': 'MERCH-456-CBE',
      },
      {
        'id': 'chapa',
        'name': 'Chapa',
        'icon': Icons.bolt,
        'color': Colors.red,
        'merchantId': 'MERCH-789-CHAPA',
      },
      {
        'id': 'amole',
        'name': 'Amole',
        'icon': Icons.payment,
        'color': Colors.red,
        'merchantId': 'MERCH-012-AMOLE',
      }
    ];

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA),
      appBar: AppBar(
        title: Text('Supported Wallets', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: textColor)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: textColor),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            "Select a provider to see our merchant QR code for direct payments or linking.",
            style: TextStyle(color: textColor.withOpacity(0.6), fontSize: 14),
          ),
          const SizedBox(height: 24),
          ...providers.map((p) => _buildProviderCard(context, p, cardColor, textColor)),
        ],
      ),
    );
  }

  Widget _buildProviderCard(BuildContext context, Map<String, dynamic> provider, Color cardColor, Color textColor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: ListTile(
        onTap: () => _showQRCodeModal(context, provider),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: (provider['color'] as Color).withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(provider['icon'] as IconData, color: provider['color'] as Color, size: 28),
        ),
        title: Text(
          provider['name'] as String,
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: textColor, fontSize: 18),
        ),
        subtitle: const Text("Tap to view QR Code"),
        trailing: Icon(Icons.qr_code_2, color: provider['color'] as Color),
      ),
    );
  }

  void _showQRCodeModal(BuildContext context, Map<String, dynamic> provider) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? const Color(0xFF232030) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: textColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              "${provider['name']} Merchant QR",
              style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold, color: textColor),
            ),
            const SizedBox(height: 8),
            Text(
              "Scan this code within your ${provider['name']} app",
              textAlign: TextAlign.center,
              style: TextStyle(color: textColor.withOpacity(0.6)),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: QrImageView(
                data: provider['merchantId'] as String,
                version: QrVersions.auto,
                size: 200.0,
                foregroundColor: const Color(0xFF1A1823),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              "Merchant ID: ${provider['merchantId']}",
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                color: provider['color'] as Color,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: provider['color'] as Color,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text("Done", style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
