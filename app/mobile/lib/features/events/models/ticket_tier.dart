class TicketTier {
  final int id;
  final String name;
  final double price;
  final int capacity;
  final int sold;

  TicketTier({
    required this.id,
    required this.name,
    required this.price,
    required this.capacity,
    required this.sold,
  });

  factory TicketTier.fromJson(Map<String, dynamic> json) {
    return TicketTier(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      name: json['name'] ?? 'Regular',
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      capacity: json['capacity'] ?? 0,
      sold: json['sold'] ?? 0,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'capacity': capacity,
      'sold': sold,
    };
  }
}
