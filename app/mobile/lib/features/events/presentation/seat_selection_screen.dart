import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
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
      final errorText = e.toString();
      if (errorText.toLowerCase().contains('only for seat map')) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("tickets.seatmap_not_available".tr())),
          );
          context.pop();
        }
        return;
      }
      setState(() {
        _error = errorText;
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
          "tickets.select_seats".tr(),
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
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFF0000)))
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text("${'common.error'.tr()}: $_error", style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _fetchSeats,
                        child: Text("common.retry".tr()),
                      ),
                    ],
                  ),
                )
              : _buildSeatGrid(),
      bottomNavigationBar: _selectedSeats.isNotEmpty ? _buildBottomBar() : null,
    );
  }

  Widget _buildSeatGrid() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Stage indicator
          Container(
             width: double.infinity,
             height: 40,
             decoration: BoxDecoration(
               color: Colors.white10,
               borderRadius: BorderRadius.circular(40),
             ),
             child: Center(
                child: Text("tickets.stage".tr(), style: GoogleFonts.poppins(color: Colors.white38, letterSpacing: 10, fontWeight: FontWeight.bold)),
             ),
          ),
          const SizedBox(height: 60),
          
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 6,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
            ),
            itemCount: _seats.length,
            itemBuilder: (context, index) {
              final seat = _seats[index];
              final seatNum = seat['seatNumber'] as String;
              final isBooked = seat['status'] == 'BOOKED';
              final isLocked = seat['status'] == 'LOCKED';
              final isSelected = _selectedSeats.contains(seatNum);
              final isAvailable = !isBooked && !isLocked;

              return GestureDetector(
                onTap: isAvailable ? () {
                  setState(() {
                    if (isSelected) {
                      _selectedSeats.remove(seatNum);
                    } else {
                      _selectedSeats.add(seatNum);
                    }
                  });
                } : null,
                child: Container(
                  decoration: BoxDecoration(
                    color: isBooked || isLocked 
                        ? Colors.white12 
                        : (isSelected ? const Color(0xFFFF0000) : Colors.transparent),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isAvailable ? (isSelected ? const Color(0xFFFF0000) : Colors.white24) : Colors.transparent,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      seatNum,
                      style: TextStyle(
                        color: isAvailable ? Colors.white : Colors.white24,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
          
          const SizedBox(height: 40),
          _buildLegend(),
        ],
      ),
    );
  }

  Widget _buildLegend() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _legendItem("tickets.available".tr(), Colors.white24, false),
        _legendItem("tickets.selected".tr(), const Color(0xFFFF0000), true),
        _legendItem("tickets.booked".tr(), Colors.white12, true),
      ],
    );
  }

  Widget _legendItem(String label, Color color, bool fill) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: fill ? color : Colors.transparent,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: color),
          ),
        ),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 12)),
      ],
    );
  }

  Widget _buildBottomBar() {
     return SafeArea(
       child: Container(
         padding: const EdgeInsets.all(24),
         decoration: const BoxDecoration(
           color: Color(0xFF1D192B),
           borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
         ),
         child: Row(
           children: [
             Expanded(
               child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Text("tickets.n_selected".tr(args: [_selectedSeats.length.toString()]), style: const TextStyle(color: Colors.white70, fontSize: 12)),
                  Text(_selectedSeats.join(", "), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ],
               ),
             ),
             const SizedBox(width: 16),
             ElevatedButton(
               onPressed: _isLoading ? null : _onConfirm,
               style: ElevatedButton.styleFrom(
                 backgroundColor: const Color(0xFFFF0000),
                 padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                 shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
               ),
                child: _isLoading 
                 ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                 : Text("common.confirm".tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
             ),
           ],
         ),
       ),
     );
  }
}
