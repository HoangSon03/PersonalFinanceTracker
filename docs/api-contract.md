# API contract

The API is served under `/api`; the local backend defaults to `http://127.0.0.1:3001`. JSON errors use `{ "error": "message" }`.

## Transaction shape

```json
{
  "id": 12,
  "title": "Monthly salary",
  "amount": 2500,
  "type": "income",
  "category": "Work",
  "date": "2026-10-05",
  "note": ""
}
```

Amounts are positive USD values with up to two decimal places. The API stores cents as integers. 
`type` is `income` or `expense`;
`note` is optional on writes and returned as a string. 
Dates are valid `YYYY-MM-DD` calendar dates.

## Endpoints

| Method and path | Request | Success |
| --- | --- | --- |
| `GET /api/health` | — | `200 { "status": "ok" }` |
| `GET /api/categories` | — | `200` JSON array of category-name strings |
| `POST /api/categories` | `{ "name": "Food" }` | `201 { "name": "Food" }` |
| `PUT /api/categories/:name` | `{ "name": "Dining" }` | `200 { "name": "Dining" }` |
| `DELETE /api/categories/:name` | — | `204` empty response |
| `GET /api/transactions` | Optional `month=YYYY-MM`, `type=income\|expense`, `category=string` query filters | `200` array of transaction objects, sorted by date descending then ID descending |
| `GET /api/summary` | Same optional filters as transaction listing | `200 { "income": number, "expenses": number, "balance": number }` for the matching rows |
| `GET /api/analytics/cash-flow` | Required `period=day\|month`; optional `type=income\|expense`, `category=string` | `200` array of `{ "period": "YYYY-MM-DD"\|"YYYY-MM", "income": number, "expenses": number, "balance": number }` buckets |
| `POST /api/transactions` | JSON transaction without `id`; `note` may be omitted | `201` created transaction |
| `PUT /api/transactions/:id` | Full JSON transaction without `id` | `200` updated transaction |
| `DELETE /api/transactions/:id` | Positive integer ID | `204` empty response |

Create and update require non-empty `title` (max 120 characters), positive `amount`, valid `type`, non-empty `category` (max 60 characters), and a valid calendar date. `note` is limited to 1000 characters.
Category create and rename require a non-empty `name` (max 60 characters). Duplicate category names return `409`; renaming or deleting a missing category returns `404`. Renaming a category also updates its existing transactions. Deleting a category referenced by any transaction returns `409`.
Invalid fields, filters, or IDs return `400`; missing transaction IDs return `404`; malformed JSON returns `400`; request bodies over 16 KB return `413`. Unknown routes return `404`. Summary filters have the same semantics as list filters.
Cash-flow analytics includes every day in the trailing 30 calendar days or every month in the trailing 12 months, filling periods without transactions with zero totals. Category and type filters apply; the transaction-list month filter does not, so both chart ranges remain useful regardless of the selected list month.

Category names are stored separately from transactions. On startup, names already present in the transactions table are copied into the categories table, preserving existing data and allowing categories with no transactions to be managed independently. Creating or updating a transaction with a category not yet in the list registers that category, preserving compatibility for API clients that submit category names directly.
