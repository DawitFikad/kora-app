import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../services/auth_service.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  bool _isOtpSent = false;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      body: Stack(
        children: [
          // Animated background with gradient
          AnimatedContainer(
            duration: const Duration(milliseconds: 800),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: _isOtpSent 
                  ? isDark
                    ? [const Color(0xFF232030), const Color(0xFF1A1823)]
                    : [const Color(0xFFF5F2FF), const Color(0xFFE8E4F7)]
                  : AppColors.primaryGradient.colors,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          
          // Decorative elements
          Positioned(
            top: -50,
            right: -50,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    Colors.white.withOpacity(0.1),
                    Colors.white.withOpacity(0.05),
                  ],
                ),
              ),
            ),
          ),
          
          Positioned(
            bottom: -80,
            left: -80,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    Colors.white.withOpacity(0.08),
                    Colors.white.withOpacity(0.02),
                  ],
                ),
              ),
            ),
          ),
          
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo and welcome section
                  _isOtpSent 
                    ? const SizedBox(height: 20)
                    : Column(
                        key: const ValueKey('welcome'),
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.primaryLight, // Solid color instead of gradient/shadow
                            ),
                            child: const Icon(
                              Icons.confirmation_num_outlined,
                              size: 40,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'EtTicket',
                            style: GoogleFonts.poppins(
                              fontSize: 36,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : AppColors.primaryLight,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Your journey begins here',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              color: isDark 
                                ? AppColors.mutedForegroundDark
                                : AppColors.mutedForegroundLight,
                            ),
                          ),
                          const SizedBox(height: 48),
                        ],
                      ),
                  
                  // Login Card
                  Container(
                    width: double.infinity,
                    constraints: const BoxConstraints(maxWidth: 400),
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: isDark 
                        ? AppColors.cardDark
                        : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark 
                          ? AppColors.borderDark
                          : AppColors.borderLight,
                      ),
                      // Removed heavy BoxShadow
                    ),
                    child: Column(
                      children: [
                        // Header
                        AnimatedCrossFade(
                          duration: const Duration(milliseconds: 400),
                          crossFadeState: _isOtpSent 
                            ? CrossFadeState.showSecond
                            : CrossFadeState.showFirst,
                          firstChild: Column(
                            children: [
                              Text(
                                'Continue with Phone',
                                style: GoogleFonts.poppins(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w700,
                                  color: isDark 
                                    ? AppColors.foregroundDark
                                    : AppColors.foregroundLight,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Enter your phone number to sign in or create an account',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  color: isDark 
                                    ? AppColors.mutedForegroundDark
                                    : AppColors.mutedForegroundLight,
                                ),
                              ),
                            ],
                          ),
                          secondChild: Column(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                decoration: BoxDecoration(
                                  color: AppColors.primaryLight.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: AppColors.primaryLight.withOpacity(0.3),
                                    width: 2,
                                  ),
                                ),
                                child: Icon(
                                  Icons.phone_iphone_rounded,
                                  size: 30,
                                  color: AppColors.primaryLight,
                                ),
                              ),
                              const SizedBox(height: 20),
                              Text(
                                'Enter Verification Code',
                                style: GoogleFonts.poppins(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w700,
                                  color: isDark 
                                    ? AppColors.foregroundDark
                                    : AppColors.foregroundLight,
                                ),
                              ),
                              const SizedBox(height: 12),
                              RichText(
                                textAlign: TextAlign.center,
                                text: TextSpan(
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    color: isDark 
                                      ? AppColors.mutedForegroundDark
                                      : AppColors.mutedForegroundLight,
                                  ),
                                  children: [
                                    const TextSpan(text: 'Code sent to '),
                                    TextSpan(
                                      text: _phoneController.text,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.primaryLight,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 36),
                        
                        // Phone input section
                        if (!_isOtpSent) ...[
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isDark 
                                  ? AppColors.borderDark
                                  : AppColors.borderLight,
                                width: 1.5,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  height: 56,
                                  decoration: BoxDecoration(
                                    color: isDark 
                                      ? AppColors.mutedDark
                                      : AppColors.mutedLight,
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(15),
                                      bottomLeft: Radius.circular(15),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        Icons.flag,
                                        size: 20,
                                        color: AppColors.primaryLight,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        '+1',
                                        style: GoogleFonts.poppins(
                                          fontWeight: FontWeight.w600,
                                          color: isDark 
                                            ? AppColors.foregroundDark
                                            : AppColors.foregroundLight,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Expanded(
                                  child: TextField(
                                    controller: _phoneController,
                                    style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    decoration: InputDecoration(
                                      hintText: 'Phone number',
                                      hintStyle: GoogleFonts.poppins(
                                        color: isDark 
                                          ? AppColors.mutedForegroundDark
                                          : AppColors.mutedForegroundLight,
                                      ),
                                      border: InputBorder.none,
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                                    ),
                                    keyboardType: TextInputType.phone,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          
                          const SizedBox(height: 32),
                          
                          // Send OTP Button
                          SizedBox(
                            width: double.infinity,
                            height: 56,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _sendOtp,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryLight,
                                foregroundColor: AppColors.primaryForegroundLight,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                elevation: 0,
                                shadowColor: Colors.transparent,
                              ),
                              child: _isLoading
                                ? const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 3,
                                    ),
                                  )
                                : Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(
                                        Icons.send_rounded,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 12),
                                      Text(
                                        'Send OTP',
                                        style: GoogleFonts.poppins(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                            ),
                          ),
                        ] else ...[
                          // OTP Input Section
                          Column(
                            children: [
                              // OTP Input
                              TextField(
                                controller: _otpController,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 8,
                                ),
                                decoration: InputDecoration(
                                  hintText: '●●●●●●',
                                  hintStyle: GoogleFonts.poppins(
                                    fontSize: 28,
                                    color: isDark 
                                      ? AppColors.mutedForegroundDark.withOpacity(0.5)
                                      : AppColors.mutedForegroundLight.withOpacity(0.5),
                                    letterSpacing: 8,
                                  ),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                      color: isDark 
                                        ? AppColors.borderDark
                                        : AppColors.borderLight,
                                      width: 1.5,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                      color: isDark 
                                        ? AppColors.borderDark
                                        : AppColors.borderLight,
                                      width: 1.5,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                      color: AppColors.primaryLight,
                                      width: 2,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: isDark 
                                    ? AppColors.inputDark
                                    : AppColors.inputLight,
                                ),
                                keyboardType: TextInputType.number,
                                maxLength: 6,
                              ),
                              
                              const SizedBox(height: 16),
                              
                              // Timer and Resend
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'Didn\'t receive code? ',
                                    style: GoogleFonts.poppins(
                                      fontSize: 14,
                                      color: isDark 
                                        ? AppColors.mutedForegroundDark
                                        : AppColors.mutedForegroundLight,
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: _isLoading ? null : _sendOtp,
                                    style: TextButton.styleFrom(
                                      padding: EdgeInsets.zero,
                                    ),
                                    child: Text(
                                      'Resend',
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.primaryLight,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              
                              const SizedBox(height: 32),
                              
                              // Verify Button
                              SizedBox(
                                width: double.infinity,
                                height: 56,
                                child: ElevatedButton(
                                  onPressed: _isLoading ? null : _verifyOtp,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primaryLight,
                                    foregroundColor: AppColors.primaryForegroundLight,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    elevation: 0,
                                    shadowColor: Colors.transparent,
                                  ),
                                  child: _isLoading
                                    ? const SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 3,
                                        ),
                                      )
                                    : Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          const Icon(
                                            Icons.verified_rounded,
                                            size: 20,
                                          ),
                                          const SizedBox(width: 12),
                                          Text(
                                            'Verify & Continue',
                                            style: GoogleFonts.poppins(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                ),
                              ),
                              
                              const SizedBox(height: 24),
                              
                              // Back to phone input
                              TextButton(
                                onPressed: _isLoading ? null : () {
                                  setState(() {
                                    _isOtpSent = false;
                                    _otpController.clear();
                                  });
                                },
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(
                                      Icons.arrow_back_rounded,
                                      size: 16,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Use different number',
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
                                        color: isDark 
                                          ? AppColors.mutedForegroundDark
                                          : AppColors.mutedForegroundLight,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 48),
                  
                  // Terms and Privacy
                  if (!_isOtpSent)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Text(
                        'By continuing, you agree to our Terms of Service and Privacy Policy',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: isDark 
                            ? AppColors.mutedForegroundDark.withOpacity(0.7)
                            : AppColors.mutedForegroundLight.withOpacity(0.7),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _sendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      _showSnackBar('Please enter a valid phone number');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(authServiceProvider).requestOtp(phone);
      setState(() => _isOtpSent = true);
    } catch (e) {
      if (mounted) {
        _showSnackBar(e.toString());
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _verifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.isEmpty || otp.length != 6) {
      _showSnackBar('Please enter a valid 6-digit OTP');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(authServiceProvider).verifyOtp(_phoneController.text.trim(), otp);
      if (mounted) context.go('/home');
    } catch (e) {
      if (mounted) {
        _showSnackBar(e.toString());
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.destructiveLight,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}