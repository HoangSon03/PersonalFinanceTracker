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

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function createPeriods(period, today) {
  const currentDate = new Date(`${today}T00:00:00.000Z`);

  if (period === 'day') {
    const startDate = new Date(currentDate);
    startDate.setUTCDate(startDate.getUTCDate() - 29);
    return Array.from({ length: 30 }, (_value, index) => {
      const date = new Date(startDate);
      date.setUTCDate(date.getUTCDate() + index);
      return dateKey(date);
    });
  }

  const currentMonth = new Date(Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    1,
  ));
  const startMonth = new Date(currentMonth);
  startMonth.setUTCMonth(startMonth.getUTCMonth() - 11);
  return Array.from({ length: 12 }, (_value, index) => {
    const date = new Date(startMonth);
    date.setUTCMonth(date.getUTCMonth() + index);
    return dateKey(date).slice(0, 7);
  });
}

export function createTransactionRepository(database) {
  const insertTransaction = database.prepare(`
    INSERT INTO transactions (title, amount_cents, type, category, date, note)
    VALUES (@title, @amountCents, @type, @category, @date, @note)
  `);
  const insertCategory = database.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  const updateTransaction = database.prepare(`
    UPDATE transactions
    SET title = @title, amount_cents = @amountCents, type = @type,
        category = @category, date = @date, note = @note
    WHERE id = @id
  `);
  const findCategory = database.prepare('SELECT name FROM categories WHERE name = ?');
  const categoryUsage = database.prepare('SELECT COUNT(*) AS count FROM transactions WHERE category = ?');
  const updateCategory = database.prepare('UPDATE categories SET name = ? WHERE name = ?');
  const updateTransactionCategories = database.prepare('UPDATE transactions SET category = ? WHERE category = ?');
  const deleteCategory = database.prepare('DELETE FROM categories WHERE name = ?');
  const findTransaction = database.prepare('SELECT * FROM transactions WHERE id = ?');
  const createTransaction = database.transaction((transaction) => {
    insertCategory.run(transaction.category);
    const result = insertTransaction.run(transaction);
    return toTransaction(findTransaction.get(result.lastInsertRowid));
  });
  const updateTransactionRecord = database.transaction((id, transaction) => {
    const result = updateTransaction.run({ ...transaction, id });
    if (!result.changes) {
      return null;
    }
    insertCategory.run(transaction.category);
    return toTransaction(findTransaction.get(id));
  });
  const renameCategoryRecord = database.transaction((oldName, newName) => {
    updateCategory.run(newName, oldName);
    updateTransactionCategories.run(newName, oldName);
  });
  const deleteCategoryRecord = database.transaction((name) => {
    if (categoryUsage.get(name).count > 0) {
      return false;
    }
    return deleteCategory.run(name).changes > 0;
  });

  return {
    categories() {
      return database
        .prepare('SELECT name FROM categories ORDER BY name COLLATE NOCASE')
        .all()
        .map((row) => row.name);
    },

    hasCategory(name) {
      return Boolean(findCategory.get(name));
    },

    createCategory(name) {
      database.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
      return name;
    },

    renameCategory(oldName, newName) {
      renameCategoryRecord(oldName, newName);
      return newName;
    },

    deleteCategory(name) {
      if (!findCategory.get(name)) {
        return 'not_found';
      }
      return deleteCategoryRecord(name) ? 'deleted' : 'in_use';
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

    cashFlow(period, filters) {
      const today = database.prepare("SELECT date('now', 'localtime') AS today").get().today;
      const periods = createPeriods(period, today);
      const endExclusive = new Date(`${today}T00:00:00.000Z`);
      endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
      const endDate = dateKey(endExclusive);
      const where = whereClause(filters);
      const grouping = period === 'day' ? 'date' : 'substr(date, 1, 7)';
      const groupedRows = database.prepare(`
        SELECT ${grouping} AS period,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount_cents ELSE 0 END), 0) AS income_cents,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END), 0) AS expenses_cents
        FROM transactions
        WHERE date >= ? AND date < ?
        ${where.sql ? `AND ${where.sql.slice(6)}` : ''}
        GROUP BY period
      `).all(periods[0], endDate, ...where.values);
      const amountsByPeriod = new Map(
        groupedRows.map((row) => [row.period, row]),
      );

      return periods.map((key) => {
        const amounts = amountsByPeriod.get(key);
        const income = (amounts?.income_cents ?? 0) / 100;
        const expenses = (amounts?.expenses_cents ?? 0) / 100;
        return { period: key, income, expenses, balance: income - expenses };
      });
    },

    create(transaction) {
      return createTransaction(transaction);
    },

    update(id, transaction) {
      return updateTransactionRecord(id, transaction);
    },

    delete(id) {
      return database.prepare('DELETE FROM transactions WHERE id = ?').run(id).changes > 0;
    },
  };
}
