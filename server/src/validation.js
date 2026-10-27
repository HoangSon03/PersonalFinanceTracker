import { ApiError } from './errors.js';

function requiredText(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, `${field} is required.`);
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new ApiError(400, `${field} must be ${maxLength} characters or fewer.`);
  }

  return trimmed;
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  // Regex kiểm tra hình dạng; round-trip loại ngày không tồn tại như 30/02.
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

export function validateTransaction(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }

  if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0) {
    throw new ApiError(400, 'Amount must be a positive number.');
  }

  // Quy đổi tiền về cent nguyên trước khi lưu và từ chối phần lẻ hơn một cent.
  const amountCents = Math.round(body.amount * 100);
  if (
    !Number.isSafeInteger(amountCents)
    || amountCents <= 0
    || Math.abs(body.amount * 100 - amountCents) > 1e-7
  ) {
    throw new ApiError(400, 'Amount must have no more than two decimal places.');
  }

  if (!['income', 'expense'].includes(body.type)) {
    throw new ApiError(400, 'Type must be income or expense.');
  }

  if (!validDate(body.date)) {
    throw new ApiError(400, 'Date must be a valid calendar date in YYYY-MM-DD format.');
  }

  if (body.note !== undefined && typeof body.note !== 'string') {
    throw new ApiError(400, 'Note must be text.');
  }

  const note = (body.note || '').trim();
  if (note.length > 1000) {
    throw new ApiError(400, 'Note must be 1000 characters or fewer.');
  }

  return {
    title: requiredText(body.title, 'Title', 120),
    amountCents,
    type: body.type,
    category: requiredText(body.category, 'Category', 60),
    date: body.date,
    note,
  };
}

export function validateCategoryName(value) {
  return requiredText(value, 'Category', 60);
}

export function validateCategory(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }

  return { name: validateCategoryName(body.name) };
}

export function validateFilters(query) {
  const filters = {};

  if (query.month !== undefined) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(query.month)) {
      throw new ApiError(400, 'Month must use YYYY-MM format.');
    }
    filters.month = query.month;
  }

  if (query.type !== undefined) {
    if (!['income', 'expense'].includes(query.type)) {
      throw new ApiError(400, 'Type must be income or expense.');
    }
    filters.type = query.type;
  }

  if (query.category !== undefined) {
    if (typeof query.category !== 'string' || query.category.length > 60) {
      throw new ApiError(400, 'Category filter must be 60 characters or fewer.');
    }
    filters.category = query.category;
  }

  return filters;
}

export function validateTransactionListQuery(query) {
  const filters = validateFilters(query);
  const hasPagination = query.page !== undefined || query.pageSize !== undefined;
  if (!hasPagination) {
    return { filters, pagination: null };
  }

  function positiveInteger(value, field, fallback) {
    if (value === undefined) {
      return fallback;
    }

    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
      throw new ApiError(400, `${field} must be a positive integer.`);
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) {
      throw new ApiError(400, `${field} must be a positive integer.`);
    }
    return parsed;
  }

  const page = positiveInteger(query.page, 'Page', 1);
  const pageSize = positiveInteger(query.pageSize, 'Page size', 20);
  if (pageSize > 100) {
    throw new ApiError(400, 'Page size must be 100 or fewer.');
  }
  if (page > Math.floor(Number.MAX_SAFE_INTEGER / pageSize)) {
    throw new ApiError(400, 'Page is too large.');
  }

  return { filters, pagination: { page, pageSize } };
}

export function validateCashFlowQuery(query) {
  if (!['day', 'month'].includes(query.period)) {
    throw new ApiError(400, 'Period must be day or month.');
  }

  // Biểu đồ có khoảng ngày riêng, nên chỉ nhận bộ lọc loại và category, không nhận lọc tháng.
  const filters = validateFilters({ type: query.type, category: query.category });
  return { ...filters, period: query.period };
}

export function validateId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ApiError(400, 'Transaction ID must be a positive integer.');
  }
  return id;
}
