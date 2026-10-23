import { ApiError } from '../errors.js';

export function createTransactionService(repository) {
  return {
    categories() {
      return repository.categories();
    },

    list(filters) {
      return repository.list(filters);
    },

    summary(filters) {
      return repository.summary(filters);
    },

    create(transaction) {
      return repository.create(transaction);
    },

    update(id, transaction) {
      const updated = repository.update(id, transaction);
      if (!updated) {
        throw new ApiError(404, 'Transaction not found.');
      }
      return updated;
    },

    delete(id) {
      if (!repository.delete(id)) {
        throw new ApiError(404, 'Transaction not found.');
      }
    },
  };
}
