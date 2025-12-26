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
      id: json['id'],
      name: json['name'],
      price: double.parse(json['price'].toString()),
      capacity: json['capacity'],
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
