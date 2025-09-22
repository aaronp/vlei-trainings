import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'vLEI Training API',
        version: '1.0.0'
      }
    }
  }))
  .get('/health', () => ({ status: 'ok' }))
  .listen(3001);

console.log(`Server is running at ${app.server?.hostname}:${app.server?.port}`);