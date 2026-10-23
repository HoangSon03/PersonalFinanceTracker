# Project structure

This document describes the current workspace, based on the source files and package manifests. Generated dependencies and build output (`node_modules/`, `dist/`, `.git`, `build/`, and `coverage/`) are excluded from the tree. Environment files are not read or documented here.

## Directory tree

```text
PersonalFinanceTracker/
├── .github/
│   ├── copilot-instructions.md     # Copilot guidance; points agents to task-specific docs
│   ├── hooks/
│   │   ├── agent-stop.json         # Non-blocking Copilot agentStop diagnostic hook
│   │   └── log-agent-stop.ps1      # Logs only the event name outside the workspace
│   └── skills/
│       ├── add-feature/
│       │   └── SKILL.md            # On-demand workflow for architecture-aligned feature work
│       └── safe-refactor/
│           └── SKILL.md            # On-demand workflow for behavior-preserving refactoring
├── client/                         # React/Vite frontend workspace
│   ├── .env.example                # Example frontend API proxy configuration
│   ├── index.html                  # Vite HTML entry document
│   ├── package.json                # Frontend dependencies and dev/build scripts
│   ├── vite.config.js              # React plugin and /api development proxy
│   └── src/
│       ├── App.jsx                 # Dashboard state, data loading, and feature orchestration
│       ├── api.js                  # JSON REST client and filter query serialization
│       ├── currency.js             # Shared USD display formatter
│       ├── main.jsx                # React DOM entry point
│       ├── styles.css              # Global and responsive dashboard styling
│       └── components/
│           ├── FilterBar.jsx       # Month, type, and category filter controls
│           ├── SummaryCards.jsx    # Income, expenses, and balance display
│           ├── TransactionForm.jsx # Create/edit transaction form
│           └── TransactionList.jsx # Transaction rows and loading/error/empty states
├── docs/                           # Developer and architecture documentation
│   ├── api-contract.md             # Existing REST endpoint and payload contract
│   ├── architecture.md             # Layer boundaries and dependency direction
│   ├── coding-conventions.md        # Project coding practices
│   ├── testing.md                  # Available checks and test strategy
│   ├── project-structure.md        # This workspace guide
│   └── decisions/
│       └── 0001-local-data-and-layer-boundaries.md
├── server/                         # Node.js/Express backend workspace
│   ├── .env.example                # Example backend configuration
│   ├── package.json                # Backend dependencies and dev/start/test scripts
│   ├── data/
│   │   └── finance.sqlite          # Default local database file (present when inspected)
│   ├── src/
│   │   ├── app.js                  # Express app/middleware composition and error boundary
│   │   ├── db.js                   # SQLite connection and table initialization
│   │   ├── errors.js               # HTTP-aware ApiError type
│   │   ├── index.js                # Backend process entry point and listener
│   │   ├── validation.js           # Request body, query, and ID validation
│   │   └── transactions/
│   │       ├── repository.js       # Prepared SQL, filtering, totals, row mapping
│   │       ├── routes.js           # Transaction HTTP routes and status responses
│   │       └── service.js          # Use-case orchestration and not-found behavior
│   └── test/
│       └── api.test.js             # HTTP/API integration tests using temporary databases
├── .gitignore                      # Ignores dependencies, build output, env files, and DB files
├── AGENTS.md                       # Repository-wide instructions for coding agents
├── package-lock.json               # npm workspace dependency lockfile
├── package.json                    # npm workspace definitions and root scripts
└── README.md                       # Setup, local run, features, and documentation links
```

SQLite may also create `finance.sqlite-wal` and `finance.sqlite-shm` beside the database while it is open. They are runtime sidecars, not source files.

## Technology and responsibilities

| Technology | Location | Responsibility |
| --- | --- | --- |
| JavaScript ES modules | `client/`, `server/` | Application language/module format |
| React 19 | `client/` | Dashboard UI and component state |
| Vite 6 and React plugin | `client/` | Development server, `/api` proxy, and production frontend build |
| Node.js 20+ | `server/` | Backend runtime and built-in test runner |
| Express 5 | `server/` | HTTP app, middleware, routing, and JSON responses |
| better-sqlite3 | `server/` | Synchronous SQLite connection and prepared statements |
| SQLite | `server/data/finance.sqlite` by default | Local persistent transaction storage |
| dotenv | `server/src/index.js` | Loads backend environment configuration at process startup |

The root `package.json` declares npm workspaces for `client` and `server`. The root scripts run the frontend dev server, backend dev server, frontend build, and backend tests. The workspace manifests define the actual dependencies and scripts for each side.

## Entry points and startup

### Frontend

1. Vite serves [`client/index.html`](../client/index.html).
2. Its module script loads [`client/src/main.jsx`](../client/src/main.jsx).
3. `main.jsx` mounts React's `App` component and imports global CSS.
4. [`client/src/App.jsx`](../client/src/App.jsx) loads transactions, totals, and categories through `client/src/api.js`.
5. UI component files render filters, summaries, transaction rows, and the transaction form.

The development command is `npm run dev:client` from the workspace root. The default Vite URL is normally `http://localhost:5173`.

### Backend

1. `npm run dev:server` runs `node --watch src/index.js` in the server workspace; `npm start --workspace server` runs the non-watch entry point.
2. [`server/src/index.js`](../server/src/index.js) loads dotenv configuration, validates the port, opens the database, and calls `createApp(database)`.
3. The process listens on `127.0.0.1` at `PORT`, defaulting to `3001`.
4. Shutdown handlers close the HTTP server and database connection.

## Frontend-to-backend request flow

The frontend API functions in [`client/src/api.js`](../client/src/api.js) call relative paths such as `/api/transactions`, `/api/summary`, and `/api/categories`. The shared request helper sends JSON where needed and turns non-success responses into errors. In Vite development, [`client/vite.config.js`](../client/vite.config.js) proxies `/api` to `API_PROXY_TARGET`, defaulting to `http://127.0.0.1:3001`. The frontend does not connect directly to SQLite.

## Backend request flow and module dependencies

The backend uses small factory functions to compose concrete collaborators:

```text
index.js
  ├── createDatabase()                         db.js
  └── createApp(database)                      app.js
       ├── health endpoint
       ├── error middleware                    errors.js
       └── /api router                         transactions/routes.js
            ├── validate input                 validation.js
            └── transaction service            transactions/service.js
                 └── transaction repository    transactions/repository.js
                      └── better-sqlite3
```

`routes.js` owns HTTP methods, paths, response status codes, and calls to validation. `service.js` owns the current transaction use cases and converts missing update/delete results to `ApiError`. `repository.js` prepares and executes SQL, composes optional filters, calculates summary values, and maps database rows to API transaction objects. `app.js` adds JSON parsing, the health endpoint, not-found handling, and the JSON error boundary.

The database uses a `transactions` table with an integer primary key, title, `amount_cents`, type, category, date, and note. `amount_cents` is stored as an integer; the repository converts it to the public numeric `amount` field.

## SQLite initialization and file path

[`server/src/db.js`](../server/src/db.js) resolves the default path relative to its own module as `server/data/finance.sqlite`. `createDatabase()` can instead use the `DATABASE_PATH` environment variable. It creates the parent directory when needed, opens SQLite, enables WAL mode, and runs `CREATE TABLE IF NOT EXISTS` for `transactions`.

The default database file was present during inspection. The actual path used at runtime cannot be established from source alone if `DATABASE_PATH` is set; this document does not inspect private environment files or database records.

## API, business logic, validation, errors, and tests

- **HTTP endpoints:** [`server/src/app.js`](../server/src/app.js) defines `GET /api/health`; [`server/src/transactions/routes.js`](../server/src/transactions/routes.js) defines:
  - `GET /api/categories`
  - `GET /api/transactions`
  - `GET /api/summary`
  - `POST /api/transactions`
  - `PUT /api/transactions/:id`
  - `DELETE /api/transactions/:id`
- **Business/use-case behavior:** [`server/src/transactions/service.js`](../server/src/transactions/service.js).
- **SQL and aggregate calculations:** [`server/src/transactions/repository.js`](../server/src/transactions/repository.js).
- **Request validation:** [`server/src/validation.js`](../server/src/validation.js), including transaction fields, filters, dates, and IDs.
- **Error handling:** [`server/src/errors.js`](../server/src/errors.js) defines `ApiError`; the final error middleware in `server/src/app.js` returns JSON errors for application, malformed-JSON, oversized-body, and unexpected errors.
- **Automated backend tests:** [`server/test/api.test.js`](../server/test/api.test.js) starts the app against temporary SQLite databases and exercises CRUD, filters/totals, validation and errors, health/categories, and persistence.
- **Frontend checks:** `npm run build` builds the frontend. No frontend component-test or lint script is declared in the inspected package manifests.

See [api-contract.md](api-contract.md) for request/response details and [testing.md](testing.md) for commands.

## Existing architectural patterns

- **Feature-oriented layers:** transaction routes → service → repository → SQLite; validation is a route-boundary helper.
- **Dependency injection through factories:** `createApp(database)` receives a database; router, service, and repository factories receive their collaborators. This keeps API tests isolated from the production database.
- **Repository boundary:** the transaction repository centralizes SQL and row mapping; it is a concrete module, not a generic repository framework.
- **Prop-driven UI composition:** `App.jsx` coordinates state and callbacks; focused child components receive data and event handlers.
- **Workspace separation:** client and server have separate package manifests and responsibilities, with shared root npm commands.

## Areas to investigate when relevant

- The database uses `CREATE TABLE IF NOT EXISTS` rather than versioned migrations. This is simple for the current schema; schema evolution will need an explicit, data-safe migration strategy.
- `better-sqlite3` is synchronous. Repository/service calls currently fit a small local app; measure before considering a different database interface.
- The current integration tests cover key paths but are not exhaustive for every field limit, query-string edge case, or startup failure.
- There is no configured lint script or frontend component-test framework in the package manifests.
- `App.jsx` still coordinates several related dashboard states and async flows. Further decomposition should be driven by new complexity rather than adding a state-management layer preemptively.
- Binding the API to loopback is suitable for the local dashboard but intentionally prevents LAN clients from using it.
