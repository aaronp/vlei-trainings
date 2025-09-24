/**
 * KERI Template Configuration
 * 
 * This file contains the default configuration template for KERI identifiers,
 * including witness setup as per the KERI documentation.
 * 
 * Based on the witness configuration from 101_45_Connecting_controllers.md
 */

export interface KeriWitnessConfig {
  id: string;
  url: string;
  name: string;
}

export interface KeriIdentifierConfig {
  transferable: boolean;
  wits: string[];
  toad: number;
  icount: number;
  ncount: number;
  isith: string;
  nsith: string;
}

/**
 * Default witness configuration from the KERI documentation
 * These are the witness nodes used in the training examples
 */
export const DEFAULT_WITNESSES: KeriWitnessConfig[] = [
  {
    id: "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
    url: "http://witness-demo:5642",
    name: "Wan"
  },
  {
    id: "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM", 
    url: "http://witness-demo:5643",
    name: "Wes"
  },
  {
    id: "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX",
    url: "http://witness-demo:5644", 
    name: "Wil"
  }
];

/**
 * Default identifier configuration template
 * This provides secure defaults for KERI identifier inception
 */
export const DEFAULT_IDENTIFIER_CONFIG: KeriIdentifierConfig = {
  transferable: true,
  wits: [
    "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
    "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM"
  ],
  toad: 1,  // Threshold of acceptable duplicity (1 out of 2 witnesses)
  icount: 1, // Initial key count
  ncount: 1, // Next key count (for pre-rotation)
  isith: "1", // Initial signing threshold
  nsith: "1"  // Next signing threshold
};

/**
 * Get witness configuration from environment variables or use defaults
 */
export function getWitnessConfig(): KeriWitnessConfig[] {
  const witnessEnv = process.env.KERI_WITNESSES;
  
  if (witnessEnv) {
    try {
      return JSON.parse(witnessEnv);
    } catch (error) {
      console.warn(`Failed to parse KERI_WITNESSES environment variable: ${error}`);
      console.warn('Falling back to default witness configuration');
    }
  }
  
  return DEFAULT_WITNESSES;
}

/**
 * Get identifier configuration from environment variables or use defaults
 * Merges environment overrides with default template
 */
export function getIdentifierConfig(): KeriIdentifierConfig {
  const witnesses = getWitnessConfig();
  const witnessIds = witnesses.map(w => w.id);
  
  // Base configuration with current witnesses
  const baseConfig: KeriIdentifierConfig = {
    ...DEFAULT_IDENTIFIER_CONFIG,
    wits: witnessIds.slice(0, 2), // Use first 2 witnesses by default
  };
  
  // Allow environment variable overrides
  const envOverrides: Partial<KeriIdentifierConfig> = {};
  
  if (process.env.KERI_TRANSFERABLE !== undefined) {
    envOverrides.transferable = process.env.KERI_TRANSFERABLE === 'true';
  }
  
  if (process.env.KERI_TOAD !== undefined) {
    envOverrides.toad = parseInt(process.env.KERI_TOAD, 10);
  }
  
  if (process.env.KERI_ICOUNT !== undefined) {
    envOverrides.icount = parseInt(process.env.KERI_ICOUNT, 10);
  }
  
  if (process.env.KERI_NCOUNT !== undefined) {
    envOverrides.ncount = parseInt(process.env.KERI_NCOUNT, 10);
  }
  
  if (process.env.KERI_ISITH !== undefined) {
    envOverrides.isith = process.env.KERI_ISITH;
  }
  
  if (process.env.KERI_NSITH !== undefined) {
    envOverrides.nsith = process.env.KERI_NSITH;
  }
  
  if (process.env.KERI_WITNESS_IDS !== undefined) {
    try {
      envOverrides.wits = JSON.parse(process.env.KERI_WITNESS_IDS);
    } catch (error) {
      console.warn(`Failed to parse KERI_WITNESS_IDS: ${error}`);
    }
  }
  
  return {
    ...baseConfig,
    ...envOverrides
  };
}

/**
 * Validate identifier configuration for common issues
 */
export function validateIdentifierConfig(config: KeriIdentifierConfig): void {
  if (config.toad > config.wits.length) {
    throw new Error(`TOAD (${config.toad}) cannot be greater than witness count (${config.wits.length})`);
  }
  
  if (config.toad < 1 && config.wits.length > 0) {
    console.warn(`TOAD is ${config.toad} but witnesses are configured. Consider setting TOAD >= 1 for witness protection`);
  }
  
  if (parseInt(config.isith) > config.icount) {
    throw new Error(`Initial signing threshold (${config.isith}) cannot be greater than initial key count (${config.icount})`);
  }
  
  if (parseInt(config.nsith) > config.ncount) {
    throw new Error(`Next signing threshold (${config.nsith}) cannot be greater than next key count (${config.ncount})`);
  }
}

/**
 * Get a validated identifier configuration ready for use
 */
export function getValidatedIdentifierConfig(): KeriIdentifierConfig {
  const config = getIdentifierConfig();
  validateIdentifierConfig(config);
  return config;
}