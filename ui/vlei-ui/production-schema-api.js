// Simplified schema API for production - compatible with Node.js without TypeScript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory schema storage for production
const schemas = new Map();

// Simple UUID generator
function generateId() {
  return `schema-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
}

// Parse JSON body from request with timeout
function parseJsonBody(req, timeout = 5000) {
  return new Promise((resolve, reject) => {
    let body = '';
    const timer = setTimeout(() => {
      reject(new Error('Request body parsing timeout'));
    }, timeout);

    req.on('data', chunk => {
      body += chunk;
      // Limit body size to prevent abuse
      if (body.length > 1024 * 1024) { // 1MB limit
        clearTimeout(timer);
        reject(new Error('Request body too large'));
      }
    });
    
    req.on('end', () => {
      clearTimeout(timer);
      try {
        if (body.length === 0) {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    
    req.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

// Production schema API handler
export async function handleProductionSchemaAPI(req, res, next) {
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

  console.log(`📡 Production Schema API: ${method} ${pathname}`);

  try {
    // GET /api/schemas/info - API information
    if (method === 'GET' && pathname === '/api/schemas/info') {
      console.log('📋 Handling /api/schemas/info request');
      res.statusCode = 200;
      res.end(JSON.stringify({
        name: 'VLEI Schema API (Production)',
        version: '2.0.0',
        description: 'Production schema API with in-memory storage',
        endpoints: [
          'GET /api/schemas - List schemas',
          'GET /api/schemas/:id - Get schema by ID',
          'POST /api/schemas - Create schema',
          'GET /oobi/:said - Serve schema for KERIA',
          'GET /api/schemas/info - API information'
        ],
        status: 'running',
        environment: 'production',
        schemaCount: schemas.size
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

      // Find schema by SAID
      let foundSchema = null;
      for (const [id, schema] of schemas.entries()) {
        if (schema.metadata && schema.metadata.said === schemaSaid) {
          foundSchema = schema;
          break;
        }
      }

      if (!foundSchema) {
        const availableSchemas = Array.from(schemas.values())
          .filter(s => s.metadata)
          .map(s => ({ said: s.metadata.said, name: s.metadata.name }));
        
        console.warn(`❌ Schema not found for SAID: ${schemaSaid}`);
        res.statusCode = 404;
        res.end(JSON.stringify({ 
          error: 'Schema not found',
          said: schemaSaid,
          available: availableSchemas
        }));
        return;
      }

      console.log(`📤 Serving schema via OOBI: ${foundSchema.metadata.name} (${schemaSaid})`);
      res.statusCode = 200;
      res.end(JSON.stringify(foundSchema.jsonSchema));
      return;
    }

    // GET /api/schemas - List all schemas
    if (method === 'GET' && pathname === '/api/schemas') {
      const searchParams = url.searchParams;
      
      let schemaList = Array.from(schemas.values()).filter(s => s.metadata);
      
      // Apply search filter
      const search = searchParams.get('search');
      if (search) {
        const searchTerm = search.toLowerCase();
        schemaList = schemaList.filter(schema => 
          schema.metadata.name.toLowerCase().includes(searchTerm) ||
          (schema.metadata.description && schema.metadata.description.toLowerCase().includes(searchTerm))
        );
      }

      // Apply sorting
      const sortBy = searchParams.get('sortBy') || 'updatedAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      schemaList.sort((a, b) => {
        const aVal = a.metadata[sortBy];
        const bVal = b.metadata[sortBy];
        const direction = sortOrder === 'desc' ? -1 : 1;
        
        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
        return 0;
      });

      // Apply pagination
      const limit = parseInt(searchParams.get('limit')) || 100;
      const offset = parseInt(searchParams.get('offset')) || 0;
      const total = schemaList.length;
      const paginatedSchemas = schemaList.slice(offset, offset + limit);

      res.statusCode = 200;
      res.end(JSON.stringify({
        schemas: paginatedSchemas,
        total,
        hasMore: offset + limit < total,
        offset,
        limit
      }));
      return;
    }

    // GET /api/schemas/:id - Get specific schema
    if (method === 'GET' && pathname.match(/^\/api\/schemas\/[^\/]+$/)) {
      const schemaId = pathname.split('/api/schemas/')[1];
      const schema = schemas.get(schemaId);

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
      try {
        console.log('📝 Creating schema, body available:', !!req.body);
        console.log('📝 Request body keys:', req.body ? Object.keys(req.body) : 'none');
        
        // Express should have already parsed the JSON body
        const requestData = req.body;
        
        if (!requestData) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Request body is required' }));
          return;
        }
        
        console.log('📝 Request data received:', {
          name: requestData.name,
          said: requestData.said,
          hasJsonSchema: !!requestData.jsonSchema
        });
        
        // Convert to our schema format
        const now = new Date().toISOString();
        const id = requestData.id || generateId();
        
        const schemaData = {
          metadata: {
            id,
            said: requestData.said,
            name: requestData.name,
            description: requestData.description || '',
            version: requestData.version || '1.0.0',
            createdAt: requestData.createdAt || now,
            updatedAt: now,
            tags: requestData.tags || [],
            isPublic: requestData.isPublic || false
          },
          jsonSchema: requestData.jsonSchema,
          fields: requestData.fields || []
        };
        
        // Check for duplicate SAID
        for (const [existingId, existingSchema] of schemas.entries()) {
          if (existingSchema.metadata && existingSchema.metadata.said === schemaData.metadata.said) {
            res.statusCode = 409;
            res.end(JSON.stringify({ 
              error: 'Schema with this SAID already exists',
              said: schemaData.metadata.said
            }));
            return;
          }
        }
        
        // Store the schema
        schemas.set(schemaData.metadata.id, schemaData);

        console.log(`📥 Created schema: ${schemaData.metadata.name} (${schemaData.metadata.said})`);
        
        res.statusCode = 201;
        res.end(JSON.stringify({
          ...schemaData,
          oobi: `http://${req.headers.host}/oobi/${schemaData.metadata.said}`
        }));
        return;
      } catch (error) {
        console.error('❌ Error creating schema:', error);
        res.statusCode = 400;
        res.end(JSON.stringify({ error: error.message }));
        return;
      }
    }

    // 404 for unsupported endpoints
    res.statusCode = 404;
    res.end(JSON.stringify({ 
      error: 'API endpoint not found',
      path: pathname,
      method: method
    }));

  } catch (error) {
    console.error('❌ Production Schema API error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }));
  }
}

export default handleProductionSchemaAPI;