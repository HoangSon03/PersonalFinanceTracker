---
name: add-feature
description: "Use when implementing a feature or user-visible behavior in PersonalFinanceTracker, including frontend, API, or SQLite changes."
---

# Add a feature

Implement a feature within the existing application architecture without duplicating repository-wide instructions.

## Workflow

1. Read `AGENTS.md` and the task-relevant references:
   - [Architecture](../../../docs/architecture.md) for module boundaries and data flow.
   - [API contract](../../../docs/api-contract.md) when changing endpoints or API clients.
   - [Coding conventions](../../../docs/coding-conventions.md) for JavaScript and React patterns.
   - [Testing](../../../docs/testing.md) for available checks.
2. Trace the current behavior through the relevant UI, API, service, and repository code before editing.
3. Keep changes within existing boundaries. Preserve the API contract, SQLite schema, and local-data behavior unless the task explicitly approves a change.
4. Validate external input at the existing boundary, keep SQL in repositories, and keep frontend requests in the API client.
5. Add or update focused tests for changed behavior. Run the relevant tests and build, and report the exact commands and results.
6. Update directly related documentation when behavior or contracts change. Report remaining limitations; do not claim unrun checks passed.
