import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/providers.dart';
import '../../../../core/utils/error_handler.dart';
import '../../auth/services/auth_service.dart';
import '../../profile/services/profile_service.dart';

class OnboardingLoginScreen extends ConsumerStatefulWidget {
  const OnboardingLoginScreen({super.key});

  @override
  ConsumerState<OnboardingLoginScreen> createState() =>
      _OnboardingLoginScreenState();
}

class _OnboardingLoginScreenState extends ConsumerState<OnboardingLoginScreen> {
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();

  int _step = 0;
  bool _isLoading = false;
  int _resendTimer = 0;
  Timer? _timer;
  String? _normalizedPhone;

  @override
  void dispose() {
    _timer?.cancel();
    _emailController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  String? _normalizeEthiopianPhone(String raw) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.length == 9 && digits.startsWith('9')) {
      return '+251$digits';
    }
    if (digits.length == 12 && digits.startsWith('2519')) {
      return '+$digits';
    }
    if (digits.length == 13 && digits.startsWith('2519')) {
      return '+${digits.substring(0, 12)}';
    }
    return null;
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email.trim());
  }

  void _startTimer() {
    _resendTimer = 45;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendTimer <= 0) {
        timer.cancel();
      } else {
        setState(() => _resendTimer--);
      }
    });
  }

  Future<void> _goNextFromEmail() async {
    final email = _emailController.text.trim();
    if (!_isValidEmail(email)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid email address.')),
      );
      return;
    }
    setState(() => _step = 1);
  }

  Future<void> _requestOtp() async {
    if (_isLoading) return;

    final normalized = _normalizeEthiopianPhone(_phoneController.text.trim());
    if (normalized == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Please enter a valid Ethiopian phone number (9XXXXXXXX).',
          ),
        ),
      );
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);
    try {
      await ref.read(authServiceProvider).requestOtp(normalized);
      if (!mounted) return;
      setState(() {
        _normalizedPhone = normalized;
        _step = 2;
        _isLoading = false;
      });
      _startTimer();
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ErrorMessageHandler.getReadableError(e))),
      );
    }
  }

  Future<void> _verifyOtpAndLogin() async {
    if (_isLoading) return;

    final phone = _normalizedPhone;
    if (phone == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please request OTP first.')),
      );
      setState(() => _step = 1);
      return;
    }

    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the 6-digit OTP.')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(authServiceProvider).verifyOtp(phone, otp);

      final email = _emailController.text.trim();
      await ref.read(profileServiceProvider).updateProfile({'email': email});
      ref.invalidate(userProfileProvider);

      await ref.read(localStorageProvider).setFirstLaunchComplete();
      if (!mounted) return;
      setState(() => _isLoading = false);
      context.go('/home');
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ErrorMessageHandler.getReadableError(e))),
      );
    }
  }

  String get _title {
    if (_step == 0) return 'Your email';
    if (_step == 1) return 'Your phone';
    return 'Verify OTP';
  }

  String get _subtitle {
    if (_step == 0) return 'Enter your email to continue.';
    if (_step == 1) return 'Enter your Ethiopian phone number.';
    return 'Enter the 6-digit code sent to $_normalizedPhone';
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F0D15),
        textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme),
      ),
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            onPressed: () {
              if (_step > 0) {
                setState(() => _step--);
              } else {
                context.pop();
              }
            },
            icon: const Icon(Icons.arrow_back, color: Colors.white),
          ),
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),
                Text(
                  _title,
                  style: GoogleFonts.poppins(
                    fontSize: 30,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _subtitle,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Colors.white60,
                  ),
                ),
                const SizedBox(height: 32),
                Row(
                  children: List.generate(3, (index) {
                    final isActive = index <= _step;
                    return Expanded(
                      child: Container(
                        margin: EdgeInsets.only(right: index == 2 ? 0 : 8),
                        height: 4,
                        decoration: BoxDecoration(
                          color: isActive
                              ? const Color(0xFF8B5CF6)
                              : Colors.white12,
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 28),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 220),
                    child: _buildStepContent(),
                  ),
                ),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading
                        ? null
                        : () {
                            if (_step == 0) {
                              _goNextFromEmail();
                              return;
                            }
                            if (_step == 1) {
                              _requestOtp();
                              return;
                            }
                            _verifyOtpAndLogin();
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF8B5CF6),
                      minimumSize: const Size.fromHeight(58),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            _step == 0
                                ? 'Continue'
                                : _step == 1
                                ? 'Send OTP'
                                : 'Verify & Login',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStepContent() {
    if (_step == 0) {
      return Column(
        key: const ValueKey('email-step'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildField(
            controller: _emailController,
            hint: 'name@example.com',
            icon: Icons.alternate_email,
            keyboardType: TextInputType.emailAddress,
          ),
        ],
      );
    }

    if (_step == 1) {
      return Column(
        key: const ValueKey('phone-step'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildField(
            controller: _phoneController,
            hint: '9XXXXXXXX',
            icon: Icons.phone_android,
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9+]')),
              LengthLimitingTextInputFormatter(13),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Format: 9XXXXXXXX or +2519XXXXXXXX',
            style: GoogleFonts.poppins(fontSize: 12, color: Colors.white54),
          ),
        ],
      );
    }

    return Column(
      key: const ValueKey('otp-step'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildField(
          controller: _otpController,
          hint: '6-digit code',
          icon: Icons.lock_outline,
          keyboardType: TextInputType.number,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(6),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Text(
              _resendTimer > 0
                  ? 'Resend in 00:${_resendTimer.toString().padLeft(2, '0')}'
                  : 'Didn\'t receive the code?',
              style: GoogleFonts.poppins(fontSize: 12, color: Colors.white54),
            ),
            const SizedBox(width: 8),
            TextButton(
              onPressed: (_resendTimer > 0 || _isLoading) ? null : _requestOtp,
              child: const Text('Resend'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    required TextInputType keyboardType,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1D192B),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        inputFormatters: inputFormatters,
        style: const TextStyle(color: Colors.white, fontSize: 16),
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: Colors.white54, size: 20),
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.white38),
          border: InputBorder.none,
        ),
      ),
    );
  }
}
