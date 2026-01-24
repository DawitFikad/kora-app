import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';
import 'package:easy_localization/easy_localization.dart';
import '../services/auth_service.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneController = TextEditingController();
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());
  
  bool _isOtpSent = false;
  bool _isLoading = false;
  int _resendTimer = 45;
  Timer? _timer;

  void _startTimer() {
    _resendTimer = 45;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendTimer > 0) {
        setState(() => _resendTimer--);
      } else {
        _timer?.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _phoneController.dispose();
    for (var controller in _otpControllers) {
      controller.dispose();
    }
    for (var node in _otpFocusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Force Dark Theme for the Login Screen specifically
    return Theme(
      data: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF8B5CF6),
        scaffoldBackgroundColor: const Color(0xFF0F0D15),
        textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme).apply(
          bodyColor: Colors.white,
          displayColor: Colors.white,
        ),
        inputDecorationTheme: const InputDecorationTheme(
          filled: false,
          border: InputBorder.none,
          hintStyle: TextStyle(color: Colors.white24),
          labelStyle: TextStyle(color: Colors.white),
        ),
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFF0F0D15),
        body: Container(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: const Alignment(0.8, -0.6),
              radius: 1.2,
              colors: [
                const Color(0xFF2D1B69).withOpacity(0.3),
                const Color(0xFF0F0D15),
              ],
            ),
          ),
          child: SafeArea(
            child: Column(
              children: [
                // Top Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                      // Language Switcher
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white10),
                        ),
                        child: Row(
                          children: [
                            _buildLanguageOption(context, 'en', '🇺🇸'),
                            _buildLanguageOption(context, 'am', '🇪🇹'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 20),
                        Text(
                          "login.title".tr(),
                          style: GoogleFonts.poppins(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          "login.subtitle".tr(),
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            color: Colors.white60,
                            height: 1.5,
                          ),
                        ),
                        
                        const SizedBox(height: 48),
                        
                        // Phone Input
                        Text(
                          "login.phone_label".tr(),
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            // Country Picker (Custom UI)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1D192B),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.white10),
                              ),
                              child: Row(
                                children: [
                                  Image.network(
                                    "https://flagcdn.com/w40/et.png",
                                    width: 24,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    "login.country_code".tr(),
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                  ),
                                  const Icon(Icons.keyboard_arrow_down, color: Colors.white54, size: 18),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF1D192B),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white10),
                                ),
                                child: TextField(
                                  controller: _phoneController,
                                  keyboardType: TextInputType.phone,
                                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                                  cursorColor: const Color(0xFF8B5CF6),
                                  decoration: InputDecoration(
                                    border: InputBorder.none,
                                    hintText: "login.hint_phone".tr(),
                                    hintStyle: const TextStyle(color: Colors.white24),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        
                        const SizedBox(height: 16),
                        
                        Row(
                          children: [
                            const Icon(Icons.lock_outline, color: Color(0xFF8B5CF6), size: 14),
                            const SizedBox(width: 8),
                            Text(
                              "login.secure_otp".tr(),
                              style: GoogleFonts.poppins(
                                color: Colors.white54,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        
                        const SizedBox(height: 32),
                        
                        // Send OTP Button
                        ElevatedButton(
                          onPressed: _isLoading ? null : _sendOtp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF8B5CF6),
                            foregroundColor: Colors.white,
                            minimumSize: const Size(double.infinity, 64),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            elevation: 8,
                            shadowColor: const Color(0xFF8B5CF6).withOpacity(0.5),
                          ),
                          child: _isLoading 
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    "login.send_otp".tr(),
                                    style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(width: 12),
                                  const Icon(Icons.arrow_forward, size: 20),
                                ],
                              ),
                        ),
                        
                        const SizedBox(height: 32),
                        const Divider(color: Colors.white10),
                        const SizedBox(height: 32),
                        
                        // Verification Code Section (Only if OTP is sent)
                        if (_isOtpSent) ...[
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    "login.verification_code".tr(),
                                    style: GoogleFonts.poppins(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  Text(
                                    "${"login.resend_in".tr()} 00:${_resendTimer.toString().padLeft(2, '0')}",
                                    style: GoogleFonts.poppins(
                                      color: const Color(0xFF8B5CF6),
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: List.generate(6, (index) => _buildOtpBox(index)),
                              ),
                              const SizedBox(height: 24),
                              Center(
                                child: TextButton(
                                  onPressed: () {},
                                  child: Text(
                                    "login.didnt_receive".tr(),
                                    style: GoogleFonts.poppins(color: Colors.white54, fontSize: 14),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 32),
                        ] else ...[
                          // Hide Code Section if not sent
                          // Keep spacer if needed
                        ],
                        
                        // OR Section
                        Row(
                          children: [
                            const Expanded(child: Divider(color: Colors.white10)),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Text("login.or".tr(), style: const TextStyle(color: Colors.white24, fontSize: 12)),
                            ),
                            const Expanded(child: Divider(color: Colors.white10)),
                          ],
                        ),
                        
                        const SizedBox(height: 32),
                        
                        // Continue with Email (Hidden for now as confusing, optional email will be post-login)
                        /*
                        OutlinedButton(
                          onPressed: () {},
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white10),
                            minimumSize: const Size(double.infinity, 64),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.email_outlined, size: 20),
                              const SizedBox(width: 12),
                              Text(
                                "login.continue_email".tr(),
                                style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                        */
                        const SizedBox(height: 32),
                        
                        // Footer
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: RichText(
                              textAlign: TextAlign.center,
                              text: TextSpan(
                                style: GoogleFonts.poppins(color: Colors.white24, fontSize: 12, height: 1.6),
                                children: [
                                  TextSpan(text: "login.terms_prefix".tr()),
                                  TextSpan(
                                    text: "login.terms_tos".tr(),
                                    style: TextStyle(color: Colors.white.withOpacity(0.4), decoration: TextDecoration.underline),
                                  ),
                                  TextSpan(text: "login.terms_and".tr()),
                                  TextSpan(
                                    text: "login.terms_privacy".tr(),
                                    style: TextStyle(color: Colors.white.withOpacity(0.4), decoration: TextDecoration.underline),
                                  ),
                                  TextSpan(text: "login.terms_suffix".tr()),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 60),
                      ],
                    ),
                  ),
                ),

                // Bottom Bar
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: const BoxDecoration(
                    border: Border(top: BorderSide(color: Colors.white10)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: _isOtpSent ? _verifyOtp : null,
                        child: Text(
                          "login.done".tr(),
                          style: GoogleFonts.poppins(
                            color: _isOtpSent ? const Color(0xFF8B5CF6) : Colors.white24,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOtpBox(int index) {
    return Container(
      width: 48,
      height: 60,
      decoration: BoxDecoration(
        color: const Color(0xFF1D192B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white24),
      ),
      child: Center(
        child: TextField(
          controller: _otpControllers[index],
          focusNode: _otpFocusNodes[index],
          textAlign: TextAlign.center,
          keyboardType: TextInputType.number,
          style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
          maxLength: 1,
          cursorColor: Colors.white,
          decoration: const InputDecoration(
            counterText: "",
            border: InputBorder.none,
          ),
          onChanged: (value) {
            if (value.isNotEmpty) {
              if (index < 5) {
                _otpFocusNodes[index + 1].requestFocus();
              } else {
                // Last digit entered, auto-verify
                _verifyOtp();
              }
            } else if (value.isEmpty && index > 0) {
              _otpFocusNodes[index - 1].requestFocus();
            }
          },
        ),
      ),
    );
  }

  Future<void> _sendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) return;

    setState(() => _isLoading = true);
    try {
      await ref.read(authServiceProvider).requestOtp(phone);
      setState(() {
        _isOtpSent = true;
        _isLoading = false;
      });
      _startTimer();
      _otpFocusNodes[0].requestFocus();
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _verifyOtp() async {
    if (_isLoading) return;
    final otp = _otpControllers.map((c) => c.text).join();
    if (otp.length < 6) return;

    setState(() => _isLoading = true);
    try {
      debugPrint('Verifying OTP: $otp for phone: ${_phoneController.text}');
      await ref.read(authServiceProvider).verifyOtp(_phoneController.text.trim(), otp);
      debugPrint('OTP Verified Successfully');
      if (mounted) {
        setState(() => _isLoading = false);
        await Future.delayed(const Duration(milliseconds: 100));
        if (!mounted) return;

        final canPop = GoRouter.of(context).canPop();
        debugPrint('Login success. canPop: $canPop');
        if (canPop) {
           debugPrint('Action: Popping back');
           context.pop(true);
        } else {
           debugPrint('Action: Navigating to /home');
           context.go('/home');
        }
      }
    } catch (e) {
      debugPrint('OTP Verification Failed: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }
  Widget _buildLanguageOption(BuildContext context, String code, String flag) {
    final isSelected = context.locale.languageCode == code;
    return GestureDetector(
      onTap: () async {
        if (!isSelected) {
          await context.setLocale(Locale(code));
          setState(() {}); // Trigger rebuild to reflect changes immediately
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF8B5CF6).withOpacity(0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          flag,
          style: TextStyle(
            fontSize: 16,
            color: isSelected ? const Color(0xFF8B5CF6) : Colors.white38,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
