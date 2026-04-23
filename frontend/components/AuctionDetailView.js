window.AuctionDetailView = function AuctionDetailView(props) {
  const {
    selectedDetail,
    suppliers,
    bidForm,
    setBidForm,
    totalLive,
    handleBid,
    onBack,
    formatMoney,
    formatDate,
    getCountdown
  } = props;

  return (
    <div>
      <div className="card">
        <h3>{selectedDetail.rfq.title}</h3>
        <p>{selectedDetail.rfq.description || "No description"}</p>
        <p>
          <strong>Status:</strong>{" "}
          <span className={`badge ${selectedDetail.rfq.status}`}>{selectedDetail.rfq.status}</span>
        </p>
        <p>
          <strong>Bid Close:</strong> {formatDate(selectedDetail.rfq.bid_close)}
        </p>
        <p>
          <strong>Forced Close:</strong> {formatDate(selectedDetail.rfq.forced_close)}
        </p>
        <p>
          <strong>Countdown:</strong> {getCountdown(selectedDetail.rfq)}
        </p>
        <button onClick={onBack}>Back</button>
      </div>

      <div className="card">
        <h3>Auction Config</h3>
        <p>
          <strong>Trigger Window:</strong> {selectedDetail.config?.trigger_window_mins} minutes
        </p>
        <p>
          <strong>Extension Duration:</strong> {selectedDetail.config?.extension_duration_mins} minutes
        </p>
        <p>
          <strong>Trigger Type:</strong> {selectedDetail.config?.trigger_type}
        </p>
      </div>

      <div className="card">
        <h3>Live Rankings</h3>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Supplier</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {selectedDetail.rankings.length === 0 && (
              <tr>
                <td colSpan="3">No bids yet</td>
              </tr>
            )}
            {selectedDetail.rankings.map((r) => (
              <tr key={r.rank}>
                <td>{r.rankLabel}</td>
                <td>{r.supplier_name}</td>
                <td>{formatMoney(r.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Submit Bid</h3>
        <form onSubmit={handleBid}>
          <div className="row">
            <div className="col">
              <label>Supplier</label>
              <select
                value={bidForm.supplier_id}
                onChange={(e) => setBidForm({ ...bidForm, supplier_id: e.target.value })}
                required
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="col">
              <label>Freight Charge</label>
              <input
                type="number"
                step="0.01"
                value={bidForm.freight_charge}
                onChange={(e) => setBidForm({ ...bidForm, freight_charge: e.target.value })}
                required
              />
            </div>
            <div className="col">
              <label>Origin Charge</label>
              <input
                type="number"
                step="0.01"
                value={bidForm.origin_charge}
                onChange={(e) => setBidForm({ ...bidForm, origin_charge: e.target.value })}
                required
              />
            </div>
            <div className="col">
              <label>Destination Charge</label>
              <input
                type="number"
                step="0.01"
                value={bidForm.destination_charge}
                onChange={(e) => setBidForm({ ...bidForm, destination_charge: e.target.value })}
                required
              />
            </div>
          </div>
          <p>
            <strong>Total:</strong> {formatMoney(totalLive)}
          </p>
          <button type="submit">Submit Bid</button>
        </form>
      </div>

      <div className="card">
        <h3>All Supplier Bids (Sorted by Price)</h3>
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Freight</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Total</th>
              <th>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {selectedDetail.bids.length === 0 && (
              <tr>
                <td colSpan="6">No bids yet</td>
              </tr>
            )}
            {selectedDetail.bids.map((b) => (
              <tr key={b.id}>
                <td>{b.supplier_name}</td>
                <td>{formatMoney(b.freight_charge)}</td>
                <td>{formatMoney(b.origin_charge)}</td>
                <td>{formatMoney(b.destination_charge)}</td>
                <td>{formatMoney(b.total_price)}</td>
                <td>{formatDate(b.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Activity Log (Extensions)</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Supplier</th>
              <th>Reason</th>
              <th>Old Bid Close</th>
              <th>New Bid Close</th>
            </tr>
          </thead>
          <tbody>
            {selectedDetail.extensions.length === 0 && (
              <tr>
                <td colSpan="5">No extensions yet</td>
              </tr>
            )}
            {selectedDetail.extensions.map((e) => (
              <tr key={e.id}>
                <td>{formatDate(e.created_at)}</td>
                <td>{e.supplier_name || "-"}</td>
                <td>{e.reason}</td>
                <td>{formatDate(e.old_bid_close)}</td>
                <td>{formatDate(e.new_bid_close)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Bid Activity Log</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Supplier</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {selectedDetail.bids.length === 0 && (
              <tr>
                <td colSpan="3">No bid activity yet</td>
              </tr>
            )}
            {selectedDetail.bids.map((b) => (
              <tr key={`activity-${b.id}`}>
                <td>{formatDate(b.created_at)}</td>
                <td>{b.supplier_name}</td>
                <td>{formatMoney(b.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
