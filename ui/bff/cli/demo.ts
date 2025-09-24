#!/usr/bin/env bun

/**
 * CLI Demo Script
 * 
 * This script demonstrates the functionality of the KERI AID CLI tool
 * by showing the available commands and their structure.
 */

import { intro, outro, log } from '@clack/prompts';

async function demo() {
  intro('🎬 KERI AID CLI Demo');

  log.info('This CLI provides the following functionality:');

  console.log(`
📋 Available Commands:

🆔 Create AID
   - Create new Autonomic Identifiers
   - Configure transferability and witnesses
   - Integration with KERI template configuration

🔗 Generate OOBI (Out-of-Band Introduction)
   - First step in credential issuance workflow
   - Support for witness and controller roles
   - Generates shareable URLs for AID discovery

✍️ Sign Message
   - Sign text messages using KERI interaction events
   - Cryptographic commitment to message data
   - Returns KERI-compliant signature format

🔍 Verify Signature
   - Verify message signatures against AIDs
   - Cryptographic integrity validation
   - Support for KERI event-based signatures

🔄 Rotate Keys
   - Rotate keys for transferable AIDs
   - Secure key lifecycle management
   - Maintains AID continuity through rotations

📋 List Events
   - View Key Event Log (KEL) entries
   - Paginated browsing of AID history
   - Detailed event information display

⚙️ Settings
   - Configure service URL
   - Manage bran (cryptographic seed)
   - View current configuration status

💻 Usage Examples:

# Run the interactive CLI
bun run cli/index.ts

# Or use the npm script
bun run cli

# Or use the launcher script
./cli.sh

🔗 Integration with ACDC Credential Issuance:

This CLI implements the first step of the ACDC issuance workflow:

1. ✅ Create AIDs for issuer and holder
2. ✅ Generate OOBIs for each AID 
3. → Share OOBIs between parties
4. → Resolve OOBIs to establish connection
5. → Create credential registry
6. → Issue ACDC using IPEX protocol

🏗️ Architecture:

CLI ──→ AIDS Client ──→ AIDS API ──→ KERIA ──→ KERI Network
    @clack/prompts    HTTP/REST    SignifyClient    Witnesses

📚 Documentation:

- CLI README: cli/README.md
- API Documentation: Swagger UI when running server
- KERI Documentation: External KERI specs
- ACDC Issuance: markdown/101_65_ACDC_Issuance.md
`);

  outro('🚀 Ready to use the KERI AID CLI!');
}

if (import.meta.main) {
  demo().catch(console.error);
}