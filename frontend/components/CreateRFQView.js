window.CreateRFQView = function CreateRFQView(props) {
  const { createForm, setCreateForm, handleCreate } = props;

  return (
    <div className="card">
      <h3>Create RFQ</h3>
      <form onSubmit={handleCreate}>
        <div className="row">
          <div className="col">
            <label>Title</label>
            <input
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              required
            />
          </div>
          <div className="col">
            <label>Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            />
          </div>
        </div>
        <div className="row">
          <div className="col">
            <label>Bid Start</label>
            <input
              type="datetime-local"
              value={createForm.bid_start}
              onChange={(e) => setCreateForm({ ...createForm, bid_start: e.target.value })}
              required
            />
          </div>
          <div className="col">
            <label>Bid Close</label>
            <input
              type="datetime-local"
              value={createForm.bid_close}
              onChange={(e) => setCreateForm({ ...createForm, bid_close: e.target.value })}
              required
            />
          </div>
          <div className="col">
            <label>Forced Close</label>
            <input
              type="datetime-local"
              value={createForm.forced_close}
              onChange={(e) => setCreateForm({ ...createForm, forced_close: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="row">
          <div className="col">
            <label>Trigger Window (mins)</label>
            <input
              type="number"
              min="1"
              value={createForm.trigger_window_mins}
              onChange={(e) => setCreateForm({ ...createForm, trigger_window_mins: e.target.value })}
              required
            />
          </div>
          <div className="col">
            <label>Extension Duration (mins)</label>
            <input
              type="number"
              min="1"
              value={createForm.extension_duration_mins}
              onChange={(e) => setCreateForm({ ...createForm, extension_duration_mins: e.target.value })}
              required
            />
          </div>
          <div className="col">
            <label>Trigger Type</label>
            <select
              value={createForm.trigger_type}
              onChange={(e) => setCreateForm({ ...createForm, trigger_type: e.target.value })}
            >
              <option value="BID_RECEIVED">BID_RECEIVED</option>
              <option value="ANY_RANK_CHANGE">ANY_RANK_CHANGE</option>
              <option value="L1_CHANGE">L1_CHANGE</option>
            </select>
          </div>
        </div>
        <button type="submit">Create</button>
      </form>
    </div>
  );
};
