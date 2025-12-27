import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/profile_payment_service.dart';
import '../models/payment_method.dart';

class PaymentMethodsScreen extends ConsumerWidget {
  const PaymentMethodsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final methodsAsync = ref.watch(paymentMethodsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final cardColor = isDark ? const Color(0xFF232030) : Colors.white;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA),
      appBar: AppBar(
        title: Text('Payment Methods', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: textColor)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: textColor),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: methodsAsync.when(
        data: (methods) => ListView(
          padding: const EdgeInsets.all(24),
          children: [
            if (methods.isEmpty)
              _buildEmptyState(context, isDark)
            else
              ...methods.map((method) => _buildMethodCard(context, ref, method, cardColor, textColor)),
            const SizedBox(height: 32),
            _buildAddButton(context, ref),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6))),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Error: $err', style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(paymentMethodsProvider),
                child: const Text("Retry"),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, bool isDark) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 60),
        Icon(Icons.payment_outlined, size: 80, color: isDark ? Colors.white24 : Colors.grey[300]),
        const SizedBox(height: 24),
        Text(
          "No payment methods yet",
          style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600, color: isDark ? Colors.white70 : Colors.grey[600]),
        ),
        const SizedBox(height: 8),
        Text(
          "Add a payment method for faster checkout",
          textAlign: TextAlign.center,
          style: TextStyle(color: isDark ? Colors.white38 : Colors.grey[500]),
        ),
      ],
    );
  }

  Widget _buildMethodCard(BuildContext context, WidgetRef ref, PaymentMethod method, Color cardColor, Color textColor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        border: method.isDefault ? Border.all(color: const Color(0xFF8B5CF6), width: 2) : null,
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: _getProviderIcon(method.provider),
        title: Text(
          method.accountName ?? method.provider,
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: textColor),
        ),
        subtitle: Text(
          method.accountNumber,
          style: TextStyle(color: textColor.withOpacity(0.6)),
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (val) async {
            if (val == 'default') {
              await ref.read(profilePaymentServiceProvider).setDefaultMethod(method.id);
              ref.invalidate(paymentMethodsProvider);
            } else if (val == 'delete') {
              await ref.read(profilePaymentServiceProvider).deletePaymentMethod(method.id);
              ref.invalidate(paymentMethodsProvider);
            }
          },
          itemBuilder: (context) => [
            if (!method.isDefault)
              const PopupMenuItem(value: 'default', child: Text('Set as Default')),
            const PopupMenuItem(value: 'delete', child: Text('Remove', style: TextStyle(color: Colors.red))),
          ],
        ),
      ),
    );
  }

  Widget _buildAddButton(BuildContext context, WidgetRef ref) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => _showAddMethodBottomSheet(context, ref),
        icon: const Icon(Icons.add),
        label: Text("Add New Method", style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          side: const BorderSide(color: Color(0xFF8B5CF6)),
          foregroundColor: const Color(0xFF8B5CF6),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }

  Widget _getProviderIcon(String provider) {
    IconData icon;
    Color color;
    switch (provider.toUpperCase()) {
      case 'TELEBIRR':
        icon = Icons.account_balance_wallet;
        color = Colors.blue;
        break;
      case 'CBE_BIRR':
        icon = Icons.account_balance;
        color = Colors.purple;
        break;
      case 'CHAPA':
        icon = Icons.bolt;
        color = Colors.green;
        break;
      default:
        icon = Icons.credit_card;
        color = Colors.grey;
    }
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
      child: Icon(icon, color: color, size: 24),
    );
  }

  void _showAddMethodBottomSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _AddPaymentMethodSheet(),
    );
  }
}

class _AddPaymentMethodSheet extends StatefulWidget {
  const _AddPaymentMethodSheet();

  @override
  State<_AddPaymentMethodSheet> createState() => _AddPaymentMethodSheetState();
}

class _AddPaymentMethodSheetState extends State<_AddPaymentMethodSheet> {
  String _selectedProvider = 'TELEBIRR';
  final _accountController = TextEditingController();
  final _nameController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? const Color(0xFF232030) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);

    return Container(
      padding: EdgeInsets.only(
        top: 24,
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Add Payment Method",
            style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold, color: textColor),
          ),
          const SizedBox(height: 24),
          const Text("Select Provider", style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _selectedProvider,
            dropdownColor: cardColor,
            items: ['TELEBIRR', 'CBE_BIRR', 'CHAPA', 'STRIPE'].map((p) => DropdownMenuItem(value: p, child: Text(p, style: TextStyle(color: textColor)))).toList(),
            onChanged: (val) => setState(() => _selectedProvider = val!),
            decoration: InputDecoration(
              filled: true,
              fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey[100],
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 20),
          const Text("Account Number / Phone", style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _accountController,
            style: TextStyle(color: textColor),
            decoration: InputDecoration(
              hintText: "e.g. 0912345678",
              filled: true,
              fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey[100],
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 20),
          const Text("Label (Optional)", style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _nameController,
            style: TextStyle(color: textColor),
            decoration: InputDecoration(
              hintText: "e.g. My Primary Wallet",
              filled: true,
              fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey[100],
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF8B5CF6),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: _isLoading 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text("Save Payment Method", style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (_accountController.text.isEmpty) return;
    setState(() => _isLoading = true);
    try {
      final consumer = ProviderScope.containerOf(context, listen: false);
      await consumer.read(profilePaymentServiceProvider).addPaymentMethod({
        'provider': _selectedProvider,
        'accountNumber': _accountController.text,
        'accountName': _nameController.text.isEmpty ? null : _nameController.text,
      });
      consumer.invalidate(paymentMethodsProvider);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}
