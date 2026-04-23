const express = require("express");
const db = require("../db");
const { checkAndExtend, getAuctionStatus, getRankings } = require("../auctionEngine");

const router = express.Router();

function toNum(value) {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

router.get("/suppliers", (req, res) => {
  const suppliers = db.prepare("SELECT * FROM suppliers ORDER BY name ASC").all();
  res.json(suppliers);
});

router.post("/:rfqId", (req, res) => {
  const rfqId = Number(req.params.rfqId);
  if (!rfqId) return res.status(400).json({ error: "Invalid rfq id" });

  const { supplier_id, freight_charge, origin_charge, destination_charge } = req.body;
  const supplierId = Number(supplier_id);
  const freight = toNum(freight_charge);
  const origin = toNum(origin_charge);
  const destination = toNum(destination_charge);

  if (!supplierId || freight === null || origin === null || destination === null) {
    return res.status(400).json({ error: "Missing bid fields" });
  }

  const rfq = db.prepare("SELECT * FROM rfqs WHERE id = ?").get(rfqId);
  if (!rfq) return res.status(404).json({ error: "RFQ not found" });

  const status = getAuctionStatus(rfq);
  if (status !== "ACTIVE") {
    return res.status(400).json({ error: "Cannot submit bid if auction is not ACTIVE" });
  }

  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(supplierId);
  if (!supplier) return res.status(404).json({ error: "Supplier not found" });

  const total = freight + origin + destination;

  const bidInsert = db
    .prepare(
      `
      INSERT INTO bids (rfq_id, supplier_id, freight_charge, origin_charge, destination_charge, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
      `
    )
    .run(rfqId, supplierId, freight, origin, destination, total);

  const bidId = bidInsert.lastInsertRowid;
  const extensionResult = checkAndExtend(rfqId, bidId);

  const freshRfq = db.prepare("SELECT * FROM rfqs WHERE id = ?").get(rfqId);
  const rankings = getRankings(rfqId);
  const bids = db
    .prepare(
      `
      SELECT b.*, s.name as supplier_name, s.code as supplier_code
      FROM bids b
      JOIN suppliers s ON s.id = b.supplier_id
      WHERE b.rfq_id = ?
      ORDER BY b.total_price ASC, b.created_at DESC
      `
    )
    .all(rfqId);
  const extensions = db
    .prepare(
      `
      SELECT ae.*, s.name as supplier_name
      FROM auction_extensions ae
      LEFT JOIN bids b ON b.id = ae.bid_id
      LEFT JOIN suppliers s ON s.id = b.supplier_id
      WHERE ae.rfq_id = ?
      ORDER BY ae.created_at DESC
      `
    )
    .all(rfqId);

  res.status(201).json({
    message: "Bid submitted",
    extensionResult,
    rfq: { ...freshRfq, status: getAuctionStatus(freshRfq) },
    rankings,
    bids,
    extensions
  });
});

module.exports = router;
