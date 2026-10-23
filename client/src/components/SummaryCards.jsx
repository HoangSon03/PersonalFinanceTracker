import { formatCurrency } from '../currency.js';

export default function SummaryCards({ summary, filterDescription }) {
  return (
    <section className="summary-grid" aria-label={`Financial summary for ${filterDescription}`}>
      <article className="summary-card income-card">
        <span className="summary-label">Total income</span>
        <strong>{formatCurrency(summary.income)}</strong>
        <span className="summary-foot">For {filterDescription}</span>
      </article>
      <article className="summary-card expense-card">
        <span className="summary-label">Total expenses</span>
        <strong>{formatCurrency(summary.expenses)}</strong>
        <span className="summary-foot">For {filterDescription}</span>
      </article>
      <article className="summary-card balance-card">
        <span className="summary-label">Net balance</span>
        <strong>{formatCurrency(summary.balance)}</strong>
        <span className="summary-foot">Income minus expenses</span>
      </article>
    </section>
  );
}
