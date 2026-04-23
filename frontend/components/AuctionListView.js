window.AuctionListView = function AuctionListView(props) {
  const { rfqs, onOpenDetail, formatMoney, formatDate, getCountdown } = props;

  return (
    <div className="card">
      <h3>Auction List</h3>
      <table>
        <thead>
          <tr>
            <th>RFQ</th>
            <th>Status</th>
            <th>L1 Price</th>
            <th>Bid Close</th>
            <th>Forced Close</th>
            <th>Countdown</th>
            <th>Extensions</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rfqs.map((rfq) => (
            <tr key={rfq.id}>
              <td>{rfq.title}</td>
              <td>
                <span className={`badge ${rfq.status}`}>{rfq.status}</span>
              </td>
              <td>{formatMoney(rfq.l1_price)}</td>
              <td>{formatDate(rfq.bid_close)}</td>
              <td>{formatDate(rfq.forced_close)}</td>
              <td>{getCountdown(rfq)}</td>
              <td>{rfq.extension_count}</td>
              <td>
                <button onClick={() => onOpenDetail(rfq.id)}>Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
