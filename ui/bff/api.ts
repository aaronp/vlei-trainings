import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { aidsRoutes } from './aids';
import { oobiRoutes } from './oobi';


const app = new Elysia()
  .use(
    swagger({
      path: "/docs",
      scalarConfig: {
        forceDarkModeState: "dark",
        // favicon: "/favicon.svg",
      },
      documentation: {
        info: {
          title: "vLEIs",
          description: "vLEI API",
          version: "0.0.1",
        },
        tags: [
          {
            name: "AID",
            description: "AID routes",
          },
          {
            name: "OOBI",
            description: "Out-of-Band Introduction routes",
          },
        ],
      },
      exclude: ["/docs", "/"], // exclude our own swagger docs, including the root redirect
    }),
  )

  .onRequest(({ set, request }) => {
    // Disable caching
    set.headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
    set.headers["Pragma"] = "no-cache";
    set.headers["Expires"] = "0";
    set.headers["x-timestamp"] = String((new Date()).getTime());
    console.log(`${request.method} ${request.url} ...`)
  })
  .onAfterResponse(({ request, set }) => {
    const started = set.headers["x-timestamp"];
    if (started) {
      const took = (new Date()).getTime() - Number(started)
      console.log(`${request.method} ${request.url} : ${set.status} took ${took}ms`)
    } else {
      console.log(`${request.method} ${request.url} not timed`)
    }
  })
  .get('/health', () => ({ status: 'ok' }))
  .use(aidsRoutes)
  .use(oobiRoutes)
  .get("/", ({ set, request }) => {
    console.log("Redirecting to swagger docs at /docs from root");
    set.headers["Location"] = "/docs";
    set.status = 302; // 302 is for temporary redirection
    return "Redirecting to /docs...";
  }, { tags: ["Docs"] })
  .onError(({ code, error, request }) => {
    if (!request.url.endsWith("favicon.ico")) {
      console.error(
        ` 💥 Unhandled error: ${code} for ${request.method} ${request.url} 💥 `,
      );
    }
    if ((error as any).stack) {
      console.error((error as any).stack);
    }

    return new Response("Internal Error", { status: 512 });
  });

export default app;
export type Api = typeof app