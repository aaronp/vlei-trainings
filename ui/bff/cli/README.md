# KERI AID CLI Tool

An interactive command-line interface for managing KERI Autonomic Identifiers (AIDs) and credential issuance workflows.

## Features

🆔 **AID Management**
- Create new Autonomic Identifiers (transferable/non-transferable)
- Configure witnesses for enhanced security
- Key rotation for transferable AIDs

🔗 **Credential Issuance**
- Generate OOBIs (Out-of-Band Introductions) for credential workflows
- Support for both witness and controller roles
- Integration with ACDC (Authentic Chained Data Container) issuance

✍️ **Digital Signatures**
- Sign messages using KERI interaction events
- Verify signatures with cryptographic integrity
- Support for KERI's authentic signature model

📋 **Event Management**
- View Key Event Log (KEL) entries
- Paginated event browsing
- Detailed event information display

⚙️ **Configuration**
- Flexible service URL configuration
- Bran (cryptographic seed) management
- Session persistence across operations

## Requirements

- [Bun](https://bun.sh/) runtime
- KERIA service running (default: `http://localhost:3001`)
- KERI witness network (for witness-based operations)

## Installation

```bash
# Navigate to the CLI directory
cd ui/bff/cli

# Install dependencies (if not already installed in parent)
bun install

# Run the CLI
bun start
```

## Usage

### Quick Start

```bash
# Start the interactive CLI
bun run index.ts

# Or make it executable and run directly
chmod +x index.ts
./index.ts
```

### CLI Menu

The CLI provides an interactive menu with the following options:

- **🆔 Create AID**: Create a new Autonomic Identifier
- **🔗 Generate OOBI**: Generate OOBI for credential issuance
- **✍️ Sign Message**: Sign a text message with an AID
- **🔍 Verify Signature**: Verify a message signature
- **🔄 Rotate Keys**: Rotate AID keys (transferable only)
- **📋 List Events**: Show Key Event Log for an AID
- **⚙️ Settings**: Configure CLI settings
- **👋 Exit**: Exit the CLI

### Example Workflow: Credential Issuance Setup

1. **Create an AID** (for issuer or holder):
   ```
   Select: 🆔 Create AID
   - Enter alias: "issuer-aid"
   - Make transferable: Yes
   - Use witnesses: Yes (recommended)
   ```

2. **Generate OOBI** (first step in credential issuance):
   ```
   Select: 🔗 Generate OOBI
   - AID alias: "issuer-aid"
   - Role: "witness" (recommended)
   - Share the generated OOBI URL with other parties
   ```

3. **Sign Messages** (for attestations):
   ```
   Select: ✍️ Sign Message
   - AID alias: "issuer-aid"
   - Message: "Credential attestation data"
   ```

## Configuration

### Service URL
The CLI connects to a KERIA service. Configure the URL in settings:
- Default: `http://localhost:3001`
- Change via: ⚙️ Settings → 🌐 Service URL

### Bran Management
The CLI uses a cryptographic seed (bran) for session management:
- Auto-generated on first run
- Persistent across CLI sessions
- Regenerate via: ⚙️ Settings → 🔑 Generate New Bran

## Integration with ACDC Issuance

This CLI implements the first step of the ACDC (Authentic Chained Data Container) credential issuance workflow as documented in `101_65_ACDC_Issuance.md`:

1. **✅ Generate OOBI** (implemented in CLI)
2. **Next**: Resolve OOBIs between parties
3. **Next**: Create credential registry
4. **Next**: Issue ACDC using IPEX protocol

## Error Handling

The CLI includes comprehensive error handling:
- Network connectivity issues
- Invalid AID aliases
- Key rotation failures
- Signature verification errors
- User input validation

## Development

### Project Structure

```
cli/
├── index.ts          # Main CLI application
├── package.json      # CLI-specific package configuration
└── README.md         # This documentation
```

### Dependencies

- `@clack/prompts`: Interactive CLI prompts
- `../aids/client`: AIDS client integration
- Standard Bun runtime libraries

### Running in Development

```bash
# Watch mode for development
bun run dev

# Standard run
bun start
```

## API Integration

The CLI integrates with the KERI AID API:

- **POST /aids**: Create AID
- **POST /aids/oobi**: Generate OOBI
- **POST /aids/sign**: Sign message
- **POST /aids/verify**: Verify signature
- **POST /aids/rotate-key**: Rotate keys
- **GET /aids/events**: List events

## Security Considerations

- Bran (cryptographic seeds) are generated securely
- No private keys are stored in the CLI
- All cryptographic operations are performed by KERIA
- Session management follows KERI best practices

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure KERIA service is running on the configured URL
   - Check service URL in settings

2. **AID Not Found**
   - Verify the AID alias is correct
   - Ensure the AID was created in the same session (bran)

3. **Key Rotation Failed**
   - Confirm the AID is transferable
   - Check that the AID exists and is accessible

4. **OOBI Generation Failed**
   - Verify witnesses are configured and running
   - For controller role, ensure HTTP endpoints are set up

### Support

For issues related to:
- KERI protocol: See KERI documentation
- KERIA service: Check KERIA logs
- CLI functionality: Review error messages and CLI status