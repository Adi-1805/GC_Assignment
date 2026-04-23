# British Auction RFQ Assignment

This is a simple assignment project to show a British auction style RFQ system.

## Tech used

- Backend: Node.js + Express + better-sqlite3 + node-cron
- Frontend: plain React from CDN in one `index.html`
- No ORM, no TypeScript, no build tools

## Project structure

```
backend/
  src/
    index.js
    db.js
    auctionEngine.js
    routes/
      rfqs.js
      bids.js
  package.json
frontend/
  index.html
README.md
```

## How to run

1. Go to backend folder:
   - `cd backend`
2. Install dependencies:
   - `npm install`
3. Start server:
   - `npm start`
4. Open `frontend/index.html` in browser.

Backend runs on `http://localhost:4000`.

## Render deployment notes

This project is now set up so backend can serve frontend directly.

### Option A (recommended): one Render Web Service

1. Create a Web Service in Render from this repo.
2. Use:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Add environment variables:
   - `DATABASE_PATH=/tmp/auction.db`
   - `FRONTEND_ORIGIN=*` (or set exact Render domain)
4. Deploy. Open the service URL directly. It serves:
   - UI on `/`
   - API on `/api/...`

### Option B: separate frontend static hosting

If frontend is hosted separately, set:
- `FRONTEND_ORIGIN=<your-frontend-url>`

And update frontend API base only if needed.

## Main logic notes

- `auctionEngine.js` has:
  - `getRankings(rfqId)` to calculate live L1/L2/L3
  - `getAuctionStatus(rfq)` to show UPCOMING/ACTIVE/CLOSED/FORCE_CLOSED
  - `checkAndExtend(rfqId, newBidId)` with 3 gates:
    1) bid in trigger window
    2) trigger type condition passed
    3) extension does not cross forced close

- Extension log is saved in `auction_extensions`.

- `index.js` also has cron every 30 seconds:
  - logs every tick for demo visibility
  - closes auction when bid close time passes
  - force closes auction when forced close time passes

## API list

- `GET /api/rfqs`
- `GET /api/rfqs/:id`
- `POST /api/rfqs`
- `GET /api/bids/suppliers`
- `POST /api/bids/:rfqId`

## Validation handled

- `forced_close > bid_close`
- `bid_close > bid_start`
- cannot submit bid if auction is not ACTIVE
- `trigger_window_mins >= 1`
- `extension_duration_mins >= 1`

## Quick demo flow

1. Create RFQ with start/close/forced close
2. Open RFQ detail page
3. Add bids near closing window to trigger extension
4. Watch extension entries in activity log
5. Watch cron logs in backend terminal

## Requirement check summary

- British auction extension logic with all 3 trigger types: done
- 3 gate extension checks: done
- Hard stop at forced close: done
- Cron safety net every 30 seconds: done
- RFQ list/detail/create APIs: done
- Bid submit + extension check API: done
- List page with status, L1, close times, countdown: done
- Detail page rankings + bids sorted by price + config + logs: done
- Validation rules from assignment: done
