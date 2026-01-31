import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/scanner_service.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../core/providers.dart';

class StaffManagementScreen extends ConsumerStatefulWidget {
  const StaffManagementScreen({super.key});

  @override
  ConsumerState<StaffManagementScreen> createState() => _StaffManagementScreenState();
}

class _StaffManagementScreenState extends ConsumerState<StaffManagementScreen> {
  final _phoneController = TextEditingController();
  String _selectedRole = 'SCANNER';
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _inviteStaff() async {
    if (_phoneController.text.isEmpty) return;

    setState(() => _isLoading = true);
    try {
      final result = await ref.read(scannerServiceProvider).inviteStaff(
        _phoneController.text,
        _selectedRole,
      );
      if (mounted) {
        final code = result['inviteCode'];
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Invite sent! Code: $code (Keep this safe)'),
            duration: const Duration(seconds: 10),
            action: SnackBarAction(
              label: 'COPY',
              onPressed: () {},
            ),
          ),
        );
        _phoneController.clear();
        ref.invalidate(staffListProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${'staff.error_prefix'.tr()}: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final staffAsync = ref.watch(staffListProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final backgroundColor = isDark ? const Color(0xFF15131C) : const Color(0xFFF8F7FA);
    final cardColor = isDark ? const Color(0xFF232030) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final mutedColor = isDark ? Colors.white54 : Colors.black54;
    final inputBorderColor = isDark ? Colors.white10 : Colors.black12;
    final dropdownBg = isDark ? const Color(0xFF232030) : Colors.white;

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text(
          'staff.title'.tr(),
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: textColor),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: textColor),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'staff.invite_title'.tr(),
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  TextField(
                    controller: _phoneController,
                    style: TextStyle(color: textColor),
                    decoration: InputDecoration(
                      hintText: 'staff.phone_hint'.tr(),
                      hintStyle: TextStyle(color: mutedColor),
                      prefixIcon: const Icon(Icons.phone_outlined, color: Color(0xFF8B5CF6)),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: inputBorderColor),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF8B5CF6)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedRole,
                    dropdownColor: dropdownBg,
                    style: TextStyle(color: textColor),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.badge_outlined, color: Color(0xFF8B5CF6)),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: inputBorderColor),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF8B5CF6)),
                      ),
                    ),
                    items: [
                      DropdownMenuItem(value: 'SCANNER', child: Text('staff.role_scanner'.tr(), style: TextStyle(color: textColor))),
                      DropdownMenuItem(value: 'MANAGER', child: Text('staff.role_manager'.tr(), style: TextStyle(color: textColor))),
                    ],
                    onChanged: (val) => setState(() => _selectedRole = val!),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _inviteStaff,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF8B5CF6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: _isLoading 
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text('staff.send_invite'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            Text(
              'staff.current_staff'.tr(),
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
            const SizedBox(height: 16),
            staffAsync.when(
              data: (staff) => staff.isEmpty 
                ? Center(child: Text('staff.no_staff'.tr(), style: TextStyle(color: mutedColor)))
                : ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: staff.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final member = staff[index];
                      final name = member['user']['profile']?['fullName'] ?? member['user']['phoneNumber'];
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: cardColor,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: const Color(0xFF8B5CF6).withOpacity(0.1),
                              child: Text(name[0].toUpperCase(), style: const TextStyle(color: Color(0xFF8B5CF6))),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(name, style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                                  Text(member['role'], style: TextStyle(color: mutedColor, fontSize: 12)),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                              onPressed: () => _confirmRemoveStaff(context, member['id'], name),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text("${"common.error".tr()}: $e", style: const TextStyle(color: Colors.red)),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _removeStaff(int id) async {
     try {
      await ref.read(scannerServiceProvider).removeStaff(id);
      ref.invalidate(staffListProvider);
    } catch (e) {
       ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _confirmRemoveStaff(BuildContext context, int id, String name) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1D192B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.delete_outline, color: Colors.redAccent, size: 26),
            const SizedBox(width: 12),
            Text(
              'Remove staff',
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Text(
          'Remove $name from staff?',
          style: GoogleFonts.outfit(fontSize: 14, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: TextStyle(color: Colors.grey.shade600)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await _removeStaff(id);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: const Text('Remove', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

final staffListProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final token = ref.watch(authTokenProvider);
  if (token == null) return [];
  
  return ref.read(scannerServiceProvider).listStaff();
});
