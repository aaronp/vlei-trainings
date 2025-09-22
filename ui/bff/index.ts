import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { aidsRoutes, oobiRoutes } from './aids';

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
  .use(aidsRoutes)
  .use(oobiRoutes)
  .listen(port);

console.log(`Server is running at ${app.server?.hostname}:${app.server?.port}`);