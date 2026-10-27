# Architecture

## Runtime

The app is a local-first JavaScript application. `client/` is React/Vite; `server/` is Node.js ES modules with Express and `better-sqlite3`. The browser calls relative `/api` URLs through Vite's development proxy. The backend listens on `127.0.0.1` by default.

## Backend responsibilities

```text
server/src/
  index.js                 process startup, environment, listener, shutdown
  app.js                   Express configuration, health route, error boundary
  errors.js                HTTP-safe application error type
  validation.js            request input and query validation
  db.js                    SQLite connection and existing schema initialization
  transactions/
    routes.js              HTTP request/response contract
    service.js             transaction use cases and not-found behavior
    repository.js          prepared SQL, filters, aggregation, persistence, row mapping
```

Dependency direction:

```text
index -> app -> routes -> service -> repository -> SQLite
                    routes -> validation
                    app -> errors
                    service -> errors
                    app -> db (composition)
```

Routes validate external input, invoke use cases, and translate results into HTTP responses. Services implement use-case behavior without Express or SQL. The repository owns SQL and maps integer cents to the API's numeric `amount`. `app.js` composes the layers using the existing `createApp(database)` test seam.

SQLite remains the source of truth. Keep the existing `transactions` table, `amount_cents` representation, database path, and WAL behavior intact. The `categories` table is initialized alongside `transactions`; startup imports distinct existing transaction category names to preserve data. Category renames update transactions atomically, and deletion is rejected while transactions reference the category. There is no separate migration framework.

Do not add a generic repository framework, dependency-injection container, ORM, or migration system for the current single-table feature. The transaction repository is a concrete SQL boundary, not a reusable abstraction layer.

## Frontend responsibilities

```text
client/src/
  App.jsx                       page state and feature orchestration
  api.js                        JSON REST client and filter query serialization
  currency.js                   shared USD formatting
  components/
    FilterBar.jsx               filter controls
    SummaryCards.jsx            income, expense, and balance display
    TransactionList.jsx         list, loading/error/empty states, row actions
    TransactionForm.jsx         create/edit form presentation
```

`App.jsx` owns state and callbacks. Child components receive props and emit user actions; API calls stay in `api.js`. The UI does not access SQLite directly. `CategoryManager.jsx` presents category CRUD, while transaction category choices come from the shared category list.
`CashFlowCharts.jsx` renders the daily/monthly cash-flow analytics using server-aggregated local transaction data. Chart type and date-range presentation stay in the client; aggregation queries stay in the transaction repository.

## Local data and network boundary

The financial database stays on the local machine. The API binds to loopback by default and has no authentication; do not change it to a network-facing bind without an explicit security decision. See [ADR 0001](decisions/0001-local-data-and-layer-boundaries.md).
