export default function TransactionForm({
  categories,
  form,
  editing,
  saving,
  error,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <section className="panel form-panel" id="transaction-form">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{editing ? 'UPDATE ENTRY' : 'NEW ENTRY'}</p>
          <h2>{editing ? 'Edit transaction' : 'Add transaction'}</h2>
        </div>
        {editing && <button className="text-button" type="button" onClick={onCancel}>Cancel</button>}
      </div>

      <form onSubmit={onSubmit}>
        <label className="field">
          <span>Title</span>
          <input
            required
            maxLength="120"
            value={form.title}
            onChange={(event) => onChange('title', event.target.value)}
            placeholder="e.g. Monthly salary"
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Amount (USD)</span>
            <input
              required
              type="number"
              min="0.01"
              max="90071992547409.9"
              step="0.01"
              value={form.amount}
              onChange={(event) => onChange('amount', event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="field">
            <span>Type</span>
            <select value={form.type} onChange={(event) => onChange('type', event.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Category</span>
            <input
              required
              maxLength="60"
              list="category-options"
              value={form.category}
              onChange={(event) => onChange('category', event.target.value)}
              placeholder="e.g. Food"
            />
            <datalist id="category-options">
              {categories.map((category) => <option key={category} value={category} />)}
            </datalist>
          </label>
          <label className="field">
            <span>Date</span>
            <input
              required
              type="date"
              value={form.date}
              onChange={(event) => onChange('date', event.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span>Note <em>Optional</em></span>
          <textarea
            maxLength="1000"
            rows="3"
            value={form.note}
            onChange={(event) => onChange('note', event.target.value)}
            placeholder="Add a little more detail…"
          />
        </label>
        {error && <div className="alert error-alert" role="alert">{error}</div>}
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add transaction'}
        </button>
      </form>
    </section>
  );
}
