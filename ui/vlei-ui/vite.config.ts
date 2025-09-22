import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handleSchemaAPIRoutes } from './src/api/schemaApiRouter.js'

// Unified Schema API middleware plugin
function schemaApiPlugin() {
  return {
    name: 'unified-schema-api',
    configureServer(server) {
      server.middlewares.use(handleSchemaAPIRoutes);
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
  },
  server: {
    host: '0.0.0.0', // Listen on all interfaces, making it accessible from Docker
    port: 5173
  }
})
