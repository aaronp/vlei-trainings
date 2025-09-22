import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

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
  .listen(port);

console.log(`Server is running at ${app.server?.hostname}:${app.server?.port}`);