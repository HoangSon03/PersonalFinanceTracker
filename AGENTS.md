# Repository guidance

- This is an npm-workspace app: React/Vite is in `client/`; Express/SQLite is in `server/`.
- Keep financial data local. Never inspect, print, commit, or upload `server/data/*.sqlite*`.
- Preserve the existing SQLite schema and `/api` contract unless the task explicitly approves a change.
- Follow the layer boundaries in [docs/architecture.md](docs/architecture.md).
- Read [docs/api-contract.md](docs/api-contract.md) when changing routes or API clients.
- Read [docs/testing.md](docs/testing.md) for relevant test/build commands.
- Read [docs/coding-conventions.md](docs/coding-conventions.md) when changing application code.
- Make focused changes and run the relevant checks; report commands that could not run.
