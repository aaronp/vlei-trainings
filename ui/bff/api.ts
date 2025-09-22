import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { aidsRoutes, oobiRoutes } from './aids';


const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'vLEI Training API',
        version: '1.0.0'
      }
    }
  }))

  .onRequest(({ set }) => {
    // Disable caching
    set.headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
    set.headers["Pragma"] = "no-cache";
    set.headers["Expires"] = "0";
  })
  .get('/health', () => ({ status: 'ok' }))
  .use(aidsRoutes)
  .use(oobiRoutes)
  .get("/", ({ set, request }) => {
    console.log("Redirecting to swagger docs at /docs from root");
    set.headers["Location"] = "/api/docs";
    set.status = 302; // 302 is for temporary redirection
    return "Redirecting to /docs...";
  }, { tags: ["Docs"] })
  .onError(({ code, error, request }) => {
    console.error(
      ` 💥 Unhandled error: ${code} for ${request.method} ${request.url} 💥 `,
    );
    if ((error as any).stack) {
      console.error((error as any).stack);
    }

    return new Response("Internal Error", { status: 512 });
  });

export default app;
export type Api = typeof app