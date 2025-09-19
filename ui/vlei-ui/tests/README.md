# Integration Tests for VLEI UI Services

This directory contains integration tests that demonstrate the complete VLEI workflow using real services without mocks.

## Prerequisites

### 1. Running KERIA Instance

The tests require a running KERIA instance. Start it using Docker Compose:

```bash
# From the project root
cd /Users/aaron/dev/sandbox/vlei-trainings
docker-compose up -d
```

Verify KERIA is running:
```bash
curl http://localhost:3901/status
```

### 2. Install Test Dependencies

```bash
npm install
```

## Running the Tests

### Run All Integration Tests
```bash
npm run test:integration
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run with Verbose Output
```bash
npx vitest run --config vitest.integration.config.ts --reporter=verbose
```

## Test Configuration

The tests use environment variables for configuration:

```bash
# Optional - defaults are provided
export KERIA_ADMIN_URL="http://localhost:3901"
export KERIA_BOOT_URL="http://localhost:3903"
export KERIA_TEST_PASSCODE="test-integration-passcode-123"
```

## What the Tests Demonstrate

### 1. AID Management (`services.integration.test.ts`)
- ✅ Creating a new AID (Autonomous Identifier)
- ✅ Adding end roles to the AID
- ✅ Verifying AID properties and structure

### 2. Registry Management
- ✅ Creating a credential registry
- ✅ Listing registries for an AID
- ✅ Registry identifier validation

### 3. Schema Management
- ✅ Registering VLEI schemas
- ✅ Generating schema OOBI URLs
- ✅ Schema availability verification

### 4. VLEI Credential Issuance
- ✅ Issuing a complete VLEI credential
- ✅ Credential data validation
- ✅ Credential retrieval and verification
- ✅ Listing issued credentials

### 5. Full Workflow Integration
- ✅ End-to-end VLEI issuance process
- ✅ Service integration validation
- ✅ Complete workflow verification

## Test Data

The tests create:
- **AID**: `test-aid-{timestamp}` 
- **Registry**: `test-registry-{timestamp}`
- **VLEI Credential**: Test corporation with LEI `TEST123456789012345678`

## Cleanup

The tests don't automatically clean up created data to allow for inspection. To manually clean up:

1. **Reset KERIA**: Stop and restart the Docker containers
2. **View Test Data**: Use the KERIA admin interface or API to inspect created AIDs and credentials

## Troubleshooting

### Common Issues

**Connection Failed**
```
Error: Failed to connect to KERIA
```
- Ensure KERIA is running: `docker-compose ps`
- Check KERIA logs: `docker-compose logs keria`
- Verify port availability: `netstat -tulpn | grep 3901`

**Operation Timeout**
```
Error: Operation timed out
```
- Increase timeouts in `setup.integration.ts`
- Check KERIA performance: `docker stats`
- Verify witness connectivity

**Schema Not Found**
```
Error: Schema not available
```
- Ensure schema service is running
- Check schema registration process
- Verify OOBI resolution

### Debug Mode

Run tests with debug logging:
```bash
DEBUG=vlei:* npm run test:integration
```

## Integration with CI/CD

Example GitHub Actions workflow:

```yaml
name: Integration Tests
on: [push, pull_request]
jobs:
  integration:
    runs-on: ubuntu-latest
    services:
      keria:
        image: gleif/keria:0.3.0
        ports:
          - 3901:3901
          - 3902:3902  
          - 3903:3903
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration
```

## Contributing

When adding new integration tests:

1. **Follow naming convention**: `*.integration.test.ts`
2. **Use real services**: No mocks or stubs
3. **Include cleanup**: Document any persistent changes
4. **Add documentation**: Update this README for new test scenarios
5. **Test timeouts**: Use appropriate timeouts for real service calls

## Related Documentation

- [KERIA Documentation](../jupyter/notebooks/)
- [VLEI Schema Specification](../markdown/)
- [Service Architecture](../src/services/)