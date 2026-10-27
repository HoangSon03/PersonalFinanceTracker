async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      // Giữ nguyên hủy request để các effect React không báo lỗi cho lần tải đã bị thay thế.
      throw error;
    }
    throw new Error('Could not reach the API. Check that the backend is running.');
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = await response.json();
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Một số lỗi proxy/server không trả JSON; khi đó dùng thông báo kèm HTTP status.
      // Proxy/server có thể không trả JSON; khi đó giữ thông báo kèm HTTP status.
    }
    throw new Error(message);
  }

  // DELETE trả 204 không có body, các response khác theo hợp đồng đều là JSON.
  return response.status === 204 ? null : response.json();
}

function filterQuery(filters) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });
  return query.toString();
}

export function getTransactions(filters, signal) {
  return request(`/api/transactions?${filterQuery(filters)}`, { signal });
}

export function getSummary(filters, signal) {
  return request(`/api/summary?${filterQuery(filters)}`, { signal });
}

export function getCashFlow(filters, signal) {
  // Gửi bộ lọc riêng của biểu đồ qua endpoint tổng hợp, không tải toàn bộ giao dịch về client.
  return request(`/api/analytics/cash-flow?${filterQuery(filters)}`, { signal });
}

export function getCategories(signal) {
  return request('/api/categories', { signal });
}

export function createCategory(name) {
  return request('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function renameCategory(oldName, name) {
  return request(`/api/categories/${encodeURIComponent(oldName)}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export function deleteCategory(name) {
  return request(`/api/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

export function saveTransaction(transaction, id) {
  return request(id ? `/api/transactions/${id}` : '/api/transactions', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(transaction),
  });
}

export function deleteTransaction(id) {
  return request(`/api/transactions/${id}`, { method: 'DELETE' });
}
