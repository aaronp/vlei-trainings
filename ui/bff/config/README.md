# KERI Configuration System

This directory contains the KERI template configuration system that provides secure defaults for KERI identifier inception with proper witness setup.

## Files

- `keri-template.ts` - Main configuration template with KERI defaults
- `keri-example.env` - Example environment variables for customization
- `README.md` - This documentation

## Configuration

### Default Configuration

The system uses the following defaults based on the KERI documentation (`101_45_Connecting_controllers.md`):

```typescript
{
  transferable: true,
  wits: [
    "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha", // Wan
    "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM"  // Wes
  ],
  toad: 1,    // Threshold of acceptable duplicity 
  icount: 1,  // Initial key count
  ncount: 1,  // Next key count (pre-rotation)
  isith: "1", // Initial signing threshold
  nsith: "1"  // Next signing threshold
}
```

### Environment Variable Overrides

You can customize the configuration using environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `KERI_TRANSFERABLE` | Whether AIDs are transferable | `true` or `false` |
| `KERI_TOAD` | Threshold of acceptable duplicity | `1` |
| `KERI_ICOUNT` | Initial key count | `1` |
| `KERI_NCOUNT` | Next key count | `1` |
| `KERI_ISITH` | Initial signing threshold | `"1"` |
| `KERI_NSITH` | Next signing threshold | `"1"` |
| `KERI_WITNESS_IDS` | JSON array of witness IDs | `["BBil...","BLsk..."]` |
| `KERI_WITNESSES` | Full witness configuration | See example below |

### Example Environment Setup

```bash
# Basic setup
export KERI_TRANSFERABLE=true
export KERI_TOAD=1
export KERI_WITNESS_IDS='["BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha"]'

# Full witness setup
export KERI_WITNESSES='[
  {
    "id": "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
    "url": "http://witness-demo:5642", 
    "name": "Wan"
  }
]'
```

### API Request Override

Individual API requests can still override configuration:

```bash
curl -X POST http://localhost:3001/aids \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "my-aid",
    "transferable": false,
    "wits": ["custom-witness-id"],
    "icount": 2,
    "ncount": 2
  }'
```

## Usage in Code

The configuration system is automatically used by the AIDS creation process:

```typescript
import { getValidatedIdentifierConfig } from '../config/keri-template';

// Get validated configuration with environment overrides
const config = getValidatedIdentifierConfig();

// Use in AID creation
const result = await client.identifiers().create(alias, config);
```

## Validation

The system includes validation to prevent common configuration errors:

- TOAD cannot exceed witness count
- Signing thresholds cannot exceed key counts  
- Warns about potential security issues

## Witness Network

The default witnesses are from the KERI training documentation:

- **Wan** (`BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha`) - Port 5642
- **Wes** (`BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM`) - Port 5643  
- **Wil** (`BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX`) - Port 5644

These provide redundant witness services for production-ready KERI operations.