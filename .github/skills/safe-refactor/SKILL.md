---
name: safe-refactor
description: "Use when restructuring or simplifying existing PersonalFinanceTracker code while preserving behavior, API contracts, and SQLite data compatibility."
---

# Safe refactor

Refactor incrementally, keeping the application runnable and its observable behavior stable.

## Workflow

1. Read `AGENTS.md` and the task-relevant references:
   - [Architecture](../../../docs/architecture.md) for dependency rules and module responsibilities.
   - [API contract](../../../docs/api-contract.md) if routes or client behavior are involved.
   - [Coding conventions](../../../docs/coding-conventions.md) for existing implementation patterns.
   - [Testing](../../../docs/testing.md) for regression checks.
2. Inspect the existing implementation and tests; identify the behavior and contracts that must remain unchanged.
3. Make one cohesive, small refactoring step at a time. Avoid unrelated edits, new dependencies, and abstractions without a demonstrated need.
4. Preserve HTTP request/response behavior, SQLite schema and data, and local-only database handling.
5. Add or adjust regression tests where needed, then run relevant tests and the frontend build when applicable.
6. Review the final diff for unintended changes, update relevant documentation, and report checks and any unresolved risks accurately.
