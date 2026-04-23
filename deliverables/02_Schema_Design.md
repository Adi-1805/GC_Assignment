# Schema Design - British Auction RFQ

Database engine: SQLite (`better-sqlite3`)  
Storage file: `backend/auction.db` (or `DATABASE_PATH` in deployment)

## 1) `rfqs`

Stores each auction/RFQ master record.

- `id`: INTEGER, PK, AUTOINCREMENT, RFQ identifier
- `title`: TEXT, NOT NULL, RFQ name
- `description`: TEXT, nullable, RFQ notes
- `bid_start`: TEXT, NOT NULL, auction start datetime (ISO)
- `bid_close`: TEXT, NOT NULL, current bid close datetime (can extend)
- `forced_close`: TEXT, NOT NULL, hard stop datetime
- `status`: TEXT, NOT NULL, default `OPEN`, stored status for cron updates
- `created_at`: TEXT, NOT NULL, default now, creation timestamp

## 2) `auction_configs`

Stores extension rules for each RFQ (1:1 with RFQ).

- `id`: INTEGER, PK, AUTOINCREMENT, config row id
- `rfq_id`: INTEGER, NOT NULL, UNIQUE, FK -> `rfqs.id`, RFQ mapping
- `trigger_window_mins`: INTEGER, NOT NULL, X-minute trigger window
- `extension_duration_mins`: INTEGER, NOT NULL, Y-minute extension amount
- `trigger_type`: TEXT, NOT NULL, CHECK enum, trigger mode
- `created_at`: TEXT, NOT NULL, default now, creation timestamp

`trigger_type` enum values:
- `BID_RECEIVED`
- `ANY_RANK_CHANGE`
- `L1_CHANGE`

## 3) `suppliers`

Supplier master table.

- `id`: INTEGER, PK, AUTOINCREMENT, supplier id
- `name`: TEXT, NOT NULL, supplier name
- `code`: TEXT, NOT NULL, UNIQUE, short code
- `created_at`: TEXT, NOT NULL, default now, creation timestamp

## 4) `bids`

Stores bid submissions by suppliers.

- `id`: INTEGER, PK, AUTOINCREMENT, bid id
- `rfq_id`: INTEGER, NOT NULL, FK -> `rfqs.id`, RFQ mapping
- `supplier_id`: INTEGER, NOT NULL, FK -> `suppliers.id`, supplier mapping
- `freight_charge`: REAL, NOT NULL, freight component
- `origin_charge`: REAL, NOT NULL, origin component
- `destination_charge`: REAL, NOT NULL, destination component
- `total_price`: REAL, NOT NULL, sum of all components
- `created_at`: TEXT, NOT NULL, default now, bid timestamp

## 5) `auction_extensions`

Tracks every successful extension event.

- `id`: INTEGER, PK, AUTOINCREMENT, extension id
- `rfq_id`: INTEGER, NOT NULL, FK -> `rfqs.id`, RFQ mapping
- `bid_id`: INTEGER, NOT NULL, FK -> `bids.id`, triggering bid
- `old_bid_close`: TEXT, NOT NULL, previous close time
- `new_bid_close`: TEXT, NOT NULL, extended close time
- `reason`: TEXT, NOT NULL, trigger reason
- `created_at`: TEXT, NOT NULL, default now, extension timestamp

## 6) Relationship Summary

- `rfqs` 1 --- 1 `auction_configs`
- `rfqs` 1 --- N `bids`
- `suppliers` 1 --- N `bids`
- `rfqs` 1 --- N `auction_extensions`
- `bids` 1 --- N `auction_extensions` (logical trigger link)

## 7) Validation Rules Enforced in API

- `bid_close > bid_start`
- `forced_close > bid_close`
- `trigger_window_mins >= 1`
- `extension_duration_mins >= 1`
- bidding only allowed when computed status is `ACTIVE`
- extension never allowed beyond `forced_close`
