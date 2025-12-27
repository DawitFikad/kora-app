class PaymentMethod {
  final int id;
  final String provider;
  final String accountNumber;
  final String? accountName;
  final bool isDefault;

  PaymentMethod({
    required this.id,
    required this.provider,
    required this.accountNumber,
    this.accountName,
    this.isDefault = false,
  });

  factory PaymentMethod.fromJson(Map<String, dynamic> json) {
    return PaymentMethod(
      id: json['id'],
      provider: json['provider'],
      accountNumber: json['accountNumber'],
      accountName: json['accountName'],
      isDefault: json['isDefault'] ?? false,
    );
  }
}
