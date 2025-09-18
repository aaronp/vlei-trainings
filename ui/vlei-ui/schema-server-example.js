#!/usr/bin/env node

/**
 * Simple Schema Server for VLEI UI Development
 * 
 * This is a minimal HTTP server that serves custom schemas created in the VLEI UI.
 * It enables OOBI resolution for locally created schemas.
 * 
 * Usage:
 *   node schema-server-example.js
 * 
 * The server will run on http://localhost:3001
 */

const http = require('http');
const url = require('url');
const PORT = process.env.PORT || 3001;

// In-memory storage for schemas
const schemas = new Map();

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Add CORS headers to all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // GET /oobi/:said - Serve schema via OOBI
  if (method === 'GET' && path.startsWith('/oobi/')) {
    const schemaSaid = path.split('/oobi/')[1];
    
    if (!schemaSaid) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Schema SAID required' }));
      return;
    }

    const schema = schemas.get(schemaSaid);
    if (!schema) {
      res.writeHead(404);
      res.end(JSON.stringify({ 
        error: 'Schema not found',
        said: schemaSaid,
        available: Array.from(schemas.keys())
      }));
      return;
    }

    console.log(`📤 Serving schema: ${schemaSaid}`);
    res.writeHead(200);
    res.end(JSON.stringify(schema));
    return;
  }

  // POST /schemas - Register a new schema
  if (method === 'POST' && path === '/schemas') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { said, schema } = JSON.parse(body);
        
        if (!said || !schema) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Both said and schema are required' }));
          return;
        }

        schemas.set(said, schema);
        console.log(`📥 Registered schema: ${said}`);
        
        res.writeHead(200);
        res.end(JSON.stringify({ 
          success: true, 
          said,
          oobi: `http://localhost:${PORT}/oobi/${said}`
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /schemas - List all registered schemas
  if (method === 'GET' && path === '/schemas') {
    const schemaList = Array.from(schemas.entries()).map(([said, schema]) => ({
      said,
      name: schema.title || 'Unnamed Schema',
      oobi: `http://localhost:${PORT}/oobi/${said}`
    }));

    res.writeHead(200);
    res.end(JSON.stringify({
      count: schemaList.length,
      schemas: schemaList
    }));
    return;
  }

  // GET / - Server info
  if (method === 'GET' && path === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      name: 'VLEI Schema Server',
      version: '1.0.0',
      endpoints: {
        'GET /': 'Server information',
        'GET /schemas': 'List registered schemas',
        'POST /schemas': 'Register a new schema',
        'GET /oobi/:said': 'Serve schema via OOBI'
      },
      registeredSchemas: schemas.size
    }));
    return;
  }

  // 404 for all other routes
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log('🚀 VLEI Schema Server started');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📋 API Endpoints:`);
  console.log(`   GET  /           - Server info`);
  console.log(`   GET  /schemas    - List schemas`);
  console.log(`   POST /schemas    - Register schema`);
  console.log(`   GET  /oobi/:said - Serve schema`);
  console.log('');
  console.log('💡 To register a schema from VLEI UI:');
  console.log('   1. Create a schema in the Schema Manager');
  console.log('   2. The schema will be automatically registered here');
  console.log('   3. Use the schema in credential issuance');
  console.log('');
  console.log('🔧 Environment variables:');
  console.log(`   PORT=${PORT} (current)`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Schema server shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});