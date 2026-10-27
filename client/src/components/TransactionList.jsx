import FilterBar from './FilterBar.jsx';
import { formatCurrency } from '../currency.js';

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TransactionList({
  filters,
  categories,
  transactions,
  loading,
  error,
  pagination,
  onFilterChange,
  onClearFilters,
  onPageChange,
  onEdit,
  onDelete,
}) {
  const firstItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const lastItem = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <section className="panel transactions-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">ACTIVITY</p>
          <h2>Transactions</h2>
        </div>
        <span className="transaction-count">{pagination.total} total</span>
      </div>

      <FilterBar
        filters={filters}
        categories={categories}
        onChange={onFilterChange}
        onClear={onClearFilters}
      />

      {error && <div className="alert error-alert" role="alert">{error}</div>}
      {loading ? (
        <div className="empty-state">Loading transactions…</div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">↗</span>
          <strong>No transactions found</strong>
          <span>Try changing your filters or add your first transaction.</span>
        </div>
      ) : (
        <div className="transaction-list">
          {transactions.map((transaction) => (
            <article className="transaction-row" key={transaction.id}>
              <div className={`transaction-icon ${transaction.type}`} aria-hidden="true">
                {transaction.type === 'income' ? '↓' : '↑'}
              </div>
              <div className="transaction-description">
                <strong>{transaction.title}</strong>
                <span>{transaction.category} · {formatDate(transaction.date)}</span>
                {transaction.note && <small>{transaction.note}</small>}
              </div>
              <strong className={`transaction-amount ${transaction.type}`}>
                {transaction.type === 'income' ? '+' : '−'}{formatCurrency(transaction.amount)}
              </strong>
              <div className="row-actions">
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => onEdit(transaction)}
                  aria-label={`Edit ${transaction.title}`}
                >
                  Edit
                </button>
                <button
                  className="icon-button delete-button"
                  type="button"
                  onClick={() => onDelete(transaction)}
                  aria-label={`Delete ${transaction.title}`}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <nav className="pagination" aria-label="Transaction pages">
        <span className="pagination-summary">
          Showing {firstItem}–{lastItem} of {pagination.total}
        </span>
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-button"
            disabled={pagination.page <= 1 || loading}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Previous
          </button>
          <span className="pagination-page">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className="pagination-button"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </nav>
    </section>
  );
}
