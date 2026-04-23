# Backend Code Deliverable

## Stack

- Node.js
- Express
- better-sqlite3 (raw SQL)
- node-cron

## Backend Folder Structure

```text
backend/
  package.json
  src/
    index.js
    db.js
    auctionEngine.js
    routes/
      rfqs.js
      bids.js
```

## Key Modules

- `src/index.js`
  - starts Express server
  - serves frontend static files
  - registers cron job every 30 seconds
  - has `/api/health` route

- `src/db.js`
  - creates SQLite tables
  - seeds supplier master data

- `src/auctionEngine.js`
  - `getRankings(rfqId)`
  - `getAuctionStatus(rfq)`
  - `checkAndExtend(rfqId, newBidId)` with 3-gate extension logic

- `src/routes/rfqs.js`
  - `GET /api/rfqs`
  - `GET /api/rfqs/:id`
  - `POST /api/rfqs`

- `src/routes/bids.js`
  - `GET /api/bids/suppliers`
  - `POST /api/bids/:rfqId`

## API Summary

- `GET /api/rfqs`  
  Returns all RFQs with computed status, L1 price, extension count.

- `GET /api/rfqs/:id`  
  Returns full RFQ detail (config, rankings, bids, extension log).

- `POST /api/rfqs`  
  Creates RFQ + auction config in one DB transaction.

- `GET /api/bids/suppliers`  
  Returns supplier list for dropdown.

- `POST /api/bids/:rfqId`  
  Saves bid, triggers extension check, returns updated state.

## Validation Rules Implemented

- `bid_close > bid_start`
- `forced_close > bid_close`
- `trigger_window_mins >= 1`
- `extension_duration_mins >= 1`
- only `ACTIVE` auctions accept bids

## Cron Safety Net

- Interval: every 30 seconds
- Actions:
  - logs each tick
  - closes auctions where `bid_close` passed
  - force-closes auctions where `forced_close` passed
