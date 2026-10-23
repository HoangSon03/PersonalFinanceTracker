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
      // Keep the status-based error when the response is not JSON.
    }
    throw new Error(message);
  }

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

export function getCategories(signal) {
  return request('/api/categories', { signal });
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
