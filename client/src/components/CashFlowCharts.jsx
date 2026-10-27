import { useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../currency.js';

const chartTypes = [
  { id: 'line', label: 'Line' },
  { id: 'grouped', label: 'Grouped bars' },
  { id: 'stacked', label: 'Stacked bars' },
];

const seriesLabels = {
  income: 'Income',
  expenses: 'Expenses',
  balance: 'Net balance',
};

function formatPeriod(value, period) {
  const date = new Date(`${value}${period === 'day' ? 'T12:00:00' : '-01T12:00:00'}`);
  return date.toLocaleDateString('en-US', period === 'day'
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', year: 'numeric' });
}

function formatAxisAmount(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function ChartTooltip({ active, payload, label, period }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <strong>{formatPeriod(label, period)}</strong>
      {payload.map((item) => (
        <div className="chart-tooltip-row" key={item.dataKey}>
          <span style={{ color: item.color }}>{seriesLabels[item.dataKey]}</span>
          <span>{formatCurrency(Number(item.value))}</span>
        </div>
      ))}
    </div>
  );
}

function renderLineChart(data, period) {
  return (
    <LineChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: 8 }}>
      <CartesianGrid stroke="#edf0f5" strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey="period"
        tickFormatter={(value) => formatPeriod(value, period)}
        tick={{ fill: '#788596', fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        interval={period === 'day' ? 4 : 0}
      />
      <YAxis
        tickFormatter={formatAxisAmount}
        tick={{ fill: '#788596', fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        width={64}
      />
      <Tooltip content={<ChartTooltip period={period} />} />
      <Legend />
      <Line dataKey="income" name={seriesLabels.income} stroke="#47a783" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
      <Line dataKey="expenses" name={seriesLabels.expenses} stroke="#d77872" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
      <Line dataKey="balance" name={seriesLabels.balance} stroke="#7180cf" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
    </LineChart>
  );
}

function renderBarChart(data, period, stacked) {
  return (
    <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: 8 }}>
      <CartesianGrid stroke="#edf0f5" strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey="period"
        tickFormatter={(value) => formatPeriod(value, period)}
        tick={{ fill: '#788596', fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        interval={period === 'day' ? 4 : 0}
      />
      <YAxis
        tickFormatter={formatAxisAmount}
        tick={{ fill: '#788596', fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        width={64}
      />
      <Tooltip content={<ChartTooltip period={period} />} />
      <Legend />
      <Bar dataKey="income" name={seriesLabels.income} fill="#55ad8a" radius={[3, 3, 0, 0]} stackId={stacked ? 'cash-flow' : undefined} />
      <Bar dataKey="expenses" name={seriesLabels.expenses} fill="#db7975" radius={[3, 3, 0, 0]} stackId={stacked ? 'cash-flow' : undefined} />
      <Line dataKey="balance" name={seriesLabels.balance} stroke="#7180cf" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
    </ComposedChart>
  );
}

export default function CashFlowCharts({ data, period, loading, error, onPeriodChange }) {
  const [chartType, setChartType] = useState('line');
  const hasTransactions = data.some((item) => item.income !== 0 || item.expenses !== 0);

  return (
    <section className="panel cash-flow-panel" aria-labelledby="cash-flow-heading">
      <div className="cash-flow-heading">
        <div>
          <p className="eyebrow">CASH FLOW</p>
          <h2 id="cash-flow-heading">Income and expenses</h2>
          <p className="cash-flow-description">
            {period === 'day' ? 'Last 30 days' : 'Last 12 months'} · includes net balance
          </p>
        </div>
        <div className="chart-period-toggle" role="group" aria-label="Chart time period">
          <button
            type="button"
            className={period === 'day' ? 'selected' : ''}
            aria-pressed={period === 'day'}
            onClick={() => onPeriodChange('day')}
          >
            Day
          </button>
          <button
            type="button"
            className={period === 'month' ? 'selected' : ''}
            aria-pressed={period === 'month'}
            onClick={() => onPeriodChange('month')}
          >
            Month
          </button>
        </div>
      </div>

      <div className="chart-type-tabs" role="tablist" aria-label="Chart type">
        {chartTypes.map((type) => (
          <button
            key={type.id}
            id={`chart-tab-${type.id}`}
            type="button"
            role="tab"
            aria-selected={chartType === type.id}
            aria-controls="cash-flow-chart"
            className={chartType === type.id ? 'selected' : ''}
            onClick={() => setChartType(type.id)}
          >
            {type.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="alert error-alert" role="alert">{error}</div>
      ) : loading ? (
        <div className="chart-state" role="status">Loading chart…</div>
      ) : !hasTransactions ? (
        <div className="chart-state">No transactions in this period.</div>
      ) : (
        <div
          id="cash-flow-chart"
          className="cash-flow-chart"
          role="tabpanel"
          aria-labelledby={`chart-tab-${chartType}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line'
              ? renderLineChart(data, period)
              : renderBarChart(data, period, chartType === 'stacked')}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
