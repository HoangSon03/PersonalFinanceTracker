import { Router } from 'express';
import { validateFilters, validateId, validateTransaction } from '../validation.js';

export function createTransactionRouter(service) {
  const router = Router();

  router.get('/categories', (_request, response) => {
    response.json(service.categories());
  });

  router.get('/transactions', (request, response) => {
    response.json(service.list(validateFilters(request.query)));
  });

  router.get('/summary', (request, response) => {
    response.json(service.summary(validateFilters(request.query)));
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
