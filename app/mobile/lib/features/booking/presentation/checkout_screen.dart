import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/features/booking/services/booking_service.dart';
import 'package:mobile/features/booking/services/payment_service.dart';
import 'package:mobile/features/events/models/event.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile/core/widgets/app_image.dart';
import 'package:go_router/go_router.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  final Event event;
  final int tierId;
  final String tierName;
  final double unitPrice;
  final int quantity;

  const CheckoutScreen({
    super.key,
    required this.event,
    required this.tierId,
    required this.tierName,
    required this.unitPrice,
    required this.quantity,
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
      final result = await ref.read(bookingServiceProvider).calculatePrice(
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
          _error = e.toString().replaceAll('Exception: ', '');
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
      await ref.read(bookingServiceProvider).validatePromoCode(code, widget.event.id);
      
      setState(() {
        _appliedPromoCode = code;
      });
      _fetchPriceBreakdown();
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Promo code applied!", style: TextStyle(color: Colors.white)), backgroundColor: Colors.green),
      );
    } catch (e) {
      setState(() {
        _promoError = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  Future<void> _processPayment() async {
    setState(() => _isProcessingPayment = true);

    try {
      // 1. Create Reservation
      final reservation = await ref.read(bookingServiceProvider).createReservation(
        eventId: widget.event.id,
        tierId: widget.tierId,
        quantity: widget.quantity,
        promoCode: _appliedPromoCode,
        paymentMethod: _selectedPaymentMethod, // Using selected method
      );

      final purchaseId = reservation['purchaseId'];

      // 2. Initialize Payment with Real Provider (Chapa/Telebirr)
      final paymentResponse = await ref.read(paymentServiceProvider).initializePayment(
        purchaseId: purchaseId,
      );

      final paymentUrl = paymentResponse['checkoutUrl'] ?? '';
      final paymentMethod = paymentResponse['method'] ?? 'CHAPA';

      // 3. Launch Payment URL
      if (paymentUrl.isNotEmpty) {
        final uri = Uri.parse(paymentUrl);
        if (await canLaunchUrl(uri)) {
           await launchUrl(uri, mode: LaunchMode.externalApplication);
           
           // Navigate back and show success message
           if (mounted) {
             Navigator.popUntil(context, (route) => route.isFirst);
             ScaffoldMessenger.of(context).showSnackBar(
               SnackBar(
                 content: Text("Payment initiated via $paymentMethod. Complete payment to receive your tickets."),
                 backgroundColor: Colors.green,
                 duration: const Duration(seconds: 5),
               ),
             );
           }
        } else {
          throw Exception("Could not launch payment page");
        }
      } else {
        throw Exception("Invalid payment URL received");
      }

    } catch (e) {
      debugPrint('Payment Process error: $e');
      if (mounted) {
        String errorMessage = e.toString().replaceAll('Exception: ', '');
        
        // Handle 401 Unauthorized
        if (errorMessage.contains('401') || errorMessage.toLowerCase().contains('unauthorized')) {
             showDialog(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text("Authentication Required", style: TextStyle(color: Colors.black)),
                content: const Text("You need to login to book tickets.", style: TextStyle(color: Colors.black87)),
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
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage), 
            backgroundColor: Colors.redAccent,
            duration: const Duration(seconds: 10),
            action: SnackBarAction(label: 'Dismiss', textColor: Colors.white, onPressed: () {}),
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
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Checkout",
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        centerTitle: true,
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : _error != null 
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
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
                                    style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    "${widget.quantity}x ${widget.tierName}",
                                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      
                      // Price Breakdown
                      Text("Payment Detail", style: GoogleFonts.poppins(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      
                      _buildRow("Subtotal", "${(widget.unitPrice * widget.quantity).toStringAsFixed(2)} ETB"),
                      if (_priceBreakdown != null) ...[
                        _buildRow("Service Fee", "${(_priceBreakdown!['fee'] ?? 0).toStringAsFixed(2)} ETB"),
                        if ((_priceBreakdown!['discount'] ?? 0) > 0)
                          _buildRow("Discount", "-${(_priceBreakdown!['discount'] ?? 0).toStringAsFixed(2)} ETB", color: Colors.green),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Divider(color: Colors.white24),
                        ),
                        _buildRow("Total", "${(_priceBreakdown!['total'] ?? 0).toStringAsFixed(2)} ETB", isBold: true, size: 20),
                      ],
                      
                      const SizedBox(height: 32),
                      
                      // Payment Method Selection
                      Text("Payment Method", style: GoogleFonts.poppins(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      _buildPaymentOption("Telebirr", "TELEBIRR", Icons.mobile_friendly),
                      const SizedBox(height: 8),
                      _buildPaymentOption("Chapa (Cards & Banks)", "CHAPA", Icons.credit_card),
                      
                      const SizedBox(height: 32),

                      // Promo Code
                      Text("Promo Code", style: GoogleFonts.poppins(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
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
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          ElevatedButton(
                            onPressed: _applyPromo,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white10,
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text("Apply", style: TextStyle(color: Colors.white)),
                          ),
                        ],
                      ),
                      if (_promoError != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(_promoError!, style: const TextStyle(color: Colors.red, fontSize: 12)),
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
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            disabledBackgroundColor: const Color(0xFF8B5CF6).withOpacity(0.5),
                          ),
                          child: _isProcessingPayment 
                              ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text("Pay Now", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
              ),
    );
  }

  Widget _buildRow(String label, String value, {bool isBold = false, double size = 14, Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.white70, fontSize: size)),
          Text(
            value, 
            style: GoogleFonts.poppins(
              color: color ?? Colors.white, 
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              fontSize: size
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
          color: isSelected ? const Color(0xFF8B5CF6).withOpacity(0.2) : const Color(0xFF1D192B),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF8B5CF6) : Colors.transparent,
            width: 2
          )
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? const Color(0xFF8B5CF6) : Colors.white70),
            const SizedBox(width: 12),
            Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
            const Spacer(),
            if (isSelected)
              const Icon(Icons.check_circle, color: Color(0xFF8B5CF6), size: 20)
          ],
        ),
      ),
    );
  }
}
