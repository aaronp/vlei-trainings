// Unified Schema API Router
// Uses SchemaService for business logic, handles HTTP routing and responses
import { getSchemaService, initializeSchemaService } from '../services/schemaStorage.js';

// Initialize schema service if not already done
let schemaService = null;

function getOrInitializeSchemaService() {
  if (!schemaService) {
    try {
      schemaService = getSchemaService();
    } catch (error) {
      // Initialize with appropriate provider based on environment
      const provider = typeof window !== 'undefined' ? 'localStorage' : 'memory';
      console.log(`🔧 Initializing schema service with ${provider} provider`);
      schemaService = initializeSchemaService({ provider });
    }
  }
  return schemaService;
}

// Set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
}

// Parse JSON body from request
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 5000);

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) { // 1MB limit
        clearTimeout(timeout);
        reject(new Error('Request too large'));
      }
    });
    
    req.on('end', () => {
      clearTimeout(timeout);
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    
    req.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Send JSON response with proper error handling
function sendJsonResponse(res, statusCode, data) {
  try {
    res.statusCode = statusCode;
    res.end(JSON.stringify(data));
  } catch (error) {
    console.error('Failed to send JSON response:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

// Unified Schema API Router
export async function handleSchemaAPIRoutes(req, res, next) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  // Only handle schema API routes
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

  console.log(`📡 Schema API Router: ${method} ${pathname}`);

  try {
    const service = getOrInitializeSchemaService();

    // GET /api/schemas/info - API information
    if (method === 'GET' && pathname === '/api/schemas/info') {
      const info = service.getProviderInfo();
      return sendJsonResponse(res, 200, {
        name: 'VLEI Schema API (Unified)',
        version: '3.0.0',
        description: 'Unified schema API using SchemaService',
        endpoints: [
          'GET /api/schemas - List schemas',
          'GET /api/schemas/:id - Get schema by ID',
          'POST /api/schemas - Create schema',
          'PUT /api/schemas/:id - Update schema',
          'DELETE /api/schemas/:id - Delete schema',
          'GET /oobi/:said - Serve schema for KERIA',
          'GET /api/schemas/info - API information'
        ],
        provider: info,
        environment: typeof window !== 'undefined' ? 'browser' : 'server'
      });
    }

    // GET /oobi/:said - Serve schema via OOBI for KERIA
    if (method === 'GET' && pathname.startsWith('/oobi/')) {
      const schemaSaid = pathname.split('/oobi/')[1];
      
      if (!schemaSaid) {
        return sendJsonResponse(res, 400, { error: 'Schema SAID required' });
      }

      try {
        const schemaData = await service.getSchemaForOOBI(schemaSaid);
        if (!schemaData) {
          return sendJsonResponse(res, 404, { 
            error: 'Schema not found',
            said: schemaSaid
          });
        }

        console.log(`📤 Serving schema via OOBI: ${schemaSaid}`);
        return sendJsonResponse(res, 200, schemaData);
      } catch (error) {
        console.error(`Failed to serve OOBI for ${schemaSaid}:`, error);
        return sendJsonResponse(res, 404, { 
          error: 'Schema not found',
          said: schemaSaid
        });
      }
    }

    // GET /api/schemas - List all schemas
    if (method === 'GET' && pathname === '/api/schemas') {
      const searchParams = url.searchParams;
      
      const query = {
        search: searchParams.get('search') || undefined,
        sortBy: searchParams.get('sortBy') || 'updatedAt',
        sortOrder: searchParams.get('sortOrder') || 'desc',
        limit: parseInt(searchParams.get('limit')) || 100,
        offset: parseInt(searchParams.get('offset')) || 0,
        tags: searchParams.get('tags')?.split(',').filter(Boolean),
        isPublic: searchParams.get('isPublic') ? searchParams.get('isPublic') === 'true' : undefined
      };

      const result = await service.listSchemas(query);
      return sendJsonResponse(res, 200, result);
    }

    // GET /api/schemas/:id - Get specific schema
    if (method === 'GET' && pathname.match(/^\/api\/schemas\/[^\/]+$/)) {
      const schemaId = pathname.split('/api/schemas/')[1];
      
      const schema = await service.getSchema(schemaId);
      if (!schema) {
        return sendJsonResponse(res, 404, { error: 'Schema not found' });
      }

      return sendJsonResponse(res, 200, schema);
    }

    // POST /api/schemas - Create new schema
    if (method === 'POST' && pathname === '/api/schemas') {
      let requestData;
      
      // Try to use Express parsed body first, fallback to manual parsing
      if (req.body && Object.keys(req.body).length > 0) {
        requestData = req.body;
      } else {
        requestData = await parseJsonBody(req);
      }
      
      if (!requestData || !requestData.name || !requestData.jsonSchema) {
        return sendJsonResponse(res, 400, { 
          error: 'Missing required fields: name, jsonSchema' 
        });
      }

      try {
        const createdSchema = await service.createSchema(requestData);
        console.log(`📥 Created schema: ${createdSchema.metadata.name} (${createdSchema.metadata.said})`);
        
        return sendJsonResponse(res, 201, {
          ...createdSchema,
          oobi: `http://${req.headers.host}/oobi/${createdSchema.metadata.said}`
        });
      } catch (error) {
        console.error('Failed to create schema:', error);
        return sendJsonResponse(res, 400, { error: error.message });
      }
    }

    // PUT /api/schemas/:id - Update schema
    if (method === 'PUT' && pathname.match(/^\/api\/schemas\/[^\/]+$/)) {
      const schemaId = pathname.split('/api/schemas/')[1];
      const requestData = req.body || await parseJsonBody(req);
      
      try {
        const updatedSchema = await service.updateSchema(schemaId, requestData);
        console.log(`📝 Updated schema: ${updatedSchema.metadata.name} (${updatedSchema.metadata.said})`);
        
        return sendJsonResponse(res, 200, updatedSchema);
      } catch (error) {
        console.error('Failed to update schema:', error);
        const statusCode = error.message.includes('not found') ? 404 : 400;
        return sendJsonResponse(res, statusCode, { error: error.message });
      }
    }

    // DELETE /api/schemas/:id - Delete schema
    if (method === 'DELETE' && pathname.match(/^\/api\/schemas\/[^\/]+$/)) {
      const schemaId = pathname.split('/api/schemas/')[1];
      
      try {
        const deleted = await service.deleteSchema(schemaId);
        if (deleted) {
          console.log(`🗑️  Deleted schema: ${schemaId}`);
          return sendJsonResponse(res, 200, { success: true, deleted: schemaId });
        } else {
          return sendJsonResponse(res, 404, { error: 'Schema not found' });
        }
      } catch (error) {
        console.error('Failed to delete schema:', error);
        return sendJsonResponse(res, 500, { error: error.message });
      }
    }

    // POST /api/schemas/sync - Legacy sync endpoint (for compatibility)
    if (method === 'POST' && pathname === '/api/schemas/sync') {
      return sendJsonResponse(res, 200, { 
        success: true, 
        message: 'Sync not needed - unified API handles all operations directly'
      });
    }

    // 404 for unsupported endpoints
    return sendJsonResponse(res, 404, { 
      error: 'API endpoint not found',
      path: pathname,
      method: method
    });

  } catch (error) {
    console.error('❌ Schema API Router error:', error);
    return sendJsonResponse(res, 500, { 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

export default handleSchemaAPIRoutes;