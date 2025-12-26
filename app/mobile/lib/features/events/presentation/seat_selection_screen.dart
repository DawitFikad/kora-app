import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';

class SeatSelectionScreen extends StatefulWidget {
  final int eventId;
  const SeatSelectionScreen({super.key, required this.eventId});

  @override
  State<SeatSelectionScreen> createState() => _SeatSelectionScreenState();
}

class _SeatSelectionScreenState extends State<SeatSelectionScreen> {
  final Set<String> _selectedSeats = {};
  
  // Mocking some taken seats
  final Set<String> _takenSeats = {'A3', 'A4', 'B5', 'C2', 'D7'};

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
      ),
      body: Column(
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
              child: Column(
                children: List.generate(8, (row) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(8, (col) {
                        final seatId = '${String.fromCharCode(65 + row)}${col + 1}';
                        final isTaken = _takenSeats.contains(seatId);
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
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            height: 32,
                            width: 32,
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
                                ? const Icon(Icons.close, size: 16, color: Colors.white24)
                                : Center(
                                    child: Text(
                                      seatId,
                                      style: TextStyle(
                                        color: isSelected ? Colors.white : Colors.white38,
                                        fontSize: 8,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                          ),
                        );
                      }),
                    ),
                  );
                }),
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
          const SizedBox(width: 20),
          _legendItem("Selected", const Color(0xFF8B5CF6)),
          const SizedBox(width: 20),
          _legendItem("Taken", Colors.white10),
        ],
      ),
    );
  }

  Widget _legendItem(String label, Color color) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 12)),
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
            onPressed: _selectedSeats.isEmpty ? null : () => context.pop(_selectedSeats.toList()),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8B5CF6),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: const Text("Confirm"),
          ),
        ],
      ),
    );
  }
}
