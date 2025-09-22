#!/usr/bin/env node

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { handleSchemaAPI } from './src/api/viteSchemaPlugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

console.log('🚀 Starting production server...');

// Parse JSON bodies
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Handle CORS preflight
app.options('*', (req, res) => {
  res.status(200).end();
});

// Use the real schema API from the development server
app.use(async (req, res, next) => {
  // Only handle schema API routes with the real handler
  if (req.path.startsWith('/api/schemas') || req.path.startsWith('/oobi/')) {
    try {
      await handleSchemaAPI(req, res, next);
    } catch (error) {
      console.error('❌ Schema API error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  } else {
    next();
  }
});

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});