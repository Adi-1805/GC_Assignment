const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const path = require("path");
const db = require("./db");
const rfqRoutes = require("./routes/rfqs");
const bidRoutes = require("./routes/bids");

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

app.use(
  cors({
    origin: FRONTEND_ORIGIN
  })
);
app.use(express.json());

app.use("/api/rfqs", rfqRoutes);
app.use("/api/bids", bidRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "server running" });
});

function runAuctionCronTick() {
  const now = new Date();
  const nowIso = now.toISOString();
  console.log(`[CRON] Tick at ${nowIso}`);

  const activeCandidates = db
    .prepare(
      `
      SELECT * FROM rfqs
      WHERE bid_start < ? AND forced_close > ?
      `
    )
    .all(nowIso, nowIso);

  let closedByBidClose = 0;
  let forceClosed = 0;

  activeCandidates.forEach((rfq) => {
    const bidClose = new Date(rfq.bid_close);
    const forcedClose = new Date(rfq.forced_close);

    if (bidClose < now && forcedClose > now && rfq.status !== "CLOSED") {
      // This marks normal closure even if no final bid came in.
      db.prepare("UPDATE rfqs SET status = 'CLOSED' WHERE id = ?").run(rfq.id);
      closedByBidClose += 1;
    }
  });

  const forcedCandidates = db
    .prepare("SELECT * FROM rfqs WHERE forced_close < ? AND status != 'FORCE_CLOSED'")
    .all(nowIso);

  forcedCandidates.forEach((rfq) => {
    db.prepare("UPDATE rfqs SET status = 'FORCE_CLOSED' WHERE id = ?").run(rfq.id);
    forceClosed += 1;
  });

  console.log(
    `[CRON] active_checked=${activeCandidates.length}, closed=${closedByBidClose}, force_closed=${forceClosed}`
  );
}

cron.schedule("*/30 * * * * *", runAuctionCronTick);

app.use(express.static(path.join(__dirname, "..", "..", "frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "frontend", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log("Cron is running every 30 seconds");
});
