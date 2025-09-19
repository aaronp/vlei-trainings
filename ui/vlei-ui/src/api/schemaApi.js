// Schema API middleware for Vite dev server
// Handles /api/schemas/* endpoints

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage file path (in project root for development)
const STORAGE_FILE = path.join(__dirname, '../../schema-storage.json');

// Initialize storage file if it doesn't exist
function initializeStorage() {
  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({}));
    console.log('📁 Created schema storage file:', STORAGE_FILE);
  }
}

// Read schemas from storage file
function readSchemas() {
  try {
    const data = fs.readFileSync(STORAGE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('⚠️  Failed to read schemas:', error.message);
    return {};
  }
}

// Write schemas to storage file
function writeSchemas(schemas) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(schemas, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed to write schemas:', error.message);
    return false;
  }
}

// Convert SchemaService format to OOBI format
function convertToOOBI(schemaData) {
  return schemaData.jsonSchema;
}

// Parse JSON body from request
async function parseJsonBody(req) {
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

// Schema API handler
export function schemaApiHandler(req, res, next) {
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

  // Initialize storage on first request
  initializeStorage();

  console.log(`📡 Schema API: ${method} ${pathname}`);

  try {
    // GET /oobi/:said - Serve schema via OOBI for KERIA
    if (method === 'GET' && pathname.startsWith('/oobi/')) {
      const schemaSaid = pathname.split('/oobi/')[1];
      
      if (!schemaSaid) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Schema SAID required' }));
        return;
      }

      const schemas = readSchemas();
      let foundSchema = null;

      // Find schema by SAID
      for (const [id, schema] of Object.entries(schemas)) {
        if (schema.metadata && schema.metadata.said === schemaSaid) {
          foundSchema = schema;
          break;
        }
      }

      if (!foundSchema) {
        const availableSchemas = Object.values(schemas)
          .filter(s => s.metadata)
          .map(s => ({ said: s.metadata.said, name: s.metadata.name }));
        
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
      res.end(JSON.stringify(convertToOOBI(foundSchema)));
      return;
    }

    // GET /api/schemas - List all schemas
    if (method === 'GET' && pathname === '/api/schemas') {
      const schemas = readSchemas();
      const searchParams = url.searchParams;
      
      let schemaList = Object.values(schemas).filter(s => s.metadata);
      
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
        hasMore: offset + limit < total
      }));
      return;
    }

    // GET /api/schemas/:id - Get specific schema
    if (method === 'GET' && pathname.match(/^\/api\/schemas\/[^\/]+$/)) {
      const schemaId = pathname.split('/api/schemas/')[1];
      const schemas = readSchemas();
      const schema = schemas[schemaId];

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
      parseJsonBody(req).then(requestData => {
        const schemas = readSchemas();
        
        // Convert to SchemaService format
        const now = new Date().toISOString();
        const id = requestData.id || `schema-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
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
        const existingSchema = Object.values(schemas).find(s => 
          s.metadata && s.metadata.said === schemaData.metadata.said
        );
        
        if (existingSchema) {
          res.statusCode = 409;
          res.end(JSON.stringify({ 
            error: 'Schema with this SAID already exists',
            said: schemaData.metadata.said
          }));
          return;
        }
        
        // Store the schema
        schemas[schemaData.metadata.id] = schemaData;
        
        if (!writeSchemas(schemas)) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to save schema' }));
          return;
        }

        console.log(`📥 Created schema: ${schemaData.metadata.name} (${schemaData.metadata.said})`);
        
        res.statusCode = 201;
        res.end(JSON.stringify({
          ...schemaData,
          oobi: `http://${req.headers.host}/oobi/${schemaData.metadata.said}`
        }));
      }).catch(error => {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid JSON: ' + error.message }));
      });
      return;
    }

    // POST /api/schemas/sync - Sync schemas from frontend localStorage
    if (method === 'POST' && pathname === '/api/schemas/sync') {
      parseJsonBody(req).then(frontendSchemas => {
        if (!writeSchemas(frontendSchemas)) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to sync schemas' }));
          return;
        }

        const count = Object.keys(frontendSchemas).length;
        console.log(`🔄 Synced ${count} schemas from frontend`);
        
        res.statusCode = 200;
        res.end(JSON.stringify({ 
          success: true, 
          synced: count,
          message: 'Schemas synced successfully'
        }));
      }).catch(error => {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid sync data: ' + error.message }));
      });
      return;
    }

    // If we get here, it's an unsupported API endpoint
    res.statusCode = 404;
    res.end(JSON.stringify({ 
      error: 'API endpoint not found',
      path: pathname,
      method: method,
      available: [
        'GET /api/schemas',
        'GET /api/schemas/:id', 
        'POST /api/schemas',
        'POST /api/schemas/sync',
        'GET /oobi/:said'
      ]
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

export default schemaApiHandler;