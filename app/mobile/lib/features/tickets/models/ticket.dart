import '../../events/models/event.dart';

enum TicketStatus { VALID, USED, CANCELLED, REFUNDED }

class Ticket {
  final String id;
  final String? ticketCode; // Human readable code (e.g. ET-A1B2)
  final String qrPayload;
  final String status;
  final Event event;
  final String? seatNumber;
  final DateTime createdAt;

  Ticket({
    required this.id,
    this.ticketCode,
    required this.qrPayload,
    required this.status,
    required this.event,
    this.seatNumber,
    required this.createdAt,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    return Ticket(
      id: json['id'],
      ticketCode: json['ticketCode'],
      qrPayload: json['qrPayload'],
      status: json['status'],
      event: Event.fromJson(json['event']),
      seatNumber: json['seatNumber'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ticketCode': ticketCode,
      'qrPayload': qrPayload,
      'status': status,
      'event': event.toJson(),
      'seatNumber': seatNumber,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
