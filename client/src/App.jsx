import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteTransaction,
  getCategories,
  getSummary,
  getTransactions,
  saveTransaction,
} from './api.js';
import SummaryCards from './components/SummaryCards.jsx';
import TransactionForm from './components/TransactionForm.jsx';
import TransactionList from './components/TransactionList.jsx';

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function currentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const emptyForm = () => ({
  title: '',
  amount: '',
  type: 'expense',
  category: '',
  date: currentDate(),
  note: '',
});

export default function App() {
  const [filters, setFilters] = useState({ month: currentMonth(), type: '', category: '' });
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0 });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const refresh = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const [items, totals, availableCategories] = await Promise.all([
        getTransactions(filters, signal),
        getSummary(filters, signal),
        getCategories(signal),
      ]);
      setTransactions(items);
      setSummary(totals);
      setCategories(availableCategories);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const filterDescription = useMemo(() => {
    if (!filters.month) {
      return 'All dates';
    }
    const [year, month] = filters.month.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
      .format(new Date(year, month - 1, 1));
  }, [filters.month]);

  function changeFilter(field, value) {
    setFilters((previous) => ({ ...previous, [field]: value }));
  }

  function changeForm(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setFormError('');
  }

  function startEditing(transaction) {
    setForm({
      title: transaction.title,
      amount: String(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      note: transaction.note,
    });
    setEditingId(transaction.id);
    setFormError('');
    document.getElementById('transaction-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await saveTransaction({ ...form, amount: Number(form.amount) }, editingId);
      resetForm();
      await refresh();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeTransaction(transaction) {
    if (!window.confirm(`Delete "${transaction.title}"? This cannot be undone.`)) {
      return;
    }

    setError('');
    try {
      await deleteTransaction(transaction.id);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Personal Finance Tracker home">
          <span className="brand-mark" aria-hidden="true">$</span>
          <span>Ledgerly</span>
        </a>
        <span className="privacy-note"><span aria-hidden="true">●</span> Your data stays on this device</span>
      </header>

      <section className="intro">
        <p className="eyebrow">PERSONAL FINANCE</p>
        <h1>Your money, in focus.</h1>
        <p className="intro-copy">A clear picture of what comes in and what goes out.</p>
      </section>

      <SummaryCards summary={summary} filterDescription={filterDescription} />

      <div className="content-grid">
        <TransactionList
          filters={filters}
          categories={categories}
          transactions={transactions}
          loading={loading}
          error={error}
          onFilterChange={changeFilter}
          onClearFilters={() => setFilters({ month: '', type: '', category: '' })}
          onEdit={startEditing}
          onDelete={removeTransaction}
        />
        <TransactionForm
          categories={categories}
          form={form}
          editing={Boolean(editingId)}
          saving={saving}
          error={formError}
          onChange={changeForm}
          onSubmit={submitForm}
          onCancel={resetForm}
        />
      </div>
      <footer className="footer">Private by design · Stored locally in your SQLite database</footer>
    </main>
  );
}
