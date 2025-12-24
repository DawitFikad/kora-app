import '../../events/models/event.dart';

enum TicketStatus { VALID, USED, CANCELLED, REFUNDED }

class Ticket {
  final String id;
  final String qrPayload;
  final String status;
  final Event event;
  final String? seatNumber;
  final DateTime createdAt;

  Ticket({
    required this.id,
    required this.qrPayload,
    required this.status,
    required this.event,
    this.seatNumber,
    required this.createdAt,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    return Ticket(
      id: json['id'],
      qrPayload: json['qrPayload'],
      status: json['status'],
      event: Event.fromJson(json['event']),
      seatNumber: json['seatNumber'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
