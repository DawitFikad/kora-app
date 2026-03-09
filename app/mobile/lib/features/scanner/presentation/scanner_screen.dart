import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/services.dart';
import 'package:vibration/vibration.dart';
import '../services/scanner_service.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  bool _isProcessing = false;
  bool _isOnline = true;
  bool _isBulkMode = false;
  bool _isTorchOn = false;
  int _sessionScanCount = 0;
  ScannerResponse? _lastResult;

  final MobileScannerController controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  @override
  void initState() {
    super.initState();
    _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    final result = await Connectivity().checkConnectivity();
    if (!mounted) return;
    setState(() {
      _isOnline = result != ConnectivityResult.none;
    });
  }

  bool _isDuplicateOrFraud(ScannerResponse result) {
    if (result.fraudDetected) return true;
    final normalized = result.message.toLowerCase();
    return normalized.contains('duplicate') ||
        normalized.contains('fraud') ||
        normalized.contains('already used') ||
        normalized.contains('invalid qr signature');
  }

  Future<void> _vibratePulse({
    required int duration,
    int amplitude = 200,
  }) async {
    try {
      final hasVibrator = await Vibration.hasVibrator();
      if (!hasVibrator) return;
      final hasAmplitudeControl = await Vibration.hasAmplitudeControl();
      await Vibration.vibrate(
        duration: duration,
        amplitude: hasAmplitudeControl ? amplitude : -1,
      );
    } catch (_) {
      // Ignore plugin errors and keep default haptics below.
    }
  }

  Future<void> _triggerScanFeedbackForResult(ScannerResponse result) async {
    if (result.success) {
      await _vibratePulse(duration: 130, amplitude: 255);
      await Future.delayed(const Duration(milliseconds: 70));
      await _vibratePulse(duration: 90, amplitude: 220);
      await HapticFeedback.vibrate();
      await Future.delayed(const Duration(milliseconds: 50));
      await HapticFeedback.heavyImpact();
      await Future.delayed(const Duration(milliseconds: 60));
      await HapticFeedback.selectionClick();
      await SystemSound.play(SystemSoundType.click);
      return;
    }

    if (_isDuplicateOrFraud(result)) {
      await _vibratePulse(duration: 180, amplitude: 255);
      await Future.delayed(const Duration(milliseconds: 80));
      await _vibratePulse(duration: 180, amplitude: 255);
      await HapticFeedback.vibrate();
      await Future.delayed(const Duration(milliseconds: 80));
      await HapticFeedback.heavyImpact();
      await Future.delayed(const Duration(milliseconds: 80));
      await HapticFeedback.heavyImpact();
      await SystemSound.play(SystemSoundType.alert);
      return;
    }

    await _vibratePulse(duration: 140, amplitude: 235);
    await HapticFeedback.vibrate();
    await HapticFeedback.mediumImpact();
    await SystemSound.play(SystemSoundType.alert);
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;
    final barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;
    final code = barcodes.first.rawValue;
    if (code == null || code.trim().isEmpty) return;

    setState(() => _isProcessing = true);

    if (!_isBulkMode) {
      await controller.stop();
    }

    try {
      final scannerService = ref.read(scannerServiceProvider);
      final result = await scannerService.validateTicket(code);
      if (!mounted) return;

      await _triggerScanFeedbackForResult(result);

      if (_isBulkMode) {
        setState(() {
          _lastResult = result;
          if (result.success) _sessionScanCount++;
          _isProcessing = false;
        });

        Future.delayed(const Duration(seconds: 2), () {
          if (mounted && _lastResult == result) {
            setState(() => _lastResult = null);
          }
        });
      } else {
        _showResultSheet(result);
      }
    } catch (e) {
      if (!mounted) return;
      final errorResult = ScannerResponse(
        success: false,
        message: 'System Error',
      );
      await _triggerScanFeedbackForResult(errorResult);

      if (_isBulkMode) {
        setState(() {
          _lastResult = errorResult;
          _isProcessing = false;
        });
      } else {
        _showErrorSheet('An unexpected error occurred: $e');
      }
    } finally {
      if (mounted && !_isBulkMode) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _showResultSheet(ScannerResponse result) {
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF15131C),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            border: Border.all(
              color: result.success
                  ? const Color(0xFF10B981).withOpacity(0.3)
                  : const Color(0xFFEF4444).withOpacity(0.3),
              width: 1,
            ),
          ),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.82,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color:
                          (result.success
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFFEF4444))
                              .withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      result.success
                          ? Icons.check_circle_outline
                          : Icons.error_outline,
                      size: 48,
                      color: result.success
                          ? const Color(0xFF10B981)
                          : const Color(0xFFEF4444),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    result.success ? 'ACCESS GRANTED' : 'ACCESS DENIED',
                    style: GoogleFonts.outfit(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: result.success
                          ? const Color(0xFF10B981)
                          : const Color(0xFFEF4444),
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    result.message,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      color: Colors.white70,
                    ),
                  ),
                  if (result.success && result.ticket != null) ...[
                    const SizedBox(height: 20),
                    _buildInfoRow(
                      'Attendee',
                      _ticketValue(
                        result.ticket,
                        'userName',
                        fallback: 'Guest',
                      ),
                    ),
                    _buildInfoRow(
                      'Phone',
                      _ticketValue(result.ticket, 'attendeePhone'),
                    ),
                    _buildInfoRow(
                      'Email',
                      _ticketValue(result.ticket, 'attendeeEmail'),
                    ),
                    _buildInfoRow(
                      'Event',
                      _ticketValue(result.ticket, 'eventTitle'),
                    ),
                    _buildInfoRow(
                      'Type',
                      _ticketValue(result.ticket, 'tierName', fallback: 'N/A'),
                    ),
                    _buildInfoRow(
                      'Ticket ID',
                      _ticketValue(result.ticket, 'id'),
                    ),
                    _buildInfoRow(
                      'Seat',
                      _ticketValue(
                        result.ticket,
                        'seat',
                        fallback: 'General / N-A',
                      ),
                    ),
                    _buildInfoRow(
                      'Events Joined',
                      _ticketValue(
                        result.ticket,
                        'purchaseEventCount',
                        fallback: '0',
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildPurchaseHistory(result.ticket),
                  ],
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        controller.start();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: result.success
                            ? const Color(0xFF10B981)
                            : const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        'NEXT ATTENDEE',
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showErrorSheet(String message) {
    _showResultSheet(ScannerResponse(success: false, message: message));
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(color: Colors.white38, fontSize: 14),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              softWrap: true,
              overflow: TextOverflow.visible,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _ticketValue(
    Map<String, dynamic>? ticket,
    String key, {
    String fallback = '-',
  }) {
    if (ticket == null) return fallback;
    final value = ticket[key];
    if (value == null) return fallback;
    final text = value.toString().trim();
    return text.isEmpty ? fallback : text;
  }

  Widget _buildPurchaseHistory(Map<String, dynamic>? ticket) {
    final events = ticket?['purchaseEvents'];
    if (events is! List || events.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.08)),
        ),
        child: const Text(
          'No additional event history found.',
          style: TextStyle(color: Colors.white60, fontSize: 12),
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Recent Events',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          ...events.take(5).map((entry) {
            final row = entry is Map ? entry : const <String, dynamic>{};
            final title = (row['eventTitle'] ?? 'Event').toString();
            final status = (row['ticketStatus'] ?? '').toString();
            return Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (status.isNotEmpty)
                    Text(
                      status,
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 11,
                      ),
                    ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          MobileScanner(controller: controller, onDetect: _onDetect),
          _buildScannerOverlay(),
          if (_isBulkMode && _lastResult != null) _buildBulkFeedbackOverlay(),
          if (_isBulkMode)
            Positioned(
              bottom: 40,
              left: 20,
              right: 20,
              child: _buildSessionStats(),
            ),
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
                  style: IconButton.styleFrom(backgroundColor: Colors.black26),
                ),
                GestureDetector(
                  onTap: () => setState(() => _isBulkMode = !_isBulkMode),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: _isBulkMode
                          ? const Color(0xFF8B5CF6)
                          : Colors.black45,
                      borderRadius: BorderRadius.circular(100),
                      border: Border.all(
                        color: _isBulkMode ? Colors.white24 : Colors.white12,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _isBulkMode ? Icons.bolt : Icons.bolt_outlined,
                          size: 16,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Bulk Mode',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () {
                    setState(() => _isTorchOn = !_isTorchOn);
                    controller.toggleTorch();
                  },
                  icon: Icon(
                    _isTorchOn ? Icons.flash_on : Icons.flash_off,
                    color: _isTorchOn ? Colors.yellow : Colors.white,
                  ),
                  style: IconButton.styleFrom(backgroundColor: Colors.black26),
                ),
              ],
            ),
          ),
          if (_isProcessing && !_isBulkMode)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(color: Color(0xFF8B5CF6)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBulkFeedbackOverlay() {
    final success = _lastResult!.success;
    return Positioned(
      top: 100,
      left: 40,
      right: 40,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0.0, end: 1.0),
        duration: const Duration(milliseconds: 200),
        builder: (context, value, child) => Transform.scale(
          scale: value,
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color:
                  (success ? const Color(0xFF10B981) : const Color(0xFFEF4444))
                      .withOpacity(0.9),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Row(
              children: [
                Icon(
                  success ? Icons.check_circle : Icons.error,
                  color: Colors.white,
                  size: 32,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        success ? 'GRANTED' : 'DENIED',
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                      Text(
                        _lastResult!.message,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
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

  Widget _buildSessionStats() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'SESSION TOTAL',
                style: TextStyle(
                  color: Colors.white54,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
              Text(
                '$_sessionScanCount Attendees',
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          IconButton(
            onPressed: () => setState(() => _sessionScanCount = 0),
            icon: const Icon(Icons.refresh, color: Colors.white54),
          ),
        ],
      ),
    );
  }

  Widget _buildScannerOverlay() {
    return Stack(
      children: [
        ColorFiltered(
          colorFilter: ColorFilter.mode(
            Colors.black.withOpacity(0.7),
            BlendMode.srcOut,
          ),
          child: Stack(
            children: [
              Container(
                decoration: const BoxDecoration(color: Colors.transparent),
              ),
              Center(
                child: Container(
                  height: 280,
                  width: 280,
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(40),
                  ),
                ),
              ),
            ],
          ),
        ),
        Center(
          child: Container(
            height: 280,
            width: 280,
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFF8B5CF6), width: 2),
              borderRadius: BorderRadius.circular(40),
            ),
            child: Stack(
              children: [
                _buildCorner(0, 0),
                _buildCorner(0, 1),
                _buildCorner(1, 0),
                _buildCorner(1, 1),
                const ScanningLine(),
              ],
            ),
          ),
        ),
        Positioned(
          bottom: 100,
          left: 0,
          right: 0,
          child: Center(
            child: Text(
              'Align QR code within the frame',
              style: GoogleFonts.outfit(
                color: Colors.white70,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCorner(int top, int left) {
    return Positioned(
      top: top == 0 ? -2 : null,
      bottom: top == 1 ? -2 : null,
      left: left == 0 ? -2 : null,
      right: left == 1 ? -2 : null,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          border: Border(
            top: top == 0
                ? const BorderSide(color: Color(0xFF8B5CF6), width: 6)
                : BorderSide.none,
            bottom: top == 1
                ? const BorderSide(color: Color(0xFF8B5CF6), width: 6)
                : BorderSide.none,
            left: left == 0
                ? const BorderSide(color: Color(0xFF8B5CF6), width: 6)
                : BorderSide.none,
            right: left == 1
                ? const BorderSide(color: Color(0xFF8B5CF6), width: 6)
                : BorderSide.none,
          ),
          borderRadius: BorderRadius.only(
            topLeft: top == 0 && left == 0
                ? const Radius.circular(20)
                : Radius.zero,
            topRight: top == 0 && left == 1
                ? const Radius.circular(20)
                : Radius.zero,
            bottomLeft: top == 1 && left == 0
                ? const Radius.circular(20)
                : Radius.zero,
            bottomRight: top == 1 && left == 1
                ? const Radius.circular(20)
                : Radius.zero,
          ),
        ),
      ),
    );
  }
}

class ScanningLine extends StatefulWidget {
  const ScanningLine({super.key});

  @override
  State<ScanningLine> createState() => _ScanningLineState();
}

class _ScanningLineState extends State<ScanningLine>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 40, end: 240).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Positioned(
          top: _animation.value,
          left: 40,
          right: 40,
          child: Container(
            height: 2,
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF8B5CF6).withOpacity(0.5),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ],
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF8B5CF6).withOpacity(0),
                  const Color(0xFF8B5CF6),
                  const Color(0xFF8B5CF6).withOpacity(0),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
