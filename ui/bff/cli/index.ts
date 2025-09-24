#!/usr/bin/env bun

import { intro, outro, text, select, confirm, spinner, isCancel, cancel, log, group } from '@clack/prompts';
import { aidClient } from '../aids/client';
import { KeriaClient } from '../aids/impl/KeriaClient';
import type { GenerateOOBIRequest, CreateAIDRequest, SignRequest, VerifyRequest, RotateRequest, EventsRequest } from '../aids/types';

// CLI Configuration
const DEFAULT_SERVICE_URL = 'http://localhost:3001';
const CLI_TITLE = '🆔 KERI AID CLI Tool';

// Global CLI state
let client = aidClient(DEFAULT_SERVICE_URL);
let currentBran: string | undefined;

async function main() {
  intro(CLI_TITLE);

  // Initialize bran
  await initializeBran();

  // Main menu loop
  let shouldContinue = true;
  while (shouldContinue) {
    const action = await select({
      message: 'What would you like to do?',
      options: [
        { value: 'create', label: '🆔 Create AID', hint: 'Create a new Autonomic Identifier' },
        { value: 'oobi', label: '🔗 Generate OOBI', hint: 'Generate OOBI for credential issuance' },
        { value: 'sign', label: '✍️ Sign Message', hint: 'Sign a text message with an AID' },
        { value: 'verify', label: '🔍 Verify Signature', hint: 'Verify a message signature' },
        { value: 'rotate', label: '🔄 Rotate Keys', hint: 'Rotate AID keys (transferable only)' },
        { value: 'events', label: '📋 List Events', hint: 'Show Key Event Log for an AID' },
        { value: 'settings', label: '⚙️ Settings', hint: 'Configure CLI settings' },
        { value: 'exit', label: '👋 Exit', hint: 'Exit the CLI' }
      ]
    });

    if (isCancel(action)) {
      shouldContinue = false;
      continue;
    }

    try {
      switch (action) {
        case 'create':
          await handleCreateAID();
          break;
        case 'oobi':
          await handleGenerateOOBI();
          break;
        case 'sign':
          await handleSignMessage();
          break;
        case 'verify':
          await handleVerifySignature();
          break;
        case 'rotate':
          await handleRotateKeys();
          break;
        case 'events':
          await handleListEvents();
          break;
        case 'settings':
          await handleSettings();
          break;
        case 'exit':
          shouldContinue = false;
          break;
      }
    } catch (error: any) {
      log.error(error.message);
    }
  }

  outro('👋 Thanks for using KERI AID CLI!');
}

async function initializeBran() {
  const s = spinner();
  s.start('Initializing CLI...');

  // Generate or reuse bran
  if (!currentBran) {
    currentBran = KeriaClient.generateBran();
    client.setBran(currentBran);
  }

  s.stop(`✅ Initialized with bran: ${currentBran.substring(0, 8)}...`);
}

async function handleCreateAID() {
  log.info('Creating a new Autonomic Identifier');

  const result = await group(
    {
      alias: () => text({
        message: 'AID alias (name):',
        placeholder: 'my-aid',
        validate: (value) => {
          if (!value) return 'Alias is required';
          if (value.length < 3) return 'Alias must be at least 3 characters';
          if (!/^[a-zA-Z0-9-_]+$/.test(value)) return 'Alias can only contain letters, numbers, hyphens and underscores';
        }
      }),

      transferable: () => confirm({
        message: 'Make AID transferable?',
        initialValue: true
      }),

      useWitnesses: () => confirm({
        message: 'Use witnesses?',
        initialValue: false
      })
    },
    {
      onCancel: () => {
        cancel('Operation cancelled.');
        return;
      }
    }
  );

  if (!result) return;

  const request: CreateAIDRequest = {
    alias: result.alias,
    transferable: result.transferable
  };

  // Add witnesses if requested
  if (result.useWitnesses) {
    // Use default witnesses from template
    request.wits = [
      'BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha', // Wan
      'BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM'  // Wes
    ];
  }

  const s = spinner();
  s.start('Creating AID...');

  try {
    const response = await client.createAID(request);
    s.stop('✅ AID created successfully!');

    log.success(`AID Details:
  📋 Alias: ${response.aid.alias}
  🆔 Prefix: ${response.aid.prefix}
  🔄 Transferable: ${response.aid.transferable ? 'Yes' : 'No'}
  📊 State: ${JSON.stringify(response.aid.state, null, 2)}`);
  } catch (error: any) {
    s.stop('❌ Failed to create AID');
    throw error;
  }
}

async function handleGenerateOOBI() {
  log.info('Generating OOBI for credential issuance');

  const result = await group(
    {
      alias: () => text({
        message: 'AID alias:',
        placeholder: 'my-aid',
        validate: (value) => {
          if (!value) return 'Alias is required';
        }
      }),

      role: () => select({
        message: 'OOBI role:',
        options: [
          { value: 'witness', label: 'Witness', hint: 'Standard OOBI via witnesses (recommended)' },
          { value: 'controller', label: 'Controller', hint: 'Direct controller OOBI (requires HTTP endpoint)' }
        ],
        initialValue: 'witness'
      })
    },
    {
      onCancel: () => {
        cancel('Operation cancelled.');
        return;
      }
    }
  );

  if (!result) return;

  const request: GenerateOOBIRequest = {
    alias: result.alias,
    role: result.role as 'witness' | 'controller'
  };

  const s = spinner();
  s.start('Generating OOBI...');

  try {
    const response = await client.generateOobi(request);
    s.stop('✅ OOBI generated successfully!');

    log.success(`OOBI Details:
  📋 Alias: ${response.alias}
  🆔 Prefix: ${response.prefix}
  🔗 OOBI URL: ${response.oobi}

📖 Next steps for credential issuance:
  1. Share this OOBI with the other party (issuer/holder)
  2. Both parties resolve each other's OOBIs
  3. Create credential registry
  4. Issue ACDC using IPEX protocol`);
  } catch (error: any) {
    s.stop('❌ Failed to generate OOBI');
    throw error;
  }
}

async function handleSignMessage() {
  log.info('Signing a message with an AID');

  const result = await group(
    {
      alias: () => text({
        message: 'AID alias:',
        placeholder: 'my-aid',
        validate: (value) => {
          if (!value) return 'Alias is required';
        }
      }),

      message: () => text({
        message: 'Message to sign:',
        placeholder: 'Hello World',
        validate: (value) => {
          if (!value) return 'Message is required';
        }
      })
    },
    {
      onCancel: () => {
        cancel('Operation cancelled.');
        return;
      }
    }
  );

  if (!result) return;

  const request: SignRequest = {
    alias: result.alias,
    text: result.message
  };

  const s = spinner();
  s.start('Signing message...');

  try {
    const response = await client.signMessage(request);
    s.stop('✅ Message signed successfully!');

    log.success(`Signature Details:
  📋 AID Alias: ${result.alias}
  💬 Message: "${result.message}"
  ✍️ Signature: ${response.signature.substring(0, 80)}...
  
📝 Note: In KERI, signing creates an interaction event that commits to the message data.`);
  } catch (error: any) {
    s.stop('❌ Failed to sign message');
    throw error;
  }
}

async function handleVerifySignature() {
  log.info('Verifying a message signature');

  const result = await group(
    {
      alias: () => text({
        message: 'AID alias:',
        placeholder: 'my-aid',
        validate: (value) => {
          if (!value) return 'Alias is required';
        }
      }),

      message: () => text({
        message: 'Original message:',
        placeholder: 'Hello World',
        validate: (value) => {
          if (!value) return 'Message is required';
        }
      }),

      signature: () => text({
        message: 'Signature to verify:',
        placeholder: '{"event":"...", "sigs":...}',
        validate: (value) => {
          if (!value) return 'Signature is required';
        }
      })
    },
    {
      onCancel: () => {
        cancel('Operation cancelled.');
        return;
      }
    }
  );

  if (!result) return;

  const request: VerifyRequest = {
    alias: result.alias,
    text: result.message,
    signature: result.signature
  };

  const s = spinner();
  s.start('Verifying signature...');

  try {
    const response = await client.verifySignature(request);
    s.stop('✅ Signature verification completed!');

    if (response.valid) {
      log.success(`✅ Signature is VALID
  📋 AID Alias: ${result.alias}
  🆔 Prefix: ${response.prefix}
  💬 Message: "${result.message}"`);
    } else {
      log.error(`❌ Signature is INVALID
  📋 AID Alias: ${result.alias}
  🆔 Prefix: ${response.prefix}
  💬 Message: "${result.message}"`);
    }
  } catch (error: any) {
    s.stop('❌ Failed to verify signature');
    throw error;
  }
}

async function handleRotateKeys() {
  log.info('Rotating AID keys (transferable AIDs only)');

  const result = await group(
    {
      alias: () => text({
        message: 'AID alias:',
        placeholder: 'my-aid',
        validate: (value) => {
          if (!value) return 'Alias is required';
        }
      }),

      confirm: () => confirm({
        message: 'Are you sure you want to rotate keys? This cannot be undone.',
        initialValue: false
      })
    },
    {
      onCancel: () => {
        cancel('Operation cancelled.');
        return;
      }
    }
  );

  if (!result || !result.confirm) {
    log.info('Key rotation cancelled.');
    return;
  }

  const request: RotateRequest = {
    alias: result.alias
  };

  const s = spinner();
  s.start('Rotating keys...');

  try {
    const response = await client.rotateKeys(request);
    s.stop('✅ Keys rotated successfully!');

    log.success(`Key Rotation Details:
  📋 Alias: ${response.alias}
  🆔 Prefix: ${response.prefix}
  🔢 New Sequence: ${response.sequence}
  🔑 New Public Key: ${response.publicKey.substring(0, 40)}...

⚠️ Important: Update any systems that reference the old keys.`);
  } catch (error: any) {
    s.stop('❌ Failed to rotate keys');
    throw error;
  }
}

async function handleListEvents() {
  log.info('Listing Key Event Log (KEL) for an AID');

  const result = await group(
    {
      alias: () => text({
        message: 'AID alias:',
        placeholder: 'my-aid',
        validate: (value) => {
          if (!value) return 'Alias is required';
        }
      }),

      limit: () => text({
        message: 'Number of events to show:',
        placeholder: '10',
        initialValue: '10',
        validate: (value) => {
          const num = parseInt(value);
          if (isNaN(num) || num < 1 || num > 100) {
            return 'Must be a number between 1 and 100';
          }
        }
      })
    },
    {
      onCancel: () => {
        cancel('Operation cancelled.');
        return;
      }
    }
  );

  if (!result) return;

  const request: EventsRequest = {
    alias: result.alias,
    limit: parseInt(result.limit),
    offset: 0
  };

  const s = spinner();
  s.start('Retrieving events...');

  try {
    const response = await client.listEvents(request);
    s.stop('✅ Events retrieved successfully!');

    log.success(`Event Log for ${response.alias}:
  🆔 Prefix: ${response.prefix}
  📊 Total Events: ${response.total}
  📋 Showing: ${response.events.length} events

Events:`);

    response.events.forEach((event, index) => {
      console.log(`
  ${index + 1}. Event #${event.sequence}
     Type: ${event.eventType}
     Digest: ${event.digest}
     Timestamp: ${event.timestamp || 'N/A'}
     Signatures: ${event.signatures.length}`);
    });

  } catch (error: any) {
    s.stop('❌ Failed to retrieve events');
    throw error;
  }
}

async function handleSettings() {
  log.info('CLI Settings');

  const action = await select({
    message: 'What would you like to configure?',
    options: [
      { value: 'service', label: '🌐 Service URL', hint: `Current: ${DEFAULT_SERVICE_URL}` },
      { value: 'bran', label: '🔑 Generate New Bran', hint: `Current: ${currentBran?.substring(0, 8)}...` },
      { value: 'status', label: '📊 Show Status', hint: 'Display current configuration' }
    ]
  });

  if (isCancel(action)) return;

  switch (action) {
    case 'service':
      const newUrl = await text({
        message: 'New service URL:',
        placeholder: DEFAULT_SERVICE_URL,
        initialValue: DEFAULT_SERVICE_URL
      });

      if (!isCancel(newUrl)) {
        client = aidClient(newUrl);
        if (currentBran) {
          client.setBran(currentBran);
        }
        log.success(`Service URL updated to: ${newUrl}`);
      }
      break;

    case 'bran':
      const confirmBran = await confirm({
        message: 'Generate a new bran? This will create a new session.',
        initialValue: false
      });

      if (confirmBran) {
        currentBran = KeriaClient.generateBran();
        client.setBran(currentBran);
        log.success(`New bran generated: ${currentBran.substring(0, 8)}...`);
      }
      break;

    case 'status':
      log.info(`Current Configuration:
  🌐 Service URL: ${DEFAULT_SERVICE_URL}
  🔑 Bran: ${currentBran?.substring(0, 8)}...
  📦 Client: ${client ? 'Connected' : 'Not connected'}`);
      break;
  }
}

// Run the CLI
if (import.meta.main) {
  main().catch(console.error);
}