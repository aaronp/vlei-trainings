import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handleSchemaAPI } from './src/api/viteSchemaPlugin.js'

// Schema API middleware plugin using schemaServer.service.ts
function schemaApiPlugin() {
  return {
    name: 'schema-api',
    configureServer(server) {
      server.middlewares.use(handleSchemaAPI);
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), schemaApiPlugin()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer']
  }
})
