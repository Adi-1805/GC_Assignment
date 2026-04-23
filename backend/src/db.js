const path = require("path");
const Database = require("better-sqlite3");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "auction.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rfqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      bid_start TEXT NOT NULL,
      bid_close TEXT NOT NULL,
      forced_close TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auction_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rfq_id INTEGER NOT NULL UNIQUE,
      trigger_window_mins INTEGER NOT NULL,
      extension_duration_mins INTEGER NOT NULL,
      trigger_type TEXT NOT NULL CHECK(trigger_type IN ('BID_RECEIVED', 'ANY_RANK_CHANGE', 'L1_CHANGE')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rfq_id INTEGER NOT NULL,
      supplier_id INTEGER NOT NULL,
      freight_charge REAL NOT NULL,
      origin_charge REAL NOT NULL,
      destination_charge REAL NOT NULL,
      total_price REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS auction_extensions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rfq_id INTEGER NOT NULL,
      bid_id INTEGER NOT NULL,
      old_bid_close TEXT NOT NULL,
      new_bid_close TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
      FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE
    );
  `);
}

function seedSuppliers() {
  const count = db.prepare("SELECT COUNT(*) as count FROM suppliers").get().count;
  if (count > 0) return;

  const insert = db.prepare("INSERT INTO suppliers (name, code) VALUES (?, ?)");
  const suppliers = [
    ["Blue Dart Logistics", "BDL"],
    ["QuickMove Carriers", "QMC"],
    ["SwiftCargo Pvt Ltd", "SCP"],
    ["RoadRunner Freight", "RRF"],
    ["MetroHaul Lines", "MHL"]
  ];

  const tx = db.transaction(() => {
    suppliers.forEach((supplier) => insert.run(supplier[0], supplier[1]));
  });
  tx();
}

createTables();
seedSuppliers();

module.exports = db;
