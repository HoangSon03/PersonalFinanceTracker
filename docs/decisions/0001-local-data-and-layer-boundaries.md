# ADR 0001: Keep local SQLite and explicit feature boundaries

- Status: accepted
- Scope: personal finance tracker refactor

## Decision

Keep SQLite and the existing `transactions` schema as the local source of truth. Put transaction SQL in one feature repository, use a small service for use-case/not-found behavior, and keep HTTP contract handling in Express routes. Bind the unauthenticated API to `127.0.0.1` by default.

## Rationale

This separates SQL from HTTP without introducing an ORM, generic repository framework, or migration tool. Loopback binding keeps the existing browser-local workflow while avoiding unintended LAN exposure of financial data.

## Consequences

API paths and JSON shapes remain unchanged. No database migration is required. LAN clients cannot use the API unless network access is explicitly reconsidered.
