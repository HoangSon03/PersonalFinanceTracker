import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/db.js';

let database;
let server;
let baseUrl;
let temporaryDirectory;
let databasePath;

beforeEach(async () => {
  temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'finance-tracker-'));
  databasePath = path.join(temporaryDirectory, 'test.sqlite');
  database = createDatabase(databasePath);
  server = createApp(database).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  database.close();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

async function request(pathname, options = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
  });
}

function transaction(overrides = {}) {
  return {
    title: 'Monthly salary',
    amount: 2500,
    type: 'income',
    category: 'Work',
    date: '2026-10-05',
    note: '',
    ...overrides,
  };
}

test('creates, lists, updates, and deletes a transaction', async () => {
  const createdResponse = await request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction()),
  });
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.equal(created.amount, 2500);
  assert.equal(created.title, 'Monthly salary');

  const listResponse = await request('/api/transactions');
  assert.equal((await listResponse.json()).length, 1);

  const updateResponse = await request(`/api/transactions/${created.id}`, {
    method: 'PUT',
    body: JSON.stringify(transaction({ title: 'Updated salary', amount: 2600 })),
  });
  assert.equal(updateResponse.status, 200);
  assert.equal((await updateResponse.json()).title, 'Updated salary');

  const deleteResponse = await request(`/api/transactions/${created.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 204);
  assert.deepEqual(await (await request('/api/transactions')).json(), []);
});

test('filters transactions and computes totals from the same filter set', async () => {
  await request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction()),
  });
  await request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction({
      title: 'Groceries',
      amount: 125.5,
      type: 'expense',
      category: 'Food',
      date: '2026-10-10',
    })),
  });
  await request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction({ date: '2026-09-10', amount: 500 })),
  });

  const list = await request('/api/transactions?month=2026-10');
  assert.equal((await list.json()).length, 2);

  const summary = await request('/api/summary?month=2026-10');
  assert.deepEqual(await summary.json(), {
    income: 2500,
    expenses: 125.5,
    balance: 2374.5,
  });

  const categoryList = await request('/api/transactions?category=Food&type=expense');
  assert.equal((await categoryList.json()).length, 1);

  const filteredSummary = await request('/api/summary?type=expense&category=Food');
  assert.deepEqual(await filteredSummary.json(), {
    income: 0,
    expenses: 125.5,
    balance: -125.5,
  });
});

test('rejects invalid transaction input and invalid filters with JSON errors', async () => {
  const invalidTransaction = await request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction({ amount: -1 })),
  });
  assert.equal(invalidTransaction.status, 400);
  assert.match((await invalidTransaction.json()).error, /positive number/);

  const invalidDate = await request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction({ date: '2026-02-30' })),
  });
  assert.equal(invalidDate.status, 400);

  const invalidFilter = await request('/api/transactions?month=2026-13');
  assert.equal(invalidFilter.status, 400);
  assert.ok((await invalidFilter.json()).error);
});

test('returns 404 for missing transactions', async () => {
  const response = await request('/api/transactions/999', { method: 'DELETE' });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Transaction not found.' });

  const updateResponse = await request('/api/transactions/999', {
    method: 'PUT',
    body: JSON.stringify(transaction()),
  });
  assert.equal(updateResponse.status, 404);
  assert.deepEqual(await updateResponse.json(), { error: 'Transaction not found.' });
});

test('reports health and returns distinct categories', async () => {
  const health = await request('/api/health');
  assert.deepEqual(await health.json(), { status: 'ok' });

  await request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction({ category: 'Work' })),
  });
  await request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction({ category: 'Food', type: 'expense' })),
  });

  const categories = await request('/api/categories');
  assert.deepEqual(await categories.json(), ['Food', 'Work']);
});

test('returns consistent JSON errors for malformed and oversized request bodies', async () => {
  const malformed = await request('/api/transactions', {
    method: 'POST',
    body: '{',
  });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: 'Request body must contain valid JSON.' });

  const oversized = await request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction({ note: 'x'.repeat(17_000) })),
  });
  assert.equal(oversized.status, 413);
  assert.deepEqual(await oversized.json(), { error: 'Request body must be 16 KB or smaller.' });
});

test('keeps persisted transactions available after reopening the SQLite database', async () => {
  const createResponse = await request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction({ title: 'Persistent entry' })),
  });
  const created = await createResponse.json();

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  database.close();
  database = createDatabase(databasePath);
  server = createApp(database).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const listResponse = await request('/api/transactions');
  assert.deepEqual(await listResponse.json(), [{
    id: created.id,
    title: 'Persistent entry',
    amount: 2500,
    type: 'income',
    category: 'Work',
    date: '2026-10-05',
    note: '',
  }]);
});
