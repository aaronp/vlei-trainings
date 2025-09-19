// Vite plugin for schema API - uses schemaServer.service.ts
import { SchemaServerService } from '../services/schemaServer.service.ts';
import { getSchemaService, initializeSchemaService } from '../services/schemaStorage.js';

// Initialize schema service with in-memory storage for server context
function initializeServerSchemaService() {
  try {
    console.log('🔧 Initializing server schema service with in-memory storage');
    return initializeSchemaService({ provider: 'memory' });
  } catch (error) {
    console.error('Failed to initialize schema service:', error);
    return null;
  }
}

// Initialize schema service for server context
const serverSchemaService = initializeServerSchemaService();

// Create a schema server service instance for the API
const schemaServerService = new SchemaServerService();

// Parse JSON body from request
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
}

// Safe schema service getter
function getSafeSchemaService() {
  try {
    return getSchemaService();
  } catch (error) {
    console.error('Schema service not available:', error);
    return null;
  }
}

// Schema API handler using schemaServer.service.ts
export async function handleSchemaAPI(req, res, next) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  // Only handle /api/schemas and /oobi routes
  if (!pathname.startsWith('/api/schemas') && !pathname.startsWith('/oobi/')) {
    return next();
  }

  setCorsHeaders(res);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  console.log(`📡 Schema API: ${method} ${pathname}`);

  try {
    // GET /api/schemas/info - API information (check first to avoid conflicts)
    if (method === 'GET' && pathname === '/api/schemas/info') {
      console.log('📋 Handling /api/schemas/info request');
      const status = await schemaServerService.getServerStatus();
      res.statusCode = 200;
      res.end(JSON.stringify({
        name: 'VLEI Schema API',
        version: '2.0.0',
        description: 'Integrated with SchemaService',
        endpoints: [
          'GET /api/schemas - List schemas',
          'GET /api/schemas/:id - Get schema by ID',
          'POST /api/schemas - Create schema',
          'PUT /api/schemas/:id - Update schema',
          'DELETE /api/schemas/:id - Delete schema',
          'GET /oobi/:said - Serve schema for KERIA',
          'GET /api/schemas/info - API information'
        ],
        ...status
      }));
      return;
    }

    // GET /oobi/:said - Serve schema via OOBI for KERIA
    if (method === 'GET' && pathname.startsWith('/oobi/')) {
      const schemaSaid = pathname.split('/oobi/')[1];
      
      if (!schemaSaid) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Schema SAID required' }));
        return;
      }

      try {
        const schemaData = await schemaServerService.createOOBIResponse(schemaSaid);
        console.log(`📤 Serving schema via OOBI: ${schemaSaid}`);
        res.statusCode = 200;
        res.end(JSON.stringify(schemaData));
      } catch (error) {
        console.warn(`Schema not found: ${schemaSaid}`);
        res.statusCode = 404;
        res.end(JSON.stringify({ 
          error: 'Schema not found',
          said: schemaSaid
        }));
      }
      return;
    }

    // GET /api/schemas - List all schemas
    if (method === 'GET' && pathname === '/api/schemas') {
      const schemaService = getSafeSchemaService();
      if (!schemaService) {
        res.statusCode = 503;
        res.end(JSON.stringify({ error: 'Schema service unavailable' }));
        return;
      }
      const searchParams = url.searchParams;
      
      const query = {
        search: searchParams.get('search') || undefined,
        sortBy: searchParams.get('sortBy') || 'updatedAt',
        sortOrder: searchParams.get('sortOrder') || 'desc',
        limit: parseInt(searchParams.get('limit')) || 100,
        offset: parseInt(searchParams.get('offset')) || 0
      };

      const result = await schemaService.listSchemas(query);
      
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return;
    }

    // GET /api/schemas/:id - Get specific schema
    if (method === 'GET' && pathname.match(/^\/api\/schemas\/[^\/]+$/)) {
      const schemaId = pathname.split('/api/schemas/')[1];
      const schemaService = getSafeSchemaService();
      if (!schemaService) {
        res.statusCode = 503;
        res.end(JSON.stringify({ error: 'Schema service unavailable' }));
        return;
      }
      
      const schema = await schemaService.getSchema(schemaId);
      if (!schema) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Schema not found' }));
        return;
      }

      res.statusCode = 200;
      res.end(JSON.stringify(schema));
      return;
    }

    // POST /api/schemas - Create new schema
    if (method === 'POST' && pathname === '/api/schemas') {
      const requestData = await parseJsonBody(req);
      const schemaService = getSafeSchemaService();
      if (!schemaService) {
        res.statusCode = 503;
        res.end(JSON.stringify({ error: 'Schema service unavailable' }));
        return;
      }
      
      try {
        const createdSchema = await schemaService.createSchema(requestData);
        console.log(`📥 Created schema: ${createdSchema.metadata.name} (${createdSchema.metadata.said})`);
        
        res.statusCode = 201;
        res.end(JSON.stringify({
          ...createdSchema,
          oobi: schemaServerService.getSchemaOOBI(createdSchema.metadata.said)
        }));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    // PUT /api/schemas/:id - Update schema
    if (method === 'PUT' && pathname.match(/^\/api\/schemas\/[^\/]+$/)) {
      const schemaId = pathname.split('/api/schemas/')[1];
      const requestData = await parseJsonBody(req);
      const schemaService = getSafeSchemaService();
      if (!schemaService) {
        res.statusCode = 503;
        res.end(JSON.stringify({ error: 'Schema service unavailable' }));
        return;
      }

      try {
        const updatedSchema = await schemaService.updateSchema(schemaId, requestData);
        console.log(`📝 Updated schema: ${updatedSchema.metadata.name} (${updatedSchema.metadata.said})`);
        
        res.statusCode = 200;
        res.end(JSON.stringify(updatedSchema));
      } catch (error) {
        if (error.message.includes('not found')) {
          res.statusCode = 404;
        } else {
          res.statusCode = 400;
        }
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    // DELETE /api/schemas/:id - Delete schema
    if (method === 'DELETE' && pathname.match(/^\/api\/schemas\/[^\/]+$/)) {
      const schemaId = pathname.split('/api/schemas/')[1];
      const schemaService = getSafeSchemaService();
      if (!schemaService) {
        res.statusCode = 503;
        res.end(JSON.stringify({ error: 'Schema service unavailable' }));
        return;
      }

      try {
        const deleted = await schemaService.deleteSchema(schemaId);
        if (deleted) {
          console.log(`🗑️  Deleted schema: ${schemaId}`);
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, deleted: schemaId }));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Schema not found' }));
        }
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    // POST /api/schemas/sync - Sync schemas (legacy compatibility)
    if (method === 'POST' && pathname === '/api/schemas/sync') {
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Sync not needed - schemas are already integrated with SchemaService'
      }));
      return;
    }


    // 404 for unsupported endpoints
    res.statusCode = 404;
    res.end(JSON.stringify({ 
      error: 'API endpoint not found',
      path: pathname,
      method: method
    }));

  } catch (error) {
    console.error('❌ Schema API error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }));
  }
}

export default handleSchemaAPI;