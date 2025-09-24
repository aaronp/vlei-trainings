import { Elysia } from 'elysia';
import crypto from 'crypto';

export interface BranConfig {
  mode: 'simple' | 'protected';
  salt?: string;
  passcode?: string;
}

export interface BranContext {
  bran: string | null;
  isNewBran: boolean;
}

/**
 * Generates a random bran (21 character string)
 * Following the same pattern as KeriaClient
 */
function generateBran(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 21; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Protects a bran using HMAC with the configured salt and passcode
 */
function protectBran(bran: string, config: BranConfig): string {
  if (!config.salt || !config.passcode) {
    throw new Error('Protected mode requires both KERIA_KEYSTORE_SALT and KERIA_KEYSTORE_PASSCODE');
  }

  const hmac = crypto.createHmac('sha256', config.passcode);
  hmac.update(bran + config.salt);
  const signature = hmac.digest('base64url');

  // Return bran with signature
  return `${bran}.${signature}`;
}

/**
 * Validates and extracts a protected bran
 */
function validateProtectedBran(protectedBran: string, config: BranConfig): string | null {
  if (!config.salt || !config.passcode) {
    throw new Error('Protected mode requires both KERIA_KEYSTORE_SALT and KERIA_KEYSTORE_PASSCODE');
  }

  const parts = protectedBran.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [bran, signature] = parts;

  // Verify signature
  const hmac = crypto.createHmac('sha256', config.passcode);
  hmac.update(bran + config.salt);
  const expectedSignature = hmac.digest('base64url');

  if (signature === expectedSignature) {
    return bran;
  }

  return null;
}

/**
 * Gets the bran configuration from environment variables
 */
function getBranConfig(): BranConfig {
  return {
    mode: (process.env.KERIA_BRAN_MODE as 'simple' | 'protected') || 'simple',
    salt: process.env.KERIA_KEYSTORE_SALT,
    passcode: process.env.KERIA_KEYSTORE_PASSCODE
  };
}

/**
 * Middleware that handles bran extraction and generation
 */
export const branContext = new Elysia({ name: 'branMiddleware' })
  .derive({ as: "global" }, ({ headers, set }) => {
    console.log('🔧 [BRAN] Middleware derive function called');
    const config = getBranConfig();
    const headerBran = headers['x-keria-bran'];

    let bran: string | null = null;
    let isNewBran = false;

    if (headerBran) {
      // Try to use the provided bran
      if (config.mode === 'protected') {
        try {
          bran = validateProtectedBran(headerBran, config);
          if (!bran) {
            console.warn('Invalid protected bran provided, generating new one');
          }
        } catch (error) {
          console.error('Error validating protected bran:', error);
        }
      } else {
        // Simple mode - use bran as-is
        bran = headerBran;
      }
    }

    // Generate new bran if needed
    if (!bran) {
      bran = generateBran();
      isNewBran = true;
      console.log(`🔑 [BRAN] Generated new bran: ${bran.substring(0, 8)}...`);
    } else {
      console.log(`🔑 [BRAN] Using existing bran: ${bran.substring(0, 8)}...`);
    }

    // Set response header with bran
    let responseBran = bran;
    try {
      responseBran = config.mode === 'protected' ? protectBran(bran, config) : bran;
    } catch (error: any) {
      console.warn(`Failed to protect bran: ${error.message}, using simple mode`);
      responseBran = bran;
    }
    set.headers['x-keria-bran'] = responseBran;

    const result = {
      bran,
      isNewBran: isNewBran
    };
    console.log('🔧 [BRAN] Returning from derive:', result);
    return result;
  });