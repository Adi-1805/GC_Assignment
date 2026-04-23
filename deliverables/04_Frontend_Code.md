# Frontend Code Deliverable

## Stack

- Plain React via CDN
- Single HTML entry (`index.html`)
- No Vite / no build step

## Frontend Folder Structure

```text
frontend/
  index.html
  style.css
  app.js
  components/
    AuctionListView.js
    AuctionDetailView.js
    CreateRFQView.js
```

## UI Views

The frontend has 3 main views managed by `useState`:

1. **Auction List**
   - shows RFQ name, status badge, L1 price
   - shows bid close and forced close
   - live countdown and extension count

2. **Auction Detail**
   - RFQ summary and status
   - auction config (window, extension mins, trigger type)
   - live rankings (L1/L2/L3)
   - bid submission form
   - extension activity log
   - bid activity log

3. **Create RFQ**
   - full RFQ form
   - auction trigger configuration fields

## Live Behaviors

- polling: `GET /api/rfqs/:id` every 8 seconds in detail view
- countdown timer updated every second
- total bid price = freight + origin + destination (live computed)

## Theme / Styling

Defined in `style.css`:
- violet/lime palette
- surface/surface2/border theme tokens
- Inter and JetBrains Mono fonts

## Integration

- frontend calls API using relative base:
  - ``${window.location.origin}/api``
- this allows local and deployed usage without changing code.
