# Bran Management Configuration

This document describes the environment configuration options for persistent keystore management via bran (cryptographic seed) handling.

## Environment Variables

### Required Variables

- `KERIA_URL`: The URL of the KERIA agent (default: `http://localhost:3901`)
- `KERIA_BOOT_URL`: The boot URL of the KERIA agent (default: `http://localhost:3903`)
- `VLEI_SERVER_URL`: The URL of the vLEI server for schema OOBI resolution (default: `http://localhost:7723`)

### Bran Management Variables

#### `KERIA_BRAN_MODE` (optional)
Controls how brans are handled:
- `simple` (default): Brans are passed as-is in headers, no server-side protection
- `protected`: Brans are HMAC-signed with salt and passcode for additional security

#### `KERIA_KEYSTORE_SALT` (required for protected mode)
A random salt value used for HMAC signing of brans. Should be a long, random string.
Example: `0ABeuT2dErMrqFE5Dmrnc2Bq`

#### `KERIA_KEYSTORE_PASSCODE` (required for protected mode)
A secure passcode used for HMAC signing of brans. Should be a strong, randomly generated string.
Example: `xSLg286d4iWiRg2mzGYca`

## Configuration Examples

### Development (Simple Mode)
```bash
# Minimal configuration for development
KERIA_URL=http://localhost:3901
KERIA_BOOT_URL=http://localhost:3903
VLEI_SERVER_URL=http://localhost:7723
KERIA_BRAN_MODE=simple
```

### Production (Protected Mode)
```bash
# Secure configuration for production
KERIA_URL=https://keria.yourdomain.com
KERIA_BOOT_URL=https://keria.yourdomain.com:3903
VLEI_SERVER_URL=https://vlei.yourdomain.com
KERIA_BRAN_MODE=protected
KERIA_KEYSTORE_SALT=0ABeuT2dErMrqFE5Dmrnc2Bq123456
KERIA_KEYSTORE_PASSCODE=xSLg286d4iWiRg2mzGYca987654
```

## How It Works

### Simple Mode (default)
1. Client sends request without `x-keria-bran` header → Server generates new bran
2. Client sends request with `x-keria-bran` header → Server uses provided bran
3. Server always returns current bran in `x-keria-bran` response header
4. Client can persist bran between requests for keystore continuity

### Protected Mode
1. Same as simple mode, but:
2. Brans in headers are HMAC-signed: `{bran}.{signature}`
3. Server validates signature before using bran
4. Invalid signatures result in new bran generation
5. Provides protection against bran tampering

## Client Usage

### Basic Usage
```typescript
import { aidClient } from './aids/client';

// Start with no bran (server will generate one)
const client = aidClient('http://localhost:3001');

// Create AID - server returns bran in response
const result = await client.createAID({
  alias: 'my-first-aid'
});

console.log('Received bran:', result.bran);
// Client automatically stores the bran internally

// Subsequent requests use the same bran
const result2 = await client.createAID({
  alias: 'my-second-aid'
});
// Both AIDs will be in the same keystore
```

### Advanced Usage
```typescript
// Start with a specific bran
const existingBran = 'abcdef123456789012345';
const client = aidClient('http://localhost:3001', existingBran);

// Or set bran later
client.setBran('xyz789456123456789012');

// Get current bran
const currentBran = client.getBran();
```

## Migration from Ephemeral to Persistent

The implementation is backward compatible:
- Existing code without bran headers continues to work (ephemeral mode)
- New code can opt-in to persistence by handling bran headers
- No breaking changes to existing APIs

## Security Considerations

1. **Simple Mode**: Brans are transmitted in plaintext headers
   - Suitable for development and trusted networks
   - Consider HTTPS for production use

2. **Protected Mode**: Brans are HMAC-signed
   - Prevents tampering but doesn't encrypt the bran itself
   - Still requires HTTPS for full security
   - Salt and passcode must be kept secure

3. **Client-side Storage**: Clients are responsible for securely storing brans
   - Consider encrypted storage for sensitive applications
   - Clear brans from memory when no longer needed

## Troubleshooting

### "Protected mode requires both KERIA_KEYSTORE_SALT and KERIA_KEYSTORE_PASSCODE"
- Set both environment variables when using `KERIA_BRAN_MODE=protected`

### "Invalid protected bran provided, generating new one"
- The bran signature validation failed
- Check that salt and passcode match between client and server
- The bran may have been tampered with

### Keystores not persisting between requests
- Ensure client is storing and sending the bran header
- Check that the same bran is being used for related requests
- Verify no network middleware is stripping headers