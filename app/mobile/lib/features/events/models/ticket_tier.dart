class TicketTier {
  final int id;
  final String name;
  final double price;
  final int capacity;
  final int sold;
  final int? ticketsAvailable;
  final int maxPerUser;

  int get available {
    if (ticketsAvailable != null) {
      return ticketsAvailable!.clamp(0, capacity);
    }
    return (capacity - sold).clamp(0, capacity);
  }

  TicketTier({
    required this.id,
    required this.name,
    required this.price,
    required this.capacity,
    required this.sold,
    this.ticketsAvailable,
    this.maxPerUser = 5,
  });

  factory TicketTier.fromJson(Map<String, dynamic> json) {
    final dynamic soldRaw =
        json['sold'] ??
        json['soldCount'] ??
        json['ticketsSold'] ??
        (json['_count'] is Map ? (json['_count'] as Map)['tickets'] : null);
    final dynamic availableRaw =
        json['ticketsAvailable'] ??
        json['available'] ??
        json['remainingTickets'] ??
        json['remaining'];
    final int capacity = json['capacity'] ?? 0;
    final int? parsedAvailable = availableRaw == null
        ? null
        : (availableRaw is int
              ? availableRaw
              : int.tryParse(availableRaw.toString()));

    final int? parsedSold = soldRaw is int
        ? soldRaw
        : int.tryParse(soldRaw?.toString() ?? '');

    final int effectiveSold = (parsedSold != null && parsedSold >= 0)
        ? parsedSold
        : (parsedAvailable != null
              ? (capacity - parsedAvailable).clamp(0, capacity)
              : 0);

    return TicketTier(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      name: json['name'] ?? 'Regular',
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      capacity: capacity,
      sold: effectiveSold,
      ticketsAvailable: parsedAvailable,
      maxPerUser: json['maxPerUser'] ?? 5,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'capacity': capacity,
      'sold': sold,
      'ticketsAvailable': ticketsAvailable,
      'maxPerUser': maxPerUser,
    };
  }
}
