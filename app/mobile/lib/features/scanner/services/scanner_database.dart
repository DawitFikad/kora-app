import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class ScannerDatabase {
  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('scanner.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    // Table for the downloaded gate list
    await db.execute('''
      CREATE TABLE gate_list (
        id TEXT PRIMARY KEY,
        eventId INTEGER,
        tierId INTEGER,
        seatNumber TEXT,
        attendeeName TEXT,
        status TEXT,
        isUsedLocally INTEGER DEFAULT 0
      )
    ''');

    // Table for scan logs that need to be synced
    await db.execute('''
      CREATE TABLE scan_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticketId TEXT,
        eventId INTEGER,
        scannedAt TEXT,
        syncStatus TEXT DEFAULT 'PENDING'
      )
    ''');
  }

  Future<void> saveGateList(List<Map<String, dynamic>> tickets) async {
    final db = await database;
    final batch = db.batch();
    
    // Clear old list first or handle updates. For now, simple clear for fresh download.
    // batch.delete('gate_list'); 

    for (var ticket in tickets) {
      batch.insert(
        'gate_list',
        {
          'id': ticket['id'],
          'eventId': ticket['eventId'],
          'tierId': ticket['tierId'],
          'seatNumber': ticket['seatNumber'],
          'attendeeName': ticket['attendeeName'],
          'status': ticket['status'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<Map<String, dynamic>?> getTicketById(String id) async {
    final db = await database;
    final maps = await db.query(
      'gate_list',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isNotEmpty) {
      return maps.first;
    }
    return null;
  }

  Future<void> markAsUsedLocally(String ticketId, int eventId) async {
    final db = await database;
    await db.update(
      'gate_list',
      {'isUsedLocally': 1},
      where: 'id = ?',
      whereArgs: [ticketId],
    );

    await db.insert('scan_logs', {
      'ticketId': ticketId,
      'eventId': eventId,
      'scannedAt': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> getPendingLogs() async {
    final db = await database;
    return await db.query('scan_logs', where: 'syncStatus = ?', whereArgs: ['PENDING']);
  }

  Future<void> markLogsAsSynced(List<int> ids) async {
    final db = await database;
    await db.update(
      'scan_logs',
      {'syncStatus': 'SYNCED'},
      where: 'id IN (${ids.join(',')})',
    );
  }
}
