export default function FilterBar({ filters, categories, onChange, onClear }) {
  return (
    <div className="filters" aria-label="Filter transactions">
      <label>
        <span>Month</span>
        <input
          type="month"
          value={filters.month}
          onChange={(event) => onChange('month', event.target.value)}
        />
      </label>
      <label>
        <span>Type</span>
        <select value={filters.type} onChange={(event) => onChange('type', event.target.value)}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </label>
      <label>
        <span>Category</span>
        <select value={filters.category} onChange={(event) => onChange('category', event.target.value)}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <button className="text-button clear-filters" type="button" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}
