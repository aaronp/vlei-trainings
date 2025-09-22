#!/usr/bin/env node

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// In production, we need to handle the API routes and serve static files
async function createServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    // Production mode: serve static files and handle API routes
    console.log('🚀 Starting production server...');
    
    // Import the schema API handler
    const { handleSchemaAPI } = await import('./src/api/viteSchemaPlugin.js');
    
    // Parse JSON bodies
    app.use(express.json());
    
    // Custom middleware to adapt Express req/res to match Vite's middleware format
    app.use(async (req, res, next) => {
      // Handle schema API routes
      if (req.path.startsWith('/api/schemas') || req.path.startsWith('/oobi/')) {
        // Create a mock Vite-style req object
        const viteReq = {
          url: req.url,
          method: req.method,
          headers: req.headers,
          on: (event, handler) => req.on(event, handler)
        };
        
        // Create a mock Vite-style res object
        const viteRes = {
          statusCode: 200,
          setHeader: (name, value) => res.setHeader(name, value),
          end: (data) => res.status(viteRes.statusCode).end(data)
        };
        
        // Call the schema API handler
        try {
          await handleSchemaAPI(viteReq, viteRes, next);
        } catch (error) {
          console.error('Schema API error:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
        return;
      }
      
      next();
    });
    
    // Serve static files from dist directory
    app.use(express.static(join(__dirname, 'dist')));
    
    // Handle client-side routing - serve index.html for all other routes
    app.get('*', (req, res) => {
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode: use Vite dev server
    console.log('🔧 Starting development server...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server running at http://localhost:${port}`);
  });
}

createServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});