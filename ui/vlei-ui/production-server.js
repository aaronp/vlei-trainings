#!/usr/bin/env node

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Simple schema API mock for production
app.get('/api/schemas/info', (req, res) => {
  console.log('📋 Handling /api/schemas/info request');
  res.json({
    name: 'VLEI Schema API',
    version: '2.0.0',
    description: 'Production build - API functionality limited',
    endpoints: [
      'GET /api/schemas/info - API information'
    ],
    status: 'running',
    environment: 'production'
  });
});

// Handle other schema API routes with a basic response
app.use('/api/schemas*', (req, res) => {
  console.log(`📡 Schema API: ${req.method} ${req.path}`);
  res.status(503).json({ 
    error: 'Schema service not available in production build',
    message: 'Full schema API requires development server or custom implementation'
  });
});

// Handle OOBI routes with a basic response
app.use('/oobi/*', (req, res) => {
  console.log(`📡 OOBI API: ${req.method} ${req.path}`);
  res.status(503).json({ 
    error: 'OOBI service not available in production build',
    message: 'Full OOBI API requires development server or custom implementation'
  });
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