const express = require("express");
const db = require("../db");
const { getRankings, getAuctionStatus } = require("../auctionEngine");

const router = express.Router();

function toNum(value) {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

router.get("/", (req, res) => {
  const rfqs = db.prepare("SELECT * FROM rfqs ORDER BY id DESC").all();

  const data = rfqs.map((rfq) => {
    const rankings = getRankings(rfq.id);
    const extensionCount = db
      .prepare("SELECT COUNT(*) as count FROM auction_extensions WHERE rfq_id = ?")
      .get(rfq.id).count;

    return {
      ...rfq,
      status: getAuctionStatus(rfq),
      l1_price: rankings[0] ? rankings[0].total_price : null,
      extension_count: extensionCount
    };
  });

  res.json(data);
});

router.get("/:id", (req, res) => {
  const rfqId = Number(req.params.id);
  if (!rfqId) return res.status(400).json({ error: "Invalid rfq id" });

  const rfq = db.prepare("SELECT * FROM rfqs WHERE id = ?").get(rfqId);
  if (!rfq) return res.status(404).json({ error: "RFQ not found" });

  const config = db
    .prepare("SELECT * FROM auction_configs WHERE rfq_id = ?")
    .get(rfqId);
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

  res.json({
    rfq: { ...rfq, status: getAuctionStatus(rfq) },
    config,
    rankings,
    bids,
    extensions
  });
});

router.post("/", (req, res) => {
  const {
    title,
    description,
    bid_start,
    bid_close,
    forced_close,
    trigger_window_mins,
    extension_duration_mins,
    trigger_type
  } = req.body;

  if (!title || !bid_start || !bid_close || !forced_close || !trigger_type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const bidStart = new Date(bid_start);
  const bidClose = new Date(bid_close);
  const forcedClose = new Date(forced_close);

  if (bidClose <= bidStart) {
    return res.status(400).json({ error: "bid_close must be > bid_start" });
  }
  if (forcedClose <= bidClose) {
    return res.status(400).json({ error: "forced_close must be > bid_close" });
  }

  const triggerWindow = toNum(trigger_window_mins);
  const extensionDuration = toNum(extension_duration_mins);
  if (!triggerWindow || triggerWindow < 1) {
    return res
      .status(400)
      .json({ error: "trigger_window_mins must be >= 1" });
  }
  if (!extensionDuration || extensionDuration < 1) {
    return res
      .status(400)
      .json({ error: "extension_duration_mins must be >= 1" });
  }

  const validTriggers = ["BID_RECEIVED", "ANY_RANK_CHANGE", "L1_CHANGE"];
  if (!validTriggers.includes(trigger_type)) {
    return res.status(400).json({ error: "Invalid trigger type" });
  }

  const tx = db.transaction(() => {
    const rfqInfo = db
      .prepare(
        `
      INSERT INTO rfqs (title, description, bid_start, bid_close, forced_close)
      VALUES (?, ?, ?, ?, ?)
      `
      )
      .run(
        title,
        description || "",
        bidStart.toISOString(),
        bidClose.toISOString(),
        forcedClose.toISOString()
      );

    db.prepare(
      `
      INSERT INTO auction_configs (rfq_id, trigger_window_mins, extension_duration_mins, trigger_type)
      VALUES (?, ?, ?, ?)
      `
    ).run(rfqInfo.lastInsertRowid, triggerWindow, extensionDuration, trigger_type);

    return rfqInfo.lastInsertRowid;
  });

  const rfqId = tx();
  const newRfq = db.prepare("SELECT * FROM rfqs WHERE id = ?").get(rfqId);
  const config = db
    .prepare("SELECT * FROM auction_configs WHERE rfq_id = ?")
    .get(rfqId);

  res.status(201).json({
    message: "RFQ created",
    rfq: { ...newRfq, status: getAuctionStatus(newRfq) },
    config
  });
});

module.exports = router;
