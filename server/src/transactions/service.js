import { ApiError } from '../errors.js';

export function createTransactionService(repository) {
  return {
    categories() {
      return repository.categories();
    },

    createCategory(name) {
      if (repository.hasCategory(name)) {
        throw new ApiError(409, 'Category already exists.');
      }
      return repository.createCategory(name);
    },

    renameCategory(oldName, newName) {
      if (!repository.hasCategory(oldName)) {
        throw new ApiError(404, 'Category not found.');
      }
      if (oldName !== newName && repository.hasCategory(newName)) {
        throw new ApiError(409, 'Category already exists.');
      }
      return repository.renameCategory(oldName, newName);
    },

    deleteCategory(name) {
      const result = repository.deleteCategory(name);
      if (result === 'not_found') {
        throw new ApiError(404, 'Category not found.');
      }
      if (result === 'in_use') {
        throw new ApiError(409, 'Category is used by one or more transactions.');
      }
    },

    list(filters) {
      return repository.list(filters);
    },

    summary(filters) {
      return repository.summary(filters);
    },

    cashFlow(period, filters) {
      return repository.cashFlow(period, filters);
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
