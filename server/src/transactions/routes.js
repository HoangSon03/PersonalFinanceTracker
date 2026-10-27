import { Router } from 'express';
import {
  validateCategory,
  validateCategoryName,
  validateCashFlowQuery,
  validateFilters,
  validateId,
  validateTransaction,
} from '../validation.js';

export function createTransactionRouter(service) {
  const router = Router();

  router.get('/categories', (_request, response) => {
    response.json(service.categories());
  });

  router.post('/categories', (request, response) => {
    const category = service.createCategory(validateCategory(request.body).name);
    response.status(201).json({ name: category });
  });

  router.put('/categories/:name', (request, response) => {
    const oldName = validateCategoryName(request.params.name);
    const { name } = validateCategory(request.body);
    response.json({ name: service.renameCategory(oldName, name) });
  });

  router.delete('/categories/:name', (request, response) => {
    service.deleteCategory(validateCategoryName(request.params.name));
    response.status(204).end();
  });

  router.get('/transactions', (request, response) => {
    response.json(service.list(validateFilters(request.query)));
  });

  router.get('/summary', (request, response) => {
    response.json(service.summary(validateFilters(request.query)));
  });

  router.get('/analytics/cash-flow', (request, response) => {
    const { period, ...filters } = validateCashFlowQuery(request.query);
    response.json(service.cashFlow(period, filters));
  });

  router.post('/transactions', (request, response) => {
    response.status(201).json(service.create(validateTransaction(request.body)));
  });

  router.put('/transactions/:id', (request, response) => {
    const id = validateId(request.params.id);
    response.json(service.update(id, validateTransaction(request.body)));
  });

  router.delete('/transactions/:id', (request, response) => {
    service.delete(validateId(request.params.id));
    response.status(204).end();
  });

  return router;
}
