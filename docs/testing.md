# Testing and local checks

Requirements: Node.js 20 or newer and npm. Dependencies are installed from the workspace root.

```powershell
npm test
npm run build
```

`npm test` runs the Node.js test runner against the backend API. Tests create temporary SQLite databases and cover CRUD, filtering and totals, validation/errors, categories, health, and persistence after reopening. They do not use the personal database under `server/data/`.

For a browser smoke test, run these commands in separate terminals:

```powershell
npm run dev:server
npm run dev:client
```

Open the Vite URL printed in its terminal (normally `http://localhost:5173`). Confirm listing, create/edit/delete, month filtering, totals, and visible error/empty states. The Vite proxy targets `127.0.0.1:3001` by default.

No lint or frontend component-test command is configured. Do not report either as having run; add tooling only when its value justifies a dependency and maintenance cost.
