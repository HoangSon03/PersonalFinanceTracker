function whereClause(filters) {
  const conditions = [];
  const values = [];

  if (filters.month) {
    conditions.push('substr(date, 1, 7) = ?');
    values.push(filters.month);
  }
  if (filters.type) {
    conditions.push('type = ?');
    values.push(filters.type);
  }
  if (filters.category) {
    conditions.push('category = ?');
    values.push(filters.category);
  }

  return {
    sql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

function toTransaction(row) {
  if (!row) {
    return null;
  }

  const { amount_cents: amountCents, ...transaction } = row;
  return { ...transaction, amount: amountCents / 100 };
}

export function createTransactionRepository(database) {
  const insertTransaction = database.prepare(`
    INSERT INTO transactions (title, amount_cents, type, category, date, note)
    VALUES (@title, @amountCents, @type, @category, @date, @note)
  `);
  const updateTransaction = database.prepare(`
    UPDATE transactions
    SET title = @title, amount_cents = @amountCents, type = @type,
        category = @category, date = @date, note = @note
    WHERE id = @id
  `);
  const findTransaction = database.prepare('SELECT * FROM transactions WHERE id = ?');

  return {
    categories() {
      return database
        .prepare('SELECT DISTINCT category FROM transactions ORDER BY category COLLATE NOCASE')
        .all()
        .map((row) => row.category);
    },

    list(filters) {
      const where = whereClause(filters);
      return database
        .prepare(`SELECT * FROM transactions ${where.sql} ORDER BY date DESC, id DESC`)
        .all(...where.values)
        .map(toTransaction);
    },

    summary(filters) {
      const where = whereClause(filters);
      const totals = database.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount_cents ELSE 0 END), 0) AS income_cents,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END), 0) AS expenses_cents
        FROM transactions ${where.sql}
      `).get(...where.values);
      const income = totals.income_cents / 100;
      const expenses = totals.expenses_cents / 100;
      return { income, expenses, balance: income - expenses };
    },

    create(transaction) {
      const result = insertTransaction.run(transaction);
      return toTransaction(findTransaction.get(result.lastInsertRowid));
    },

    update(id, transaction) {
      const result = updateTransaction.run({ ...transaction, id });
      return result.changes ? toTransaction(findTransaction.get(id)) : null;
    },

    delete(id) {
      return database.prepare('DELETE FROM transactions WHERE id = ?').run(id).changes > 0;
    },
  };
}
