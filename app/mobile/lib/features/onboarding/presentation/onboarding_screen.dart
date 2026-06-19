import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/providers.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  List<Map<String, String>> get _onboardingData => [
    {
      'title': 'onboarding.slide1_title'.tr(),
      'highlight': 'onboarding.slide1_highlight'.tr(),
      'desc': 'onboarding.slide1_desc'.tr(),
      'image':
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1000',
    },
    {
      'title': 'onboarding.slide2_title'.tr(),
      'highlight': 'onboarding.slide2_highlight'.tr(),
      'desc': 'onboarding.slide2_desc'.tr(),
      'image':
          'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000',
    },
    {
      'title': 'onboarding.slide3_title'.tr(),
      'highlight': 'onboarding.slide3_highlight'.tr(),
      'desc': 'onboarding.slide3_desc'.tr(),
      'image':
          'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1000',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0D15),
      body: Stack(
        children: [
          // Background Images PageView
          PageView.builder(
            controller: _pageController,
            onPageChanged: (idx) => setState(() => _currentPage = idx),
            itemCount: _onboardingData.length,
            itemBuilder: (context, index) {
              return Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    _onboardingData[index]['image']!,
                    fit: BoxFit.cover,
                  ),
                  // Gradient Overlay
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withOpacity(0.3),
                          const Color(0xFF0F0D15).withOpacity(0.8),
                          const Color(0xFF0F0D15),
                        ],
                        stops: const [0.0, 0.6, 1.0],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),

          // Top Header (Et-Tickets)
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Stack(
                children: [
                  // Branding (Centered)
                  Align(
                    alignment: Alignment.topCenter,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF0000).withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.auto_awesome,
                            color: Color(0xFFFF0000),
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          "ET-TICKETS",
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Language Switcher (Top Right)
                  Align(
                    alignment: Alignment.topRight,
                    child: GestureDetector(
                      onTap: () {
                        if (context.locale.languageCode == 'en') {
                          context.setLocale(const Locale('am'));
                        } else {
                          context.setLocale(const Locale('en'));
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white10),
                        ),
                        child: Text(
                          context.locale.languageCode == 'en' ? " አማ " : " EN ",
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content Box
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Title
                  RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: GoogleFonts.poppins(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        height: 1.1,
                      ),
                      children: [
                        TextSpan(
                          text: '${_onboardingData[_currentPage]['title']} ',
                        ),
                        TextSpan(
                          text: _onboardingData[_currentPage]['highlight'],
                          style: const TextStyle(color: Color(0xFFFF0000)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Subtitle
                  Text(
                    _onboardingData[_currentPage]['desc']!,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      color: Colors.white60,
                      fontSize: 16,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Page Indicator
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_onboardingData.length, (index) {
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        height: 4,
                        width: _currentPage == index ? 32 : 8,
                        decoration: BoxDecoration(
                          color: _currentPage == index
                              ? const Color(0xFFFF0000)
                              : Colors.white24,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 48),

                  // Buttons
                  Column(
                    children: [
                      ElevatedButton(
                        onPressed: () async {
                          if (_currentPage < _onboardingData.length - 1) {
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 500),
                              curve: Curves.fastOutSlowIn,
                            );
                          } else {
                            await ref
                                .read(localStorageProvider)
                                .setFirstLaunchComplete();
                            if (mounted) context.go('/login');
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF0000),
                          foregroundColor: Colors.white,
                          minimumSize: const Size(double.infinity, 60),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _currentPage == _onboardingData.length - 1
                                  ? 'onboarding.get_started'.tr()
                                  : 'onboarding.continue'.tr(),
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward, size: 20),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton(
                        onPressed: () => context.push('/onboarding-login'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white10),
                          minimumSize: const Size(double.infinity, 60),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: Text(
                          'onboarding.login'.tr(),
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Footer
                  Text(
                    'onboarding.terms'.tr(),
                    style: GoogleFonts.poppins(
                      color: Colors.white24,
                      fontSize: 11,
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
}
