const API = `${window.location.origin}/api`;

function formatMoney(n) {
  if (n === null || n === undefined) return "-";
  return Number(n).toFixed(2);
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

function getCountdown(rfq) {
  const now = Date.now();
  const end = new Date(rfq.status === "FORCE_CLOSED" ? rfq.forced_close : rfq.bid_close).getTime();
  const diff = end - now;
  if (diff <= 0) return "00:00:00";
  const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
  const mins = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
  const secs = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

function App() {
  const [view, setView] = React.useState("list");
  const [rfqs, setRfqs] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedDetail, setSelectedDetail] = React.useState(null);
  const [suppliers, setSuppliers] = React.useState([]);
  const [tick, setTick] = React.useState(0);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");

  const [createForm, setCreateForm] = React.useState({
    title: "",
    description: "",
    bid_start: "",
    bid_close: "",
    forced_close: "",
    trigger_window_mins: 2,
    extension_duration_mins: 2,
    trigger_type: "BID_RECEIVED"
  });

  const [bidForm, setBidForm] = React.useState({
    supplier_id: "",
    freight_charge: "",
    origin_charge: "",
    destination_charge: ""
  });

  const totalLive =
    (Number(bidForm.freight_charge) || 0) +
    (Number(bidForm.origin_charge) || 0) +
    (Number(bidForm.destination_charge) || 0);

  async function fetchRfqs() {
    const res = await fetch(`${API}/rfqs`);
    const data = await res.json();
    setRfqs(data);
  }

  async function fetchSuppliers() {
    const res = await fetch(`${API}/bids/suppliers`);
    const data = await res.json();
    setSuppliers(data);
  }

  async function fetchDetail(rfqId) {
    const res = await fetch(`${API}/rfqs/${rfqId}`);
    const data = await res.json();
    setSelectedDetail(data);
  }

  React.useEffect(() => {
    fetchRfqs();
    fetchSuppliers();
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (view === "list") fetchRfqs();
  }, [tick, view]);

  React.useEffect(() => {
    if (view !== "detail" || !selectedId) return;
    fetchDetail(selectedId);
    const poll = setInterval(() => fetchDetail(selectedId), 8000);
    return () => clearInterval(poll);
  }, [view, selectedId]);

  async function handleCreate(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const res = await fetch(`${API}/rfqs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm)
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Unable to create RFQ");
      return;
    }

    setMsg("RFQ created");
    setCreateForm({
      title: "",
      description: "",
      bid_start: "",
      bid_close: "",
      forced_close: "",
      trigger_window_mins: 2,
      extension_duration_mins: 2,
      trigger_type: "BID_RECEIVED"
    });
    fetchRfqs();
    setView("list");
  }

  async function handleBid(e) {
    e.preventDefault();
    if (!selectedId) return;
    setErr("");
    setMsg("");

    const res = await fetch(`${API}/bids/${selectedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bidForm)
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Bid failed");
      return;
    }

    setMsg(
      data.extensionResult.extended
        ? `Bid submitted and auction extended (${data.extensionResult.reason})`
        : "Bid submitted (no extension)"
    );
    setBidForm({ supplier_id: "", freight_charge: "", origin_charge: "", destination_charge: "" });
    fetchDetail(selectedId);
    fetchRfqs();
  }

  function openDetail(rfqId) {
    setSelectedId(rfqId);
    setView("detail");
  }

  return (
    <div>
      <div className="card">
        <h2>British Auction RFQ Demo</h2>
        <div className="row">
          <button onClick={() => setView("list")}>Auction List</button>
          <button onClick={() => setView("create")}>Create RFQ</button>
        </div>
        {err && <p className="error">{err}</p>}
        {msg && <p className="success">{msg}</p>}
      </div>

      {view === "list" && (
        <AuctionListView
          rfqs={rfqs}
          onOpenDetail={openDetail}
          formatMoney={formatMoney}
          formatDate={formatDate}
          getCountdown={getCountdown}
        />
      )}

      {view === "detail" && selectedDetail && (
        <AuctionDetailView
          selectedDetail={selectedDetail}
          suppliers={suppliers}
          bidForm={bidForm}
          setBidForm={setBidForm}
          totalLive={totalLive}
          handleBid={handleBid}
          onBack={() => setView("list")}
          formatMoney={formatMoney}
          formatDate={formatDate}
          getCountdown={getCountdown}
        />
      )}

      {view === "create" && (
        <CreateRFQView
          createForm={createForm}
          setCreateForm={setCreateForm}
          handleCreate={handleCreate}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
