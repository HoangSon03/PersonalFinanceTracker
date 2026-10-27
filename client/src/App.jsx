import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  createCategory,
  deleteCategory,
  deleteTransaction,
  getCashFlow,
  getCategories,
  getSummary,
  getTransactions,
  renameCategory,
  saveTransaction,
} from './api.js';
import CategoryManager from './components/CategoryManager.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import TransactionForm from './components/TransactionForm.jsx';
import TransactionList from './components/TransactionList.jsx';

const CashFlowCharts = lazy(() => import('./components/CashFlowCharts.jsx'));
const transactionPageSize = 20;

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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: transactionPageSize,
    totalPages: 1,
  });
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cashFlow, setCashFlow] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('day');
  const [cashFlowLoading, setCashFlowLoading] = useState(true);
  const [cashFlowError, setCashFlowError] = useState('');
  const [cashFlowRevision, setCashFlowRevision] = useState(0);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0 });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const refresh = useCallback(async (signal, queryFilters = filters, requestedPage = page) => {
    setLoading(true);
    setError('');
    try {
      // Tải danh sách, tổng kết và category cùng một bộ lọc để dashboard không hiển thị lệch dữ liệu.
      const [transactionPage, totals, availableCategories] = await Promise.all([
        getTransactions({ ...queryFilters, page: requestedPage, pageSize: transactionPageSize }, signal),
        getSummary(queryFilters, signal),
        getCategories(signal),
      ]);
      setTransactions(transactionPage.items);
      setPagination(transactionPage);
      if (transactionPage.page !== requestedPage) {
        setPage(transactionPage.page);
      }
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
  }, [filters, page]);

  useEffect(() => {
    // Hủy lần tải trước khi đổi bộ lọc để response cũ không ghi đè dữ liệu mới.
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (activeTab !== 'charts') {
      return undefined;
    }

    // Biểu đồ dùng bộ lọc loại/category nhưng tự quản lý 30 ngày hoặc 12 tháng, độc lập bộ lọc tháng.
    const controller = new AbortController();
    setCashFlowLoading(true);
    setCashFlowError('');
    getCashFlow({
      period: chartPeriod,
      type: filters.type,
      category: filters.category,
    }, controller.signal)
      .then(setCashFlow)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setCashFlowError(requestError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCashFlowLoading(false);
        }
      });

    return () => controller.abort();
  }, [activeTab, chartPeriod, filters.type, filters.category, cashFlowRevision]);

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
    setPage(1);
  }

  function clearFilters() {
    setFilters({ month: '', type: '', category: '' });
    setPage(1);
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
      setPage(1);
      // Giao dịch vừa lưu có thể làm thay đổi bucket ngày/tháng hiện đang xem.
      setCashFlowRevision((revision) => revision + 1);
      await refresh(undefined, filters, 1);
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
      // Xóa giao dịch cũng cần tính lại dữ liệu tổng hợp của biểu đồ.
      setCashFlowRevision((revision) => revision + 1);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function addCategory(name) {
    setCategoryBusy(true);
    setCategoryError('');
    try {
      await createCategory(name);
      await refresh();
      return true;
    } catch (requestError) {
      setCategoryError(requestError.message);
      return false;
    } finally {
      setCategoryBusy(false);
    }
  }

  async function updateCategory(oldName, name) {
    setCategoryBusy(true);
    setCategoryError('');
    try {
      await renameCategory(oldName, name);
      // Giữ bộ lọc hiện tại trỏ tới tên mới nếu người dùng đang lọc category vừa đổi.
      const nextFilters = {
        ...filters,
        category: filters.category === oldName ? name.trim() : filters.category,
      };
      setFilters(nextFilters);
      setPage(1);
      return true;
    } catch (requestError) {
      setCategoryError(requestError.message);
      return false;
    } finally {
      setCategoryBusy(false);
    }
  }

  async function removeCategory(name) {
    if (!window.confirm(`Delete category "${name}"?`)) {
      return;
    }

    setCategoryBusy(true);
    setCategoryError('');
    try {
      await deleteCategory(name);
      // Xóa bộ lọc category nếu nó vừa bị xóa để danh sách không mắc ở giá trị không còn tồn tại.
      const nextFilters = {
        ...filters,
        category: filters.category === name ? '' : filters.category,
      };
      setFilters(nextFilters);
      setPage(1);
    } catch (requestError) {
      setCategoryError(requestError.message);
    } finally {
      setCategoryBusy(false);
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

      <div className="dashboard-tabs" role="tablist" aria-label="Dashboard sections">
        <button
          id="dashboard-tab-transactions"
          className={activeTab === 'transactions' ? 'selected' : ''}
          type="button"
          role="tab"
          aria-selected={activeTab === 'transactions'}
          aria-controls="dashboard-panel"
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          id="dashboard-tab-charts"
          className={activeTab === 'charts' ? 'selected' : ''}
          type="button"
          role="tab"
          aria-selected={activeTab === 'charts'}
          aria-controls="dashboard-panel"
          onClick={() => setActiveTab('charts')}
        >
          Charts
        </button>
      </div>

      <div id="dashboard-panel" className="dashboard-panel" role="tabpanel" aria-labelledby={`dashboard-tab-${activeTab}`}>
        {activeTab === 'charts' ? (
          <Suspense
            fallback={(
              <section className="panel cash-flow-panel" aria-label="Cash flow chart">
                <div className="chart-state" role="status">Loading chart…</div>
              </section>
            )}
          >
            <CashFlowCharts
              data={cashFlow}
              period={chartPeriod}
              loading={cashFlowLoading}
              error={cashFlowError}
              onPeriodChange={setChartPeriod}
            />
          </Suspense>
        ) : (
          <>
            <CategoryManager
              categories={categories}
              busy={categoryBusy}
              error={categoryError}
              onCreate={addCategory}
              onRename={updateCategory}
              onDelete={removeCategory}
            />

            <div className="content-grid">
              <TransactionList
                filters={filters}
                categories={categories}
                transactions={transactions}
                loading={loading}
                error={error}
                pagination={pagination}
                onFilterChange={changeFilter}
                onClearFilters={clearFilters}
                onPageChange={setPage}
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
          </>
        )}
      </div>
      <footer className="footer">Private by design · Stored locally in your SQLite database</footer>
    </main>
  );
}
