import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/features/booking/services/booking_service.dart';
import 'package:mobile/features/booking/services/payment_service.dart';
import 'package:mobile/features/events/models/event.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile/core/widgets/app_image.dart';
import 'package:mobile/core/utils/error_handler.dart';
import 'package:mobile/core/network/constants/api_constants.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/features/booking/presentation/in_app_payment_screen.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  final Event event;
  final int tierId;
  final String tierName;
  final double unitPrice;
  final int quantity;
  final List<String>? selectedSeats;

  const CheckoutScreen({
    super.key,
    required this.event,
    required this.tierId,
    required this.tierName,
    required this.unitPrice,
    required this.quantity,
    this.selectedSeats,
  });

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  bool _isLoading = true;
  bool _isProcessingPayment = false;
  Map<String, dynamic>? _priceBreakdown;
  String? _error;

  final TextEditingController _promoController = TextEditingController();
  String? _appliedPromoCode;
  String? _promoError;
  String _selectedPaymentMethod = 'CHAPA'; // Default to Chapa

  String _normalizeTelebirrCheckoutUrl(
    String checkoutUrl,
    String paymentMethod,
    String? paymentRef,
  ) {
    if (paymentMethod.toUpperCase() != 'TELEBIRR') return checkoutUrl;

    Uri? uri;
    try {
      uri = Uri.parse(checkoutUrl);
    } catch (_) {
      return checkoutUrl;
    }

    // Some test responses may still return telebirr.test, which is not a real domain.lat
    if (uri.host.toLowerCase() == 'telebirr.test') {
      final ref = paymentRef ?? uri.queryParameters['ref'];
      if (ref == null || ref.isEmpty) return checkoutUrl;

      final safePrepay = uri.queryParameters['prepay_id'] ?? '';
      final fallback =
          '${ApiConstants.baseUrl}/payments/verify-callback?ref=$ref&status=success&method=TELEBIRR&prepay_id=$safePrepay';
      return fallback;
    }

    // API may return Android-emulator host (10.0.2.2), which is unreachable on Flutter Web.
    if (kIsWeb && uri.host == '10.0.2.2') {
      final ref = paymentRef ?? uri.queryParameters['ref'];
      if (ref == null || ref.isEmpty) return checkoutUrl;
      final status = uri.queryParameters['status'] ?? 'success';
      final method = uri.queryParameters['method'] ?? 'TELEBIRR';
      final safePrepay = uri.queryParameters['prepay_id'] ?? '';
      return '${ApiConstants.baseUrl}/payments/verify-callback?ref=$ref&status=$status&method=$method&prepay_id=$safePrepay';
    }

    return checkoutUrl;
  }

  String _decorateCheckoutUrlForWebReturn(String checkoutUrl) {
    if (!kIsWeb) return checkoutUrl;

    final uri = Uri.tryParse(checkoutUrl);
    if (uri == null || uri.scheme.isEmpty) return checkoutUrl;

    final qp = Map<String, String>.from(uri.queryParameters);
    qp['web_return'] = Uri.base.origin;
    return uri.replace(queryParameters: qp).toString();
  }

  @override
  void initState() {
    super.initState();
    _fetchPriceBreakdown();
  }

  Future<void> _fetchPriceBreakdown() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await ref
          .read(bookingServiceProvider)
          .calculatePrice(
            eventId: widget.event.id,
            tierId: widget.tierId,
            quantity: widget.quantity,
            promoCode: _appliedPromoCode,
          );

      setState(() {
        _priceBreakdown = result;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = ErrorMessageHandler.getReadableError(e);
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _applyPromo() async {
    final code = _promoController.text.trim();
    if (code.isEmpty) return;

    setState(() => _promoError = null);

    try {
      await ref
          .read(bookingServiceProvider)
          .validatePromoCode(code, widget.event.id);

      setState(() {
        _appliedPromoCode = code;
      });
      _fetchPriceBreakdown();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            "Promo code applied!",
            style: TextStyle(color: Colors.white),
          ),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      setState(() {
        _promoError = ErrorMessageHandler.getReadableError(e);
      });
    }
  }

  Future<void> _processPayment() async {
    setState(() => _isProcessingPayment = true);

    try {
      // 1. Create Reservation
      final reservation = await ref
          .read(bookingServiceProvider)
          .createReservation(
            eventId: widget.event.id,
            tierId: widget.tierId,
            quantity: widget.quantity,
            seatNumbers: widget.selectedSeats,
            promoCode: _appliedPromoCode,
            paymentMethod: _selectedPaymentMethod, // Using selected method
          );

      final purchaseId = reservation['purchaseId'];

      // 2. Initialize Payment with Real Provider (Chapa/Telebirr)
      final paymentResponse = await ref
          .read(paymentServiceProvider)
          .initializePayment(purchaseId: purchaseId);

      final paymentUrl = paymentResponse['checkoutUrl'] ?? '';
      final paymentRef = paymentResponse['paymentRef']?.toString();
      final paymentMethod = paymentResponse['method'] ?? 'CHAPA';
      final normalizedPaymentUrl = _normalizeTelebirrCheckoutUrl(
        paymentUrl,
        paymentMethod.toString(),
        paymentRef,
      );
      final launchPaymentUrl = _decorateCheckoutUrlForWebReturn(
        normalizedPaymentUrl,
      );

      // 3. Launch Payment URL
      if (launchPaymentUrl.isNotEmpty) {
        if (paymentMethod.toString().toUpperCase() == 'TELEBIRR') {
          final completed = await Navigator.push<bool>(
            context,
            MaterialPageRoute(
              builder: (context) => InAppPaymentScreen(
                paymentUrl: launchPaymentUrl,
                paymentMethod: paymentMethod,
              ),
            ),
          );

          if (mounted && completed == true) {
            Navigator.popUntil(context, (route) => route.isFirst);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  "Telebirr payment completed. Your ticket status will update shortly.",
                ),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 5),
              ),
            );
          }
        } else {
          final uri = Uri.parse(launchPaymentUrl);
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);

            // Navigate back and show success message
            if (mounted) {
              Navigator.popUntil(context, (route) => route.isFirst);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    "Payment initiated via $paymentMethod. Complete payment to receive your tickets.",
                  ),
                  backgroundColor: Colors.green,
                  duration: const Duration(seconds: 5),
                ),
              );
            }
          } else {
            throw Exception("Could not launch payment page");
          }
        }
      } else {
        throw Exception("Invalid payment URL received");
      }
    } catch (e) {
      debugPrint('Payment Process error: $e');
      if (mounted) {
        String errorMessage = ErrorMessageHandler.getReadableError(e);

        final isTicketLimitError =
            errorMessage.contains('Maximum 5 tickets per user for this tier') ||
            errorMessage.toLowerCase().contains('only buy up to 5 tickets');
        final isAvailabilityError =
          errorMessage.toLowerCase().contains('not enough tickets available') ||
          errorMessage.toLowerCase().contains('not enough capacity available') ||
          errorMessage.toLowerCase().contains('sold out');

        if (isTicketLimitError) {
          errorMessage =
              'You can only buy up to 5 tickets for this ticket type. Reduce quantity and try again.';
        } else if (isAvailabilityError) {
          errorMessage =
              'This tier no longer has enough tickets for your selected quantity. Please reduce quantity or pick another tier.';
        }

        // Handle 401 Unauthorized
        if (errorMessage.contains('401') ||
            errorMessage.toLowerCase().contains('unauthorized')) {
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text(
                "Authentication Required",
                style: TextStyle(color: Colors.black),
              ),
              content: const Text(
                "You need to login to book tickets.",
                style: TextStyle(color: Colors.black87),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text("Cancel"),
                ),
                ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(ctx);
                    final result = await context.push<bool>('/login');
                    if (result == true && mounted) {
                      _processPayment();
                    }
                  },
                  child: const Text("Login"),
                ),
              ],
            ),
          );
          return; // Exit function so snackbar doesn't show
        }

        if (errorMessage.contains('DioError')) {
          // Parse custom error format if it matches the one we added to BookingService
          // But actually PaymentService might need the same error handler.
          // For now, just show the raw message which is helpful for debugging.
        }

        if (isTicketLimitError) {
          showDialog(
            context: context,
            builder: (ctx) => Dialog(
              backgroundColor: Colors.transparent,
              insetPadding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 24,
              ),
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1B1728),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFF8B5CF6).withOpacity(0.35),
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(
                          Icons.info_outline,
                          color: Color(0xFFF59E0B),
                          size: 24,
                        ),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Ticket Limit Reached',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'Sorry, you can only buy up to 5 tickets for this ticket type.',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Please reduce your quantity to 5 or fewer, then try again.',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(ctx),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(
                                color: Colors.white.withOpacity(0.25),
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              'OK',
                              style: TextStyle(color: Colors.white70),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pop(ctx);
                              if (mounted) {
                                Navigator.pop(context, 'adjust_quantity');
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF8B5CF6),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              'Adjust Quantity',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
          return;
        }

        if (isAvailabilityError) {
          showDialog(
            context: context,
            builder: (ctx) => Dialog(
              backgroundColor: Colors.transparent,
              insetPadding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 24,
              ),
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1B1728),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFFF59E0B).withOpacity(0.35),
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(
                          Icons.event_busy_outlined,
                          color: Color(0xFFF59E0B),
                          size: 24,
                        ),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Limited Availability',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'There are not enough tickets left for your selected quantity.',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Please reduce quantity or choose another ticket type.',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(ctx),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(
                                color: Colors.white.withOpacity(0.25),
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              'Close',
                              style: TextStyle(color: Colors.white70),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pop(ctx);
                              if (mounted) {
                                Navigator.pop(context, 'adjust_quantity');
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF8B5CF6),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              'Adjust Quantity',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
          return;
        }

        final normalizedError = errorMessage.toLowerCase();
        String friendlyPaymentMessage;
        if (normalizedError.contains('network') ||
            normalizedError.contains('timeout') ||
            normalizedError.contains('socket') ||
            normalizedError.contains('connection')) {
          friendlyPaymentMessage =
              'We could not connect to the payment service. Please check your internet and try again.';
        } else if (normalizedError.contains('invalid') ||
            normalizedError.contains('not allowed')) {
          friendlyPaymentMessage =
              'This payment request could not be completed. Please review your details and try again.';
        } else {
          friendlyPaymentMessage =
              'Sorry, we could not complete your payment right now. Please try again in a moment.';
        }

        // User-focused dialog for non-limit errors
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: const Color(0xFF1D192B),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            title: Row(
              children: const [
                Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 28),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    "Couldn't Complete Payment",
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.white, fontSize: 18),
                  ),
                ),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  friendlyPaymentMessage,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'No charge is made until payment is confirmed.',
                  style: TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text(
                  "Close",
                  style: TextStyle(color: Colors.white54),
                ),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  _processPayment(); // Retry without restarting flow
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8B5CF6),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
                child: const Text(
                  "Try Again",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessingPayment = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0D15),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new,
            color: Colors.white,
            size: 20,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Checkout",
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Text(_error!, style: const TextStyle(color: Colors.red)),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Event Info Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1D192B),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: AppImage(
                            imageUrl: widget.event.coverImage,
                            width: 60,
                            height: 60,
                            placeholder: 'https://picsum.photos/200',
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.event.title,
                                style: GoogleFonts.poppins(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                "${widget.quantity}x ${widget.tierName}",
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Security Badge
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFF10B981).withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.lock_outline,
                          color: Color(0xFF10B981),
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            "Payment verified securely via encrypted connection",
                            style: GoogleFonts.poppins(
                              color: const Color(0xFF10B981),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Price Breakdown
                  Text(
                    "Payment Breakdown",
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Clear pricing with no hidden fees",
                    style: GoogleFonts.poppins(
                      color: Colors.white54,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 16),

                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1D192B),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        _buildRow(
                          "Ticket Price (${widget.quantity}x)",
                          "${(widget.unitPrice * widget.quantity).toStringAsFixed(2)} ETB",
                        ),
                        if (_priceBreakdown != null) ...[
                          _buildRow(
                            "Commission",
                            "${(_priceBreakdown!['commission'] ?? 0).toStringAsFixed(2)} ETB",
                            subtitle: "Platform service",
                          ),
                          _buildRow(
                            "Convenience Fee",
                            "${(_priceBreakdown!['convenienceFee'] ?? 0).toStringAsFixed(2)} ETB",
                            subtitle: "Secure processing",
                          ),
                          if ((_priceBreakdown!['discount'] ?? 0) > 0)
                            _buildRow(
                              "Promo Discount",
                              "-${(_priceBreakdown!['discount'] ?? 0).toStringAsFixed(2)} ETB",
                              color: const Color(0xFF10B981),
                              subtitle: "Code applied",
                            ),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Divider(color: Colors.white24),
                          ),
                          _buildRow(
                            "Total Amount",
                            "${(_priceBreakdown!['total'] ?? 0).toStringAsFixed(2)} ETB",
                            isBold: true,
                            size: 20,
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Payment Method Selection
                  Text(
                    "Payment Method",
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildPaymentOption(
                    "Telebirr",
                    "TELEBIRR",
                    Icons.mobile_friendly,
                  ),
                  const SizedBox(height: 8),
                  _buildPaymentOption(
                    "Chapa (Cards & Banks)",
                    "CHAPA",
                    Icons.credit_card,
                  ),

                  const SizedBox(height: 32),

                  // Promo Code
                  Text(
                    "Promo Code",
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _promoController,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: const Color(0xFF1D192B),
                            hintText: "Enter code",
                            hintStyle: const TextStyle(color: Colors.white30),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: _applyPromo,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white10,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 14,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          "Apply",
                          style: TextStyle(color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                  if (_promoError != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        _promoError!,
                        style: const TextStyle(color: Colors.red, fontSize: 12),
                      ),
                    ),

                  const SizedBox(height: 48),

                  // Checkout Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isProcessingPayment ? null : _processPayment,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF8B5CF6),
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        disabledBackgroundColor: const Color(
                          0xFF8B5CF6,
                        ).withOpacity(0.5),
                      ),
                      child: _isProcessingPayment
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Text(
                              "Pay Now",
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildRow(
    String label,
    String value, {
    bool isBold = false,
    double size = 14,
    Color? color,
    String? subtitle,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(color: Colors.white70, fontSize: size),
                ),
                if (subtitle != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      subtitle,
                      style: TextStyle(color: Colors.white38, fontSize: 11),
                    ),
                  ),
              ],
            ),
          ),
          Text(
            value,
            style: GoogleFonts.poppins(
              color: color ?? Colors.white,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              fontSize: size,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentOption(String label, String value, IconData icon) {
    final isSelected = _selectedPaymentMethod == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedPaymentMethod = value),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF8B5CF6).withOpacity(0.2)
              : const Color(0xFF1D192B),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF8B5CF6) : Colors.transparent,
            width: 2,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? const Color(0xFF8B5CF6) : Colors.white70,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
            const Spacer(),
            if (isSelected)
              const Icon(
                Icons.check_circle,
                color: Color(0xFF8B5CF6),
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}
