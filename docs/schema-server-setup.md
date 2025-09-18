# Schema Server Setup for VLEI UI

This guide explains how to set up schema serving for custom schemas in the VLEI UI application.

## The Problem

When creating custom schemas in the VLEI UI, you may encounter this error:

```
Credential schema [SCHEMA_SAID] not found. It must be loaded with data oobi before issuing credentials
```

This happens because KERIA requires schemas to be available via OOBI (Out-of-Band Introduction) resolution before it can issue credentials using those schemas.

## Understanding Schema Resolution

### How KERIA Resolves Schemas

1. **OOBI Resolution**: KERIA tries to fetch schema data from an HTTP endpoint
2. **Schema Server**: A service that serves schema data at URLs like `http://server:port/oobi/[SCHEMA_SAID]`
3. **Schema Caching**: Once resolved, KERIA caches the schema for future use

### Demo vs Production

- **Demo Environment**: Schemas are created in browser localStorage but not served via HTTP
- **Production Environment**: Schemas are deployed to proper schema servers

## Solutions

### Option 1: Use Pre-existing Schemas (Recommended for Demo)

The easiest approach is to use schemas that are already available in your KERIA instance:

1. Check what schemas are already loaded in KERIA
2. Use those schemas instead of creating new ones
3. These schemas will already be resolved and cached

### Option 2: Set Up a Local Schema Server

For development and testing with custom schemas:

#### Simple Node.js Schema Server

Create a simple HTTP server that serves your schemas:

```javascript
// schema-server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Store for schemas (in production, use a database)
const schemas = new Map();

// Register a schema
app.post('/schemas', (req, res) => {
  const { said, schema } = req.body;
  schemas.set(said, schema);
  res.json({ success: true, said });
});

// Serve schema via OOBI
app.get('/oobi/:said', (req, res) => {
  const schema = schemas.get(req.params.said);
  if (!schema) {
    return res.status(404).json({ error: 'Schema not found' });
  }
  res.json(schema);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Schema server running on http://localhost:${PORT}`);
});
```

#### Running the Schema Server

1. Save the code above as `schema-server.js`
2. Install dependencies: `npm install express cors`
3. Run: `node schema-server.js`
4. The server will be available at `http://localhost:3001`

#### Configuring VLEI UI

Update the schema OOBI URL in the VLEI UI to point to your local server:

```typescript
// In IssuerWizard.tsx
const schemaOOBI = `http://localhost:3001/oobi/${state.schema.said}`;
```

### Option 3: Use Docker-based Schema Server

For a more robust development setup, use Docker:

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "schema-server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  schema-server:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
    volumes:
      - ./schemas:/app/data
```

### Option 4: Production Schema Server

For production environments:

1. **Deploy to cloud service** (AWS, Azure, GCP)
2. **Use proper database** for schema storage
3. **Implement authentication** and access controls
4. **Add monitoring** and logging
5. **Use HTTPS** for all communications

## Integration with VLEI UI

### Automatic Schema Registration

Modify the SchemaManager to automatically register schemas with your server:

```typescript
// In SchemaManager.tsx
const handleCreateSchema = async () => {
  // ... existing schema creation code ...
  
  // Register with local schema server
  try {
    await fetch('http://localhost:3001/schemas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        said: saider.qb64,
        schema: saidifiedSchema
      })
    });
    console.log('Schema registered with local server');
  } catch (error) {
    console.warn('Failed to register schema with local server:', error);
  }
};
```

### Environment Configuration

Use environment variables to configure schema server URLs:

```typescript
// In environment configuration
const SCHEMA_SERVER_URL = process.env.VITE_SCHEMA_SERVER_URL || 'http://localhost:3001';
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your schema server includes CORS headers
2. **Schema Not Found**: Verify the schema is properly registered
3. **Network Issues**: Check that the schema server is accessible from KERIA
4. **HTTPS Requirements**: Some environments require HTTPS for all communications

### Debugging Tips

1. **Check KERIA logs** for OOBI resolution attempts
2. **Verify schema server** is returning proper JSON
3. **Test OOBI URLs manually** with curl or browser
4. **Check network connectivity** between KERIA and schema server

### Error Messages

- `Schema not found`: Schema isn't registered or server is down
- `OOBI resolution failed`: Network or server configuration issue
- `Invalid schema format`: Schema structure is incorrect

## Best Practices

1. **Version Control**: Keep schema definitions in version control
2. **Schema Validation**: Validate schema structure before deployment
3. **Backup**: Regularly backup schema data
4. **Documentation**: Document schema purposes and structures
5. **Testing**: Test schema resolution before production deployment

## Example Workflow

1. **Create Schema** in VLEI UI
2. **Register with Server** (automatically or manually)
3. **Test Resolution** by attempting OOBI fetch
4. **Issue Credentials** using the schema
5. **Monitor Usage** and performance

This setup enables full custom schema functionality in your VLEI deployment!