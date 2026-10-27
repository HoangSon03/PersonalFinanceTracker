import express from 'express';
import { ApiError } from './errors.js';
import { createTransactionRepository } from './transactions/repository.js';
import { createTransactionRouter } from './transactions/routes.js';
import { createTransactionService } from './transactions/service.js';

export function createApp(database) {
  const app = express();
  // Giới hạn body ở lớp HTTP để request JSON quá lớn bị từ chối trước khi vào nghiệp vụ.
  app.use(express.json({ limit: '16kb' }));
  const transactionService = createTransactionService(createTransactionRepository(database));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api', createTransactionRouter(transactionService));

  app.use((_request, response) => {
    response.status(404).json({ error: 'Not found.' });
  });

  app.use((error, _request, response, _next) => {
    // Chuyển lỗi đã biết thành JSON an toàn; lỗi không dự kiến vẫn được ghi log và trả 500.
    if (error instanceof ApiError) {
      response.status(error.status).json({ error: error.message });
      return;
    }

    if (error instanceof SyntaxError && 'body' in error) {
      response.status(400).json({ error: 'Request body must contain valid JSON.' });
      return;
    }

    if (error.status === 413 && error.type === 'entity.too.large') {
      response.status(413).json({ error: 'Request body must be 16 KB or smaller.' });
      return;
    }

    console.error('Unhandled API error:', error);
    response.status(500).json({ error: 'An unexpected server error occurred.' });
  });

  return app;
}
