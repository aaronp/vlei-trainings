# Signify-ts: Key Rotation

<div class="alert alert-primary">
<b>🎯 OBJECTIVE</b><hr>
This notebook demonstrates how to perform a single-signature key rotation for an Autonomic Identifier (AID) using the Signify-ts library. 
</ul>
</div>

## Introduction to Key Rotation with Signify-ts
Key rotation is a fundamental security practice in KERI. It involves changing the cryptographic keys associated with an AID while preserving the identifier itself. This allows an identity to remain stable and persistent over time, even as its underlying keys are updated for security reasons (e.g., to mitigate key compromise or to upgrade cryptographic algorithms).

In the KERIA/Signify architecture, the client (your application using Signify-ts) initiates and signs the rotation event. The KERIA agent then handles the dissemination of this event to witnesses and makes it available to other observers. This notebook illustrates the end-to-end process, showing how a rotation is performed by one client and observed by another.

## Controller and AID Setup

First, we set up the environment for our demonstration. This involves:
- Two `SignifyClient` instances:
    - `clientA` will act as the controller of the AID whose keys we will rotate.
    - `clientB` will act as a remote observer who knows about the AID and will track its key state changes.
- AID Creation: `clientA` creates a new AID (`aidA`) that is transferable (i.e., its keys can be rotated).
- OOBI Resolution: `clientB` resolves an Out-of-Band Introduction (OOBI) for `aidA` to establish contact and retrieve its initial Key Event Log (KEL).

<div class="alert alert-info">
<b>ℹ️ NOTE</b><hr>
This section utilizes utility functions (from <code>./scripts_ts/utils.ts</code>) to quickly establish the necessary preconditions for the key rotation demonstration. The detailed steps for client initialization, AID creation, and OOBI resolution are covered in previous notebooks.
</div>


```typescript
import { randomPasscode, RotateIdentifierArgs, SignifyClient} from 'npm:signify-ts';
import { 
         initializeAndConnectClient,
         createNewAID,
         addEndRoleForAID,
         generateOOBI,
         resolveOOBI,
         DEFAULT_IDENTIFIER_ARGS,
         DEFAULT_TIMEOUT_MS,
         ROLE_AGENT,
       } from './scripts_ts/utils.ts';

// clientA Client Setup
const clientABran = randomPasscode()
const clientAAidAlias = 'aidA'
const { client: clientA } = await initializeAndConnectClient(clientABran)
const { aid: aidA } = await createNewAID(clientA, clientAAidAlias, DEFAULT_IDENTIFIER_ARGS);
await addEndRoleForAID(clientA, clientAAidAlias, ROLE_AGENT);
const clientAOOBI = await generateOOBI(clientA, clientAAidAlias, ROLE_AGENT);

// clientB Client Setup and OOBI Resolution
const clientBBran = randomPasscode()
const { client: clientB } = await initializeAndConnectClient(clientBBran)
await resolveOOBI(clientB, clientAOOBI, clientAAidAlias);

console.log("Client and AID setup complete.");
console.log(`Client A created AID: ${aidA.i}`);
console.log(`Client B resolved OOBI for AID: ${aidA.i}`);

```

    Using Passcode (bran): AQ4u8qmZ6kYeLPE3HxDOL


    Client boot process initiated with KERIA agent.


      Client AID Prefix:  EOhraUqyDjnt1CBZxmyUX9WNYjRoIzH7xyMgViedH95g


      Agent AID Prefix:   ENsOA9wi6EGlMwuPjDiOvL9GgT10w1oMxBnzPxBrvbzJ


    Initiating AID inception for alias: aidA


    Successfully created AID with prefix: EOCHugj7bxSTRQ3Ii_tfdibzYrz5CNfq_817XOqZK7eA


    Assigning 'agent' role to KERIA Agent ENsOA9wi6EGlMwuPjDiOvL9GgT10w1oMxBnzPxBrvbzJ for AID alias aidA


    Successfully assigned 'agent' role for AID alias aidA.


    Generating OOBI for AID alias aidA with role agent


    Generated OOBI URL: http://keria:3902/oobi/EOCHugj7bxSTRQ3Ii_tfdibzYrz5CNfq_817XOqZK7eA/agent/ENsOA9wi6EGlMwuPjDiOvL9GgT10w1oMxBnzPxBrvbzJ


    Using Passcode (bran): BcPepRvzY8QgwNSiG_M95


    Client boot process initiated with KERIA agent.


      Client AID Prefix:  EE1zS3Nq3utLp-rqBDkjb4JSurGUp5ulSd-5t4XFNP_P


      Agent AID Prefix:   EEKaErmg46jkFX5HfNZafYg-2pWkCk4D5hL-9B-pFsq_


    Resolving OOBI URL: http://keria:3902/oobi/EOCHugj7bxSTRQ3Ii_tfdibzYrz5CNfq_817XOqZK7eA/agent/ENsOA9wi6EGlMwuPjDiOvL9GgT10w1oMxBnzPxBrvbzJ with alias aidA


    Successfully resolved OOBI URL. Response: OK


    Contact "aidA" added/updated.


    Client and AID setup complete.


    Client A created AID: EOCHugj7bxSTRQ3Ii_tfdibzYrz5CNfq_817XOqZK7eA


    Client B resolved OOBI for AID: EOCHugj7bxSTRQ3Ii_tfdibzYrz5CNfq_817XOqZK7eA


## Initial State Verification

Before performing the rotation, let's verify that both `clientA` (the controller) and `clientB` (the observer) have a consistent view of the AID's key state. We can do this by fetching the key state from each client and comparing their sequence numbers (`s`).

The `client.keyStates().get()` method retrieves the key state for a given AID prefix from the client's local KEL copy.


```typescript
// Get the key state from the local client (clientA)
let keystateA_before = (await clientA.keyStates().get(aidA.i))[0];

// Get the key state from the remote observer client (clientB)
let keystateB_before = (await clientB.keyStates().get(aidA.i))[0];

// Compare the sequence numbers to ensure they are synchronized
console.log("Initial sequence number for clientA:", keystateA_before.s);
console.log("Initial sequence number for clientB:", keystateB_before.s);
console.log("Are keystates initially in sync?", keystateA_before.s === keystateB_before.s);
```

    Initial sequence number for clientA: 0


    Initial sequence number for clientB: 0


    Are keystates initially in sync? [33mtrue[39m


## The Key Rotation Process
Now, we'll proceed with the core steps of rotating the keys for `aidA`.


### Step 1: Perform the Rotation
The controller, `clientA`, initiates the key rotation using the `client.identifiers().rotate()` method. This method creates and signs a rotation (`rot`) event.

- `clientAAidAlias`: The alias of the identifier to rotate.
- `args`: A `RotateIdentifierArgs` object. For a simple rotation, this can be an empty object {}. It can also be used to specify changes to witnesses or other configuration during the rotation. **[see here for more details](https://weboftrust.github.io/signify-ts/interfaces/RotateIdentifierArgs.html)**

Like other establishment events in Signify-ts, this is an asynchronous operation. The method returns a promise that resolves to an operation object, which we then wait on to confirm completion.




```typescript
// Define arguments for the rotation. For a standard rotation, this can be empty.
const args: RotateIdentifierArgs = {};

// Initiate the rotation operation
const rotateResult = await clientA
    .identifiers()
    .rotate(clientAAidAlias, args);

// Get the long-running operation details
const rotateOperation = await rotateResult.op();

// Wait for the rotation operation to complete on the KERIA agent
const rotateOperationResponse = await clientA
    .operations()
    .wait(rotateOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

console.log("Key rotation operation completed successfully.");

```

    Key rotation operation completed successfully.


### Step 2 Local verification

After the rotation operation completes, `clientA`'s local state for `aidA` should be immediately updated. We can verify this by fetching the key state again and observing the changes:

- The sequence number (`s`) should have incremented by 1.
- The list of current public keys (`k`) should be different.
- The digest of the next pre-rotated keys (`n`) should also be different, as a new set of future keys has been committed to.


```typescript
// Get the updated key state from the local client (clientA)
let keystateA_after = (await clientA.keyStates().get(aidA.i))[0];

console.log("--- Key State After Rotation (Local Verification) ---");
console.log("Previous sequence number:", keystateA_before.s);
console.log("New sequence number:     ", keystateA_after.s);
console.log("\nPrevious keys:", keystateA_before.k);
console.log("New keys:     ", keystateA_after.k);
console.log("\nPrevious next-key digest:", keystateA_before.n);
console.log("New next-key digest:     ", keystateA_after.n);
```

    --- Key State After Rotation (Local Verification) ---


    Previous sequence number: 0


    New sequence number:      1


    
    Previous keys: [ [32m"DCOnqoTnU8JmkjuDbf2QNbSuIu35PsMiYlLgFL7kMzxv"[39m ]


    New keys:      [ [32m"DOqp_1UbvhJJ1_JHqapyPWnmohIPgxurPXqFiqHSCThu"[39m ]


    
    Previous next-key digest: [ [32m"EOkdBgywGkVQeJqyx8BpioqdpIG7YdT-H7gveuUtUaQu"[39m ]


    New next-key digest:      [ [32m"EJnR4PwAjs9gahLVnNCLbHdBeglywr9sMjEBHKythKFB"[39m ]


### Step 3: Remote Synchronization and Verification
At this point, the remote observer, `clientB`, is not yet aware of the rotation. Its local copy of the KEL for `aidA` is now outdated.


```typescript
// Get the key state from the remote observer again
let keystateB_stale = (await clientB.keyStates().get(aidA.i))[0];

console.log("--- Remote Observer State (Before Synchronization) ---");
console.log("Local controller's sequence number:", keystateA_after.s);
console.log("Remote observer's sequence number: ", keystateB_stale.s);
console.log("Are keystates in sync now?", keystateA_after.s === keystateB_stale.s);
```

    --- Remote Observer State (Before Synchronization) ---


    Local controller's sequence number: 1


    Remote observer's sequence number:  0


    Are keystates in sync now? [33mfalse[39m


To synchronize, `clientB` must query for the latest state of the AID's KEL. The `client.keyStates().query()` method is used for this purpose. It tells the client's KERIA agent to check the witnesses of the specified AID for any new events.


```typescript
// clientB queries for the latest key state of aidA from its witnesses
let queryOperation = await clientB
    .keyStates()
    .query(aidA.i, keystateA_after.s); // We can optionally specify the sequence number we expect to find

// Wait for the query operation to complete
const queryOperationResponse = await clientB
    .operations()
    .wait(queryOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

console.log("\nRemote observer has queried for updates.");

// Now, get the key state from the remote observer again
let keystateB_synced = (await clientB.keyStates().get(aidA.i))[0];

console.log("\n--- Remote Observer State (After Synchronization) ---");
console.log("Local controller's sequence number:", keystateA_after.s);
console.log("Remote observer's sequence number: ", keystateB_synced.s);
console.log("Are keystates in sync now?", keystateA_after.s === keystateB_synced.s);
```

    
    Remote observer has queried for updates.


    
    --- Remote Observer State (After Synchronization) ---


    Local controller's sequence number: 1


    Remote observer's sequence number:  1


    Are keystates in sync now? [33mtrue[39m


After the query, `clientB` has processed the `rot` event and its local key state for `aidA` is now consistent with `clientA`'s state. This demonstrates how KERI's distributed infrastructure maintains consistency across multiple parties.

<div class="alert alert-primary">
<b>📝 SUMMARY</b><hr>
This notebook demonstrated the key rotation process for a single-signature AID using Signify-ts:
<ul>
<li><b>Initiation:</b> The controller of an AID (<code>clientA</code>) uses <code>client.identifiers().rotate()</code> to create and sign a rotation (<code>rot</code>) event. This is an asynchronous operation that is tracked by the KERIA agent.</li>
<li><b>Local Verification:</b> After the rotation operation completes, the controller's local key state is immediately updated. This is confirmed by observing an incremented sequence number (<code>s</code>), a new set of current keys (<code>k</code>), and a new pre-rotation commitment for the next keys (<code>n</code>).</li>
<li><b>Remote Synchronization:</b> A remote observer (<code>clientB</code>) does not automatically see the rotation. They must explicitly query for the latest key state using <code>client.keyStates().query()</code>. This action prompts their KERIA agent to check the AID's witnesses for new events.</li>
<li><b>Consistency:</b> After a successful query, the remote observer's local KEL is updated, and their view of the AID's key state becomes consistent with the controller's view.</li>
</ul>
This process validates KERI's core principles of forward security (old keys are retired) and distributed consistency, ensuring all parties can maintain a synchronized and verifiable view of an identity's evolution.
</div>


```typescript

```
