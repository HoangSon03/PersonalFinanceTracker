# Coding conventions

- Use JavaScript ES modules and the existing npm workspaces; do not introduce TypeScript or dependencies without a demonstrated need.
- Keep backend boundaries explicit: routes handle HTTP, services handle use cases, repositories handle SQL, and `validation.js` validates untrusted request input.
- Use parameterized SQL. Preserve `amount_cents` integer storage and convert to numeric `amount` only at the API boundary.
- Return existing JSON error shapes and HTTP statuses. Do not swallow unexpected server errors or silently substitute successful defaults.
- Keep React state and API orchestration in `App.jsx`; keep extracted UI components prop-driven and focused.
- Share repeated request serialization and display formatting rather than maintaining divergent copies.
- Keep transaction dates as `YYYY-MM-DD` calendar dates and month filters as `YYYY-MM`.
- Preserve accessible labels, loading/empty/error feedback, and responsive styles when changing the UI.
- Keep financial data local; never include database contents or secrets in logs, examples, tests, or agent context.
