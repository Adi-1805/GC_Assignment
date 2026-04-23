const db = require("./db");

function toIso(dateInput) {
  return new Date(dateInput).toISOString();
}

function addMinutes(dateInput, mins) {
  return new Date(new Date(dateInput).getTime() + mins * 60 * 1000);
}

function getStatusFromTimes(rfq) {
  const now = new Date();
  const bidStart = new Date(rfq.bid_start);
  const bidClose = new Date(rfq.bid_close);
  const forcedClose = new Date(rfq.forced_close);

  if (rfq.status === "FORCE_CLOSED") return "FORCE_CLOSED";
  if (now < bidStart) return "UPCOMING";
  if (now >= forcedClose) return "FORCE_CLOSED";
  if (now <= bidClose) return "ACTIVE";
  return "CLOSED";
}

function buildRankings(rfqId, options = {}) {
  const { excludeBidId } = options;

  const conditions = ["b.rfq_id = ?"];
  const params = [rfqId];
  if (excludeBidId) {
    conditions.push("b.id != ?");
    params.push(excludeBidId);
  }

  const rows = db
    .prepare(
      `
      SELECT
        s.id as supplier_id,
        s.name as supplier_name,
        MIN(b.total_price) as best_total
      FROM bids b
      JOIN suppliers s ON s.id = b.supplier_id
      WHERE ${conditions.join(" AND ")}
      GROUP BY s.id, s.name
      ORDER BY best_total ASC
      `
    )
    .all(...params);

  return rows.map((row, idx) => ({
    rank: idx + 1,
    rankLabel: `L${idx + 1}`,
    supplier_id: row.supplier_id,
    supplier_name: row.supplier_name,
    total_price: Number(row.best_total)
  }));
}

function getRankings(rfqId) {
  return buildRankings(rfqId).slice(0, 3);
}

function getAuctionStatus(rfq) {
  return getStatusFromTimes(rfq);
}

function hasAnyRankChange(before, after) {
  const maxLength = Math.max(before.length, after.length);
  for (let i = 0; i < maxLength; i += 1) {
    const beforeSupplier = before[i] ? before[i].supplier_id : null;
    const afterSupplier = after[i] ? after[i].supplier_id : null;
    if (beforeSupplier !== afterSupplier) return true;
  }
  return false;
}

function didL1Change(before, after) {
  const beforeTop = before[0] ? before[0].supplier_id : null;
  const afterTop = after[0] ? after[0].supplier_id : null;
  return beforeTop !== afterTop;
}

function checkAndExtend(rfqId, newBidId) {
  const rfq = db.prepare("SELECT * FROM rfqs WHERE id = ?").get(rfqId);
  if (!rfq) return { extended: false, reason: "RFQ not found" };

  const config = db
    .prepare("SELECT * FROM auction_configs WHERE rfq_id = ?")
    .get(rfqId);
  if (!config) return { extended: false, reason: "No auction config" };

  const now = new Date();
  const bidClose = new Date(rfq.bid_close);
  const forcedClose = new Date(rfq.forced_close);
  const triggerWindowStart = addMinutes(bidClose, -config.trigger_window_mins);

  // Gate 1: bid must come in trigger window.
  if (now < triggerWindowStart) {
    return { extended: false, reason: "Gate 1 failed: outside trigger window" };
  }

  const beforeRankings = buildRankings(rfqId, { excludeBidId: newBidId });
  const afterRankings = buildRankings(rfqId);

  // Gate 2: trigger type condition.
  let triggerPassed = false;
  if (config.trigger_type === "BID_RECEIVED") {
    triggerPassed = true;
  } else if (config.trigger_type === "ANY_RANK_CHANGE") {
    triggerPassed = hasAnyRankChange(beforeRankings, afterRankings);
  } else if (config.trigger_type === "L1_CHANGE") {
    triggerPassed = didL1Change(beforeRankings, afterRankings);
  }

  if (!triggerPassed) {
    return { extended: false, reason: "Gate 2 failed: trigger condition false" };
  }

  const newClose = addMinutes(bidClose, config.extension_duration_mins);

  // Gate 3: do not overshoot forced close.
  if (newClose > forcedClose) {
    return { extended: false, reason: "Gate 3 failed: exceeds forced close" };
  }

  const tx = db.transaction(() => {
    db.prepare("UPDATE rfqs SET bid_close = ?, status = 'OPEN' WHERE id = ?").run(
      toIso(newClose),
      rfqId
    );
    db.prepare(
      `
      INSERT INTO auction_extensions (rfq_id, bid_id, old_bid_close, new_bid_close, reason)
      VALUES (?, ?, ?, ?, ?)
      `
    ).run(rfqId, newBidId, toIso(bidClose), toIso(newClose), config.trigger_type);
  });
  tx();

  return {
    extended: true,
    reason: config.trigger_type,
    oldBidClose: toIso(bidClose),
    newBidClose: toIso(newClose)
  };
}

module.exports = {
  getRankings,
  getAuctionStatus,
  checkAndExtend
};
