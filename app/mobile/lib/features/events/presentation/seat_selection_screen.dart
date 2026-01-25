import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../booking/services/booking_service.dart';

class SeatSelectionScreen extends ConsumerStatefulWidget {
  final int eventId;
  final int tierId;
  const SeatSelectionScreen({super.key, required this.eventId, required this.tierId});

  @override
  ConsumerState<SeatSelectionScreen> createState() => _SeatSelectionScreenState();
}

class _SeatSelectionScreenState extends ConsumerState<SeatSelectionScreen> {
  final Set<String> _selectedSeats = {};
  List<dynamic> _seats = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchSeats();
  }

  Future<void> _fetchSeats() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final bookingService = ref.read(bookingServiceProvider);
      final seats = await bookingService.getSeatStatus(widget.eventId, widget.tierId);
      setState(() {
        _seats = seats;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _onConfirm() async {
    if (_selectedSeats.isEmpty) return;

    setState(() => _isLoading = true);
    try {
      final bookingService = ref.read(bookingServiceProvider);
      await bookingService.lockSeats(
        eventId: widget.eventId,
        tierId: widget.tierId,
        seatNumbers: _selectedSeats.toList(),
      );
      if (mounted) context.pop(_selectedSeats.toList());
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Failed to lock seats: $e")),
        );
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
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: Text(
          "Select Seats",
          style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _fetchSeats,
          ),
        ],
      ),
      body: _isLoading && _seats.isEmpty
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6)))
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text("Error: $_error", style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _fetchSeats, child: const Text("Retry")),
                    ],
                  ),
                )
              : Column(
                  children: [
                    const SizedBox(height: 20),
                    // Stage
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 40),
                      height: 8,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: const Color(0xFF8B5CF6),
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF8B5CF6).withOpacity(0.5),
                            blurRadius: 10,
                            spreadRadius: 2,
                          )
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text("STAGE", style: TextStyle(color: Colors.white24, fontSize: 10, letterSpacing: 4)),
                    const SizedBox(height: 40),
                    
                    // Seat Grid
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 12,
                          alignment: WrapAlignment.center,
                          children: _seats.map((seat) {
                            final seatId = seat['seatNumber'];
                            final status = seat['status']; // available, locked, sold
                            final isTaken = status == 'sold' || status == 'locked';
                            final isSelected = _selectedSeats.contains(seatId);
                            
                            return GestureDetector(
                              onTap: isTaken ? null : () {
                                setState(() {
                                  if (isSelected) {
                                    _selectedSeats.remove(seatId);
                                  } else {
                                    _selectedSeats.add(seatId);
                                  }
                                });
                              },
                              child: Container(
                                height: 40,
                                width: 40,
                                decoration: BoxDecoration(
                                  color: isTaken 
                                      ? Colors.white10 
                                      : (isSelected ? const Color(0xFF8B5CF6) : Colors.white12),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isSelected ? Colors.white38 : Colors.transparent,
                                  ),
                                ),
                                child: isTaken 
                                    ? Icon(
                                        status == 'sold' ? Icons.close : Icons.lock_outline, 
                                        size: 16, 
                                        color: Colors.white24
                                      )
                                    : Center(
                                        child: Text(
                                          seatId,
                                          style: TextStyle(
                                            color: isSelected ? Colors.white : Colors.white38,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                    
                    // Legend
                    _buildLegend(),
                    
                    // Selection Info & Confirm
                    _buildBottomBar(),
                  ],
                ),
    );
  }

  Widget _buildLegend() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _legendItem("Available", Colors.white12),
          const SizedBox(width: 15),
          _legendItem("Selected", const Color(0xFF8B5CF6)),
          const SizedBox(width: 15),
          _legendItem("Taken", Colors.white10),
          const SizedBox(width: 15),
          _legendItem("Locked", Colors.white10, icon: Icons.lock_outline),
        ],
      ),
    );
  }

  Widget _legendItem(String label, Color color, {IconData? icon}) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4)),
          child: icon != null ? Icon(icon, size: 10, color: Colors.white24) : null,
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 11)),
      ],
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(context).padding.bottom + 24),
      decoration: const BoxDecoration(
        color: Color(0xFF15131C),
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "${_selectedSeats.length} Seats Selected",
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
                const SizedBox(height: 4),
                Text(
                  _selectedSeats.isEmpty ? "-" : _selectedSeats.join(", "),
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          ElevatedButton(
            onPressed: _selectedSeats.isEmpty || _isLoading ? null : _onConfirm,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8B5CF6),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: _isLoading 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text("Confirm"),
          ),
        ],
      ),
    );
  }
}
