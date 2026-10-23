# Personal Finance Tracker

A local personal finance dashboard built with React, Vite, Express, and SQLite. Transaction data stays in the SQLite database on your machine; the API listens on loopback and the app does not use external financial-data services.

## Requirements

- Node.js 20 or newer
- npm

## Install

From the project root:

```powershell
npm install
```

## Configure

Copy `server/.env.example` to `server/.env` if you want to customize the backend:

- `PORT` — API port (defaults to `3001`)
- `DATABASE_PATH` — SQLite file path (defaults to `server/data/finance.sqlite`)

If the backend uses a different port, copy `client/.env.example` to `client/.env` and set `API_PROXY_TARGET` to the backend URL (for example, `http://127.0.0.1:3100`).

The local `.env` and SQLite database are ignored by Git. Keep the database file on a device you trust and back it up as needed.

## Run locally

Open two terminals in the project root:

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

Open the Vite URL printed by the frontend (normally `http://localhost:5173`). The Vite development server proxies `/api` requests to the backend.

## Features

- Create, edit, delete, and list income and expense transactions
- Filter by month, type, and category
- View income, expenses, and net balance for the active filters
- Responsive dashboard with USD-formatted totals
- Backend validation and JSON API error responses

Amounts are entered as positive values; transaction type determines whether they count as income or expense. Categories are free-form.

## Checks

```powershell
npm test
npm run build
```

The API is available under `/api`. `GET /api/health` can be used to confirm that the backend is running.

## Developer docs

- [Architecture and dependency boundaries](docs/architecture.md)
- [Coding conventions](docs/coding-conventions.md)
- [API contract](docs/api-contract.md)
- [Testing and checks](docs/testing.md)
- [Architecture decision record](docs/decisions/0001-local-data-and-layer-boundaries.md)
