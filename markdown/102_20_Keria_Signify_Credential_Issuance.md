# Signify-ts: ACDC Credential Issuance with IPEX

<div class="alert alert-primary">
<b>🎯 OBJECTIVE</b><hr>
Demonstrate the process of issuing an ACDC (Authentic Chained Data Container) from an Issuer to a Holder using the Issuance and Presentation Exchange (IPEX) protocol with the Signify-ts library.
</div>

<div class="alert alert-info">
<b>ℹ️ NOTE</b><hr>
This section utilizes utility functions (from <code>./scripts_ts/utils.ts</code>) to quickly establish the necessary preconditions for credential issuance. The detailed steps for client initialization, AID creation, end role assignment, and OOBI resolution were covered in the "Keria-Signify Connecting Controllers" notebook. Here, we provide a high-level recap of what these utility functions accomplish.
</div>

## Prerequisites: Client and AID Setup

The setup process, streamlined by the utility functions, performs the following key actions:

* **Signify Library Initialization**: Ensures the underlying cryptographic components of Signify-ts are ready.
* **Client Initialization & Connection**: Three `SignifyClient` instances are created—one each for an Issuer, a Holder, and a Verifier. Each client is bootstrapped and connected to its Keria agent.
* **AID Creation**: Each client (Issuer, Holder, Verifier) creates a primary AID using default arguments.
* **End Role Assignment**: An `agent` end role is assigned to each client's Keria Agent AID. 
* **OOBI Generation and Resolution (Client-to-Client)**:
    * OOBIs are generated for the Issuer, Holder, and Verifier AIDs, specifically for the `'agent'` role.
    * Communication channels are established by resolving these OOBIs:
        * Issuer's client resolves the Holder's OOBI.
        * Holder's client resolves the Issuer's OOBI.
        * Verifier's client resolves the Holder's OOBI.
        * Holder's client resolves the Verifier's OOBI.
* **Schema OOBI Resolution**: The Issuer, Holder, and Verifier clients all resolve the OOBI for the "EventPass" schema (SAID: `EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK`). This schema is hosted on the schema server (vLEI-Server in this context). Resolving the schema OOBI ensures all parties have the correct and verifiable schema definition necessary to understand and validate the credential.

The code block below executes this setup.


```typescript
import { randomPasscode, Serder} from 'npm:signify-ts';
import { initializeSignify, 
         initializeAndConnectClient,
         createNewAID,
         addEndRoleForAID,
         generateOOBI,
         resolveOOBI,
         createTimestamp,
         DEFAULT_IDENTIFIER_ARGS,
         DEFAULT_TIMEOUT_MS,
         DEFAULT_DELAY_MS,
         DEFAULT_RETRIES,
         ROLE_AGENT,
         IPEX_GRANT_ROUTE,
         IPEX_ADMIT_ROUTE,
         IPEX_APPLY_ROUTE,
         IPEX_OFFER_ROUTE,
         SCHEMA_SERVER_HOST
       } from './scripts_ts/utils.ts';

// Clients setup
// Initialize Issuer, Holder and Verifier CLients, Create AIDs for each one, assign 'agent' role to the AIDs
// generate and resolve OOBIs 

// Issuer Client
const issuerBran = randomPasscode()
const issuerAidAlias = 'issuerAid'
const { client: issuerClient } = await initializeAndConnectClient(issuerBran)
const { aid: issuerAid} = await createNewAID(issuerClient, issuerAidAlias, DEFAULT_IDENTIFIER_ARGS);
await addEndRoleForAID(issuerClient, issuerAidAlias, ROLE_AGENT);
const issuerOOBI = await generateOOBI(issuerClient, issuerAidAlias, ROLE_AGENT);

// Holder Client
const holderBran = randomPasscode()
const holderAidAlias = 'holderAid'
const { client: holderClient } = await initializeAndConnectClient(holderBran)
const { aid: holderAid} = await createNewAID(holderClient, holderAidAlias, DEFAULT_IDENTIFIER_ARGS);
await addEndRoleForAID(holderClient, holderAidAlias, ROLE_AGENT);
const holderOOBI = await generateOOBI(holderClient, holderAidAlias, ROLE_AGENT);

// Verifier Client
const verifierBran = randomPasscode()
const verifierAidAlias = 'verifierAid'
const { client: verifierClient } = await initializeAndConnectClient(verifierBran)
const { aid: verifierAid} = await createNewAID(verifierClient, verifierAidAlias, DEFAULT_IDENTIFIER_ARGS);
await addEndRoleForAID(verifierClient, verifierAidAlias, ROLE_AGENT);
const verifierOOBI = await generateOOBI(verifierClient, verifierAidAlias, ROLE_AGENT);

// Clients OOBI Resolution
// Resolve OOBIs to establish connections Issuer-Holder, Holder-Verifier
const issuerContactAlias = 'issuerContact';
const holderContactAlias = 'holderContact';
const verifierContactAlias = 'verifierContact';

await resolveOOBI(issuerClient, holderOOBI, holderContactAlias);
await resolveOOBI(holderClient, issuerOOBI, issuerContactAlias);
await resolveOOBI(verifierClient, holderOOBI, holderContactAlias);
await resolveOOBI(holderClient, verifierOOBI, verifierContactAlias);

// Schemas OOBI Resolution
// Resolve the Schemas from the Schema Server (VLEI-Server)
const schemaContactAlias = 'schemaContact';
const schemaSaid = 'EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK';
const schemaOOBI = `http://vlei-server:7723/oobi/${schemaSaid}`;

await resolveOOBI(issuerClient, schemaOOBI, schemaContactAlias);
await resolveOOBI(holderClient, schemaOOBI, schemaContactAlias);
await resolveOOBI(verifierClient, schemaOOBI, schemaContactAlias);

console.log("Client setup and OOBI resolutions complete.");
```

    Using Passcode (bran): AUWFgXfGjGz4rnIlNNoVK
    Client boot process initiated with Keria agent.
      Client AID Prefix:  EOsr6tQ62S0bu_8ptJdMjfleySz5ZtwwVRz0BH5Oo8yj
      Agent AID Prefix:   EPrzFWvdIHrZcprnTQSCI-NM7MZ1Udhzhyp8gYfx6I58
    Initiating AID inception for alias: issuerAid
    Successfully created AID with prefix: EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97
    Assigning 'agent' role to Keria Agent EPrzFWvdIHrZcprnTQSCI-NM7MZ1Udhzhyp8gYfx6I58 for AID alias issuerAid
    Successfully assigned 'agent' role for AID alias issuerAid.
    Generating OOBI for AID alias issuerAid with role agent
    Generated OOBI URL: http://keria:3902/oobi/EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97/agent/EPrzFWvdIHrZcprnTQSCI-NM7MZ1Udhzhyp8gYfx6I58
    Using Passcode (bran): CW5s00GuKCt5byZXinqdE
    Client boot process initiated with Keria agent.
      Client AID Prefix:  ENqYmqZ4Gf_oy0pe2tlxZF4wuJwnJTwS26amGiOYd1fy
      Agent AID Prefix:   ECWAGykIDv3UW3WEokjUJhNV2kcI_gXcYM8PyTuB5FVp
    Initiating AID inception for alias: holderAid
    Successfully created AID with prefix: EBYnS7d4XTWYzbuHQvnHhLXiMPFTSs2NDsdDfRVISrAs
    Assigning 'agent' role to Keria Agent ECWAGykIDv3UW3WEokjUJhNV2kcI_gXcYM8PyTuB5FVp for AID alias holderAid
    Successfully assigned 'agent' role for AID alias holderAid.
    Generating OOBI for AID alias holderAid with role agent
    Generated OOBI URL: http://keria:3902/oobi/EBYnS7d4XTWYzbuHQvnHhLXiMPFTSs2NDsdDfRVISrAs/agent/ECWAGykIDv3UW3WEokjUJhNV2kcI_gXcYM8PyTuB5FVp
    Using Passcode (bran): DpMN-Os2Q03yuJ7ciJtGt
    Client boot process initiated with Keria agent.
      Client AID Prefix:  EOGuTugvCDxtDds91B_2oGKzDOPOaXtfpwDgqkM1qwUY
      Agent AID Prefix:   EJ75FFF6Tn2DMK2a7K3VvXdAk5j5pbQB1SLRgrpn67Uh
    Initiating AID inception for alias: verifierAid
    Successfully created AID with prefix: EIc9UhouBA5zMlnNKsz_4krriBrjs51uVTUbQT4_BImW
    Assigning 'agent' role to Keria Agent EJ75FFF6Tn2DMK2a7K3VvXdAk5j5pbQB1SLRgrpn67Uh for AID alias verifierAid
    Successfully assigned 'agent' role for AID alias verifierAid.
    Generating OOBI for AID alias verifierAid with role agent
    Generated OOBI URL: http://keria:3902/oobi/EIc9UhouBA5zMlnNKsz_4krriBrjs51uVTUbQT4_BImW/agent/EJ75FFF6Tn2DMK2a7K3VvXdAk5j5pbQB1SLRgrpn67Uh
    Resolving OOBI URL: http://keria:3902/oobi/EBYnS7d4XTWYzbuHQvnHhLXiMPFTSs2NDsdDfRVISrAs/agent/ECWAGykIDv3UW3WEokjUJhNV2kcI_gXcYM8PyTuB5FVp with alias holderContact
    Successfully resolved OOBI URL. Response: OK
    Contact "holderContact" (ID: undefined) added/updated.
    Resolving OOBI URL: http://keria:3902/oobi/EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97/agent/EPrzFWvdIHrZcprnTQSCI-NM7MZ1Udhzhyp8gYfx6I58 with alias issuerContact
    Successfully resolved OOBI URL. Response: OK
    Contact "issuerContact" (ID: undefined) added/updated.
    Resolving OOBI URL: http://keria:3902/oobi/EBYnS7d4XTWYzbuHQvnHhLXiMPFTSs2NDsdDfRVISrAs/agent/ECWAGykIDv3UW3WEokjUJhNV2kcI_gXcYM8PyTuB5FVp with alias holderContact
    Successfully resolved OOBI URL. Response: OK
    Contact "holderContact" (ID: undefined) added/updated.
    Resolving OOBI URL: http://keria:3902/oobi/EIc9UhouBA5zMlnNKsz_4krriBrjs51uVTUbQT4_BImW/agent/EJ75FFF6Tn2DMK2a7K3VvXdAk5j5pbQB1SLRgrpn67Uh with alias verifierContact
    Successfully resolved OOBI URL. Response: OK
    Contact "verifierContact" (ID: undefined) added/updated.
    Resolving OOBI URL: http://vlei-server:7723/oobi/EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK with alias schemaContact
    Successfully resolved OOBI URL. Response: OK
    Contact "schemaContact" (ID: undefined) added/updated.
    Resolving OOBI URL: http://vlei-server:7723/oobi/EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK with alias schemaContact
    Successfully resolved OOBI URL. Response: OK
    Contact "schemaContact" (ID: undefined) added/updated.
    Resolving OOBI URL: http://vlei-server:7723/oobi/EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK with alias schemaContact
    Successfully resolved OOBI URL. Response: OK
    Contact "schemaContact" (ID: undefined) added/updated.
    Client setup and OOBI resolutions complete.


## Credential Issuance Workflow Steps

With the clients set up and connected, you can proceed with the credential issuance workflow. This involves the Issuer creating a credential and transferring it to the Holder using the IPEX protocol. Below are the code snippets you need to follow to do the issuance.

### Step 1: Create Issuer's Credential Registry

Before an Issuer can issue credentials, it needs a Credential Registry. In KERI, a Credential Registry is implemented using a **Transaction Event Log (TEL)**. This TEL is a secure, hash-linked log, managed by the Issuer's AID, specifically for tracking the lifecycle of credentials it issues—such as their issuance and revocation status. The registry itself is identified by a SAID derived from its inception event (`vcp` event type for registry inception). The TEL's history is anchored to the Issuer's Key Event Log, ensuring that all changes to the registry's state are cryptographically secured by the Issuer's controlling keys. This anchoring is achieved by including a digest of the TEL event in a KEL event.

Use the code below to let the Issuer client create this registry. A human-readable name (`issuerRegistryName`) is used to reference it within the client.


```typescript
//Create Issuer credential Registry
const issuerRegistryName = 'issuerRegistry' // Human readable identifier for the Registry

// Initiate registry creation
const createRegistryResult = await issuerClient
    .registries()
    .create({ name: issuerAidAlias, registryName: issuerRegistryName });

// Get the operation details
const createRegistryOperation = await createRegistryResult.op();

// Wait for the operation to complete
const createRegistryResponse = await issuerClient
    .operations()
    .wait(createRegistryOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

// Clean up the operation from the agent's list
await issuerClient.operations().delete(createRegistryOperation.name);

console.log(`Registry '${issuerRegistryName}' created for Issuer AID ${issuerAid.i}.`);
console.log("Registry creation response:", JSON.stringify(createRegistryResponse.response, null, 2));

// Listing Registries to confirm creation and retrieve its SAID (regk)
const issuerRegistries = await issuerClient.registries().list(issuerAidAlias);
const issuerRegistry = issuerRegistries[0]
console.log(`Registry: Name='${issuerRegistry.name}', SAID (regk)='${issuerRegistry.regk}'`);
```

    Registry 'issuerRegistry' created for Issuer AID EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97.
    Registry creation response: {
      "anchor": {
        "i": "ENq65LYOeEAtrbPXeAk9qZosEO4D0S5CG8Gih7Mtxq_x",
        "s": "0",
        "d": "ENq65LYOeEAtrbPXeAk9qZosEO4D0S5CG8Gih7Mtxq_x"
      }
    }
    Registry: Name='issuerRegistry', SAID (regk)='ENq65LYOeEAtrbPXeAk9qZosEO4D0S5CG8Gih7Mtxq_x'


### Step 2: Retrieve Schema Definition

The Issuer needs the definition of the schema against which they intend to issue a credential. Since the schema OOBI was resolved during the setup phase, the schema definition can now be retrieved from the Keria agent's cache using its SAID. You will reuse the `EventPass` schema (SAID: `EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK`) from previous KLI examples.


```typescript
// Retrieve Schemas
const issuerSchema = await issuerClient.schemas().get(schemaSaid);
console.log(issuerSchema)
```

    {
      "$id": "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
      "$schema": "http://json-schema.org/draft-07/schema#",
      title: "EventPass",
      description: "Event Pass Schema",
      type: "object",
      credentialType: "EventPassCred",
      version: "1.0.0",
      properties: {
        v: { description: "Credential Version String", type: "string" },
        d: { description: "Credential SAID", type: "string" },
        u: { description: "One time use nonce", type: "string" },
        i: { description: "Issuer AID", type: "string" },
        ri: { description: "Registry SAID", type: "string" },
        s: { description: "Schema SAID", type: "string" },
        a: {
          oneOf: [
            { description: "Attributes block SAID", type: "string" },
            {
              "$id": "ELppbffpWEM-uufl6qpVTcN6LoZS2A69UN4Ddrtr_JqE",
              description: "Attributes block",
              type: "object",
              properties: [Object],
              additionalProperties: false,
              required: [Array]
            }
          ]
        }
      },
      additionalProperties: false,
      required: [ "v", "d", "i", "ri", "s", "a" ]
    }


### Step 3: Issue the ACDC

Now the Issuer creates the actual ACDC. This involves:

1. Defining the `credentialClaims` – the specific attribute values for this instance of the `EventPass` credential.
2. Calling `issuerClient.credentials().issue()`. This method takes the Issuer's AID alias and an object specifying:
    - `ri`: The SAID of the Credential Registry (`issuerRegistry.regk`) where this credential's issuance will be recorded.
    - `s`: The SAID of the schema (`schemaSaid`) this credential adheres to.
    - `a`: An attributes block containing:
      - `i`: The AID of the Issuee (the Holder, holderAid.i).
      - The actual `credentialClaims`.

This `issue` command creates the ACDC locally within the Issuer's client and records an issuance event (e.g., `iss`) in the specified registry's TEL. The SAID of the newly created credential is then extracted from the response.

Use the code below to perform these actions.


```typescript
// Issue Credential

const credentialClaims = {
    "eventName":"GLEIF Summit",
    "accessLevel":"staff",
    "validDate":"2026-10-01"
}

const issueResult = await issuerClient
    .credentials()
    .issue(
        issuerAidAlias,
        {
            ri: issuerRegistry.regk, //Registry Identifier (not the alias)
            s: schemaSaid,           // Schema identifier
            a: {                     // Attributes block
                i: holderAid.i,      // Isuue or credential subject 
                ...credentialClaims  // The actual claims data                 
            }
        });

// Issuance is an asynchronous operation.
const issueOperation = await issueResult.op; //In this case is .op instead of .op() (Inconsistency in the sdk)

// Wait for the issuance operation to complete.
const issueResponse = await issuerClient
    .operations()
    .wait(issueOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

// Clean up the operation.
await issuerClient.operations().delete(issueOperation.name);

// Extract the SAID of the newly created credential from the response.
// This SAID uniquely identifies this specific ACDC instance.
const credentialSaid = issueResponse.response.ced.d

// Display the issued credential from the Issuer's perspective.
const issuerCredential = await issuerClient.credentials().get(credentialSaid);
console.log(issuerCredential)
```

    {
      sad: {
        v: "ACDC10JSON0001c4_",
        d: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
        i: "EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97",
        ri: "ENq65LYOeEAtrbPXeAk9qZosEO4D0S5CG8Gih7Mtxq_x",
        s: "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
        a: {
          d: "ENsM2aiweRKfacgf-_-eBr4lA-raT6fVGofbSoXe7HIf",
          i: "EBYnS7d4XTWYzbuHQvnHhLXiMPFTSs2NDsdDfRVISrAs",
          eventName: "GLEIF Summit",
          accessLevel: "staff",
          validDate: "2026-10-01",
          dt: "2025-05-29T20:24:17.619000+00:00"
        }
      },
      atc: "-IABEK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK0AAAAAAAAAAAAAAAAAAAAAAAEK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
      iss: {
        v: "KERI10JSON0000ed_",
        t: "iss",
        d: "EMxOK6I3aSGWRSspQZTuH_6ky7Z8NiD5VdTMWQuqx1ch",
        i: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
        s: "0",
        ri: "ENq65LYOeEAtrbPXeAk9qZosEO4D0S5CG8Gih7Mtxq_x",
        dt: "2025-05-29T20:24:17.619000+00:00"
      },
      issatc: "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAACEM5BULkQe7KbFquWzcXNCW4KCixoXmkUIC-N39zZz7EK",
      pre: "EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97",
      schema: {
        "$id": "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
        "$schema": "http://json-schema.org/draft-07/schema#",
        title: "EventPass",
        description: "Event Pass Schema",
        type: "object",
        credentialType: "EventPassCred",
        version: "1.0.0",
        properties: {
          v: { description: "Credential Version String", type: "string" },
          d: { description: "Credential SAID", type: "string" },
          u: { description: "One time use nonce", type: "string" },
          i: { description: "Issuer AID", type: "string" },
          ri: { description: "Registry SAID", type: "string" },
          s: { description: "Schema SAID", type: "string" },
          a: { oneOf: [ [Object], [Object] ] }
        },
        additionalProperties: false,
        required: [ "v", "d", "i", "ri", "s", "a" ]
      },
      chains: [],
      status: {
        vn: [ 1, 0 ],
        i: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
        s: "0",
        d: "EMxOK6I3aSGWRSspQZTuH_6ky7Z8NiD5VdTMWQuqx1ch",
        ri: "ENq65LYOeEAtrbPXeAk9qZosEO4D0S5CG8Gih7Mtxq_x",
        ra: {},
        a: { s: 2, d: "EM5BULkQe7KbFquWzcXNCW4KCixoXmkUIC-N39zZz7EK" },
        dt: "2025-05-29T20:24:17.619000+00:00",
        et: "iss"
      },
      anchor: {
        pre: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
        sn: 0,
        d: "EMxOK6I3aSGWRSspQZTuH_6ky7Z8NiD5VdTMWQuqx1ch"
      },
      anc: {
        v: "KERI10JSON00013a_",
        t: "ixn",
        d: "EM5BULkQe7KbFquWzcXNCW4KCixoXmkUIC-N39zZz7EK",
        i: "EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97",
        s: "2",
        p: "EBVehtsYtIzXxk0CsYqDiofCRwN-0PWQ0NXBGSY0as1j",
        a: [
          {
            i: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
            s: "0",
            d: "EMxOK6I3aSGWRSspQZTuH_6ky7Z8NiD5VdTMWQuqx1ch"
          }
        ]
      },
      ancatc: [
        "-VBq-AABAADAVoeFqSa4eifGcAbeKQHpfH2g6xvodY4qsN3-S2z429Ri3SYXIABW4sMp4acFR38RIgoM-slqRqyn-_o_9KgL-BADAAAMbFrn9dSjRfHI5QAKMmDME9AtWsXIihFhLSXHG7yM1gx5XEUZ11FWUGH8h8Me2qbnwxppvm6ZXnIz8ck3IToFABCpYBNvtpjFO1dCxsRDbyLGTDN2S4e51MkUibe0C7-iXfEa6KIy3k-ozAn-ZKWJfIDoIr4LRHODn7_zgQ_TrkIEACDC8j6n2ECId9E7LOgORKUDfDjTWuYoyjA_yiHHmqJl7z9IHEHOgHEKpSZwckdbEOvM42K0ryUZ3zINJzBjezMO-EAB0AAAAAAAAAAAAAAAAAAAAAAA1AAG2025-05-29T20c24c17d717978p00c00"
      ]
    }


### Step 4: Issuer Grants Credential via IPEX

The credential has been created but currently resides with the Issuer. To transfer it to the Holder, the Issuer initiates an IPEX (Issuance and Presentation Exchange) grant. This process uses KERI `exn` (exchange) messages. The grant message effectively offers the credential to the Holder. 

The `issuerClient.ipex().grant()` method prepares the grant message, including the ACDC itself (`acdc`), the issuance event from the registry (`iss`), and the anchoring event from the Issuer's KEL (`anc`) along with its signatures (`ancAttachment`).
Then, `issuerClient.ipex().submitGrant()` sends this packaged grant message to the Holder's Keria agent.

Use the code below to perform the ipex grant.


```typescript
// Ipex Grant

const [grant, gsigs, gend] = await issuerClient.ipex().grant({
    senderName: issuerAidAlias,
    acdc: new Serder(issuerCredential.sad), // The ACDC (Verifiable Credential) itself
    iss: new Serder(issuerCredential.iss),  // The issuance event from the credential registry (TEL event)
    anc: new Serder(issuerCredential.anc),  // The KEL event anchoring the TEL issuance event
    ancAttachment: issuerCredential.ancatc, // Signatures for the KEL anchoring event
    recipient: holderAid.i,                 // AID of the Holder
    datetime: createTimestamp(),            // Timestamp for the grant message
});

// Issuer submits the prepared grant message to the Holder.
// This sends an 'exn' message to the Holder's Keria agent.
const submitGrantOperation = await issuerClient
    .ipex()
    .submitGrant(
        issuerAidAlias,  // Issuer's AID alias
        grant,           // The grant message payload
        gsigs,           // Signatures for the grant message
        gend,            // Endorsements for the grant message
        [holderAid.i]    // List of recipient AIDs
    );

// Wait for the submission operation to complete.
const submitGrantResponse = await issuerClient
    .operations()
    .wait(submitGrantOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

// Clean up the operation.
await issuerClient.operations().delete(submitGrantOperation.name);
```

**Holder Checks Credential Status (Optional)**

The Holder can proactively check the status of a credential in the Issuer's registry if they know the registry's SAID (`issuerRegistry.regk`) and the credential's SAID (`issuerCredential.sad.d`). This query demonstrates how a party can verify the status directly from the TEL.


```typescript
// The flow transitions from the Issuer to the Holder.
// A delay and retry mechanism is added to allow time for Keria agents and witnesses
// to propagate the credential issuance information.

let credentialState;

// Retry loop to fetch credential state from the Holder's perspective.
for (let attempt = 1; attempt <= DEFAULT_RETRIES ; attempt++) {
    try{
        // Holder's client queries the state of the credential in the Issuer's registry.
        credentialState = await holderClient.credentials().state(issuerRegistry.regk, issuerCredential.sad.d)
        break;
    }
    catch (error){    
         console.log(`[Retry] failed to get credential state on attempt #${attempt} of ${DEFAULT_RETRIES}`);
         if (attempt === DEFAULT_RETRIES) {
             console.error(`[Retry] Max retries (${DEFAULT_RETRIES}) reached for getting credential state.`);
             throw error; 
         }
         console.log(`[Retry] Waiting ${DEFAULT_DELAY_MS}ms before next attempt...`);
         await new Promise(resolve => setTimeout(resolve, DEFAULT_DELAY_MS));
    }
}

console.log(credentialState) // Displays the status (e.g., issued, revoked)
```

    [Retry] failed to get credential state on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    {
      vn: [ 1, 0 ],
      i: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
      s: "0",
      d: "EMxOK6I3aSGWRSspQZTuH_6ky7Z8NiD5VdTMWQuqx1ch",
      ri: "ENq65LYOeEAtrbPXeAk9qZosEO4D0S5CG8Gih7Mtxq_x",
      ra: {},
      a: { s: 2, d: "EM5BULkQe7KbFquWzcXNCW4KCixoXmkUIC-N39zZz7EK" },
      dt: "2025-05-29T20:24:17.619000+00:00",
      et: "iss"
    }


### Step 5: Holder Receives IPEX Grant Notification

The Holder's Keria agent will receive the grant `exn` message sent by the Issuer. The Holder's client can list its notifications to find this incoming grant. The notification will contain the SAID of the `exn` message (`grantNotification.a.d`), which can then be used to retrieve the full details of the grant exchange from the Holder's client.




```typescript
// Holder waits for Grant notification

let notifications;

// Retry loop to fetch notifications.
for (let attempt = 1; attempt <= DEFAULT_RETRIES ; attempt++) {
    try{
        // List notifications, filtering for unread IPEX_GRANT_ROUTE messages.
        let allNotifications = await holderClient.notifications().list( );
        notifications = allNotifications.notes.filter(
            (n) => n.a.r === IPEX_GRANT_ROUTE && n.r === false // n.r is 'read' status
        )        
        if(notifications.length === 0){ 
            throw new Error("Grant notification not found"); // Throw error to trigger retry
        }
        break;     
    }
    catch (error){    
         console.log(`[Retry] Grant notification not found on attempt #${attempt} of ${DEFAULT_RETRIES}`);
         if (attempt === DEFAULT_RETRIES) {
             console.error(`[Retry] Max retries (${DEFAULT_RETRIES}) reached for grant notification.`);
             throw error; 
         }
         console.log(`[Retry] Waiting ${DEFAULT_DELAY_MS}ms before next attempt...`);
         await new Promise(resolve => setTimeout(resolve, DEFAULT_DELAY_MS));
    }
}

const grantNotification = notifications[0]  // Assuming only one grant notification for simplicity

console.log(grantNotification) // Displays the notification details

// Retrieve the full IPEX grant exchange details using the SAID from the notification.
// The 'exn' field in the exchange will contain the actual credential data.
const grantExchange = await holderClient.exchanges().get(grantNotification.a.d);

console.log(grantExchange) // Displays the content of the grant message
```

    {
      i: "0ACbZun1FuR0LVW15liZs__t",
      dt: "2025-05-29T20:24:18.783949+00:00",
      r: false,
      a: {
        r: "/exn/ipex/grant",
        d: "EFpe32xUqb4wBA-aqAp9mP9tWuIzygUgn_jGB3U0tI6b",
        m: ""
      }
    }
    {
      exn: {
        v: "KERI10JSON00057f_",
        t: "exn",
        d: "EFpe32xUqb4wBA-aqAp9mP9tWuIzygUgn_jGB3U0tI6b",
        i: "EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97",
        rp: "EBYnS7d4XTWYzbuHQvnHhLXiMPFTSs2NDsdDfRVISrAs",
        p: "",
        dt: "2025-05-29T20:24:18.413000+00:00",
        r: "/ipex/grant",
        q: {},
        a: { i: "EBYnS7d4XTWYzbuHQvnHhLXiMPFTSs2NDsdDfRVISrAs", m: "" },
        e: {
          acdc: {
            v: "ACDC10JSON0001c4_",
            d: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
            i: "EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97",
            ri: "ENq65LYOeEAtrbPXeAk9qZosEO4D0S5CG8Gih7Mtxq_x",
            s: "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
            a: {
              d: "ENsM2aiweRKfacgf-_-eBr4lA-raT6fVGofbSoXe7HIf",
              i: "EBYnS7d4XTWYzbuHQvnHhLXiMPFTSs2NDsdDfRVISrAs",
              eventName: "GLEIF Summit",
              accessLevel: "staff",
              validDate: "2026-10-01",
              dt: "2025-05-29T20:24:17.619000+00:00"
            }
          },
          iss: {
            v: "KERI10JSON0000ed_",
            t: "iss",
            d: "EMxOK6I3aSGWRSspQZTuH_6ky7Z8NiD5VdTMWQuqx1ch",
            i: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
            s: "0",
            ri: "ENq65LYOeEAtrbPXeAk9qZosEO4D0S5CG8Gih7Mtxq_x",
            dt: "2025-05-29T20:24:17.619000+00:00"
          },
          anc: {
            v: "KERI10JSON00013a_",
            t: "ixn",
            d: "EM5BULkQe7KbFquWzcXNCW4KCixoXmkUIC-N39zZz7EK",
            i: "EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97",
            s: "2",
            p: "EBVehtsYtIzXxk0CsYqDiofCRwN-0PWQ0NXBGSY0as1j",
            a: [ [Object] ]
          },
          d: "EHPisSnCswxvqJT87L-ym71NyC_LwPs6a9oV8nA6wDXf"
        }
      },
      pathed: {
        acdc: "-IABEK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK0AAAAAAAAAAAAAAAAAAAAAAAEMxOK6I3aSGWRSspQZTuH_6ky7Z8NiD5VdTMWQuqx1ch",
        iss: "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAAAEM5BULkQe7KbFquWzcXNCW4KCixoXmkUIC-N39zZz7EK",
        anc: "-VBq-AABAADAVoeFqSa4eifGcAbeKQHpfH2g6xvodY4qsN3-S2z429Ri3SYXIABW4sMp4acFR38RIgoM-slqRqyn-_o_9KgL-BADAAAMbFrn9dSjRfHI5QAKMmDME9AtWsXIihFhLSXHG7yM1gx5XEUZ11FWUGH8h8Me2qbnwxppvm6ZXnIz8ck3IToFABCpYBNvtpjFO1dCxsRDbyLGTDN2S4e51MkUibe0C7-iXfEa6KIy3k-ozAn-ZKWJfIDoIr4LRHODn7_zgQ_TrkIEACDC8j6n2ECId9E7LOgORKUDfDjTWuYoyjA_yiHHmqJl7z9IHEHOgHEKpSZwckdbEOvM42K0ryUZ3zINJzBjezMO-EAB0AAAAAAAAAAAAAAAAAAAAAAA1AAG2025-05-29T20c24c17d717978p00c00"
      }
    }


### Step 6: Holder Admits Credential

Upon receiving and reviewing the grant, the Holder decides to accept (`admit`) the credential. This involves:
- Preparing an `admit` `exn` message using `holderClient.ipex().admit()`.
- Submitting this `admit` message back to the Issuer using `holderClient.ipex().submitAdmit()`.
- Marking the original grant notification as read.
- The Holder's client then processes the admitted credential, verifying its signatures, schema, and status against the Issuer's KEL and TEL, and stores it locally.


```typescript
// Holder admits (accepts) the IPEX grant.

// Prepare the IPEX admit message.
const [admit, sigs, aend] = await holderClient.ipex().admit({
    senderName: holderAidAlias,       // Alias of the Holder's AID
    message: '',                      // Optional message to include in the admit
    grantSaid: grantNotification.a.d!,// SAID of the grant 'exn' message being admitted
    recipient: issuerAid.i,           // AID of the Issuer
    datetime: createTimestamp(),      // Timestamp for the admit message
});

// Holder submits the prepared admit message to the Issuer.
const admitOperation = await holderClient
    .ipex()
    .submitAdmit(holderAidAlias, admit, sigs, aend, [issuerAid.i]);

// Wait for the submission operation to complete.
const admitResponse = await holderClient
    .operations()
    .wait(admitOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

// Clean up the operation.
await holderClient.operations().delete(admitOperation.name);

// Holder marks the grant notification as read.
await holderClient.notifications().mark(grantNotification.i);
console.log("Holder's notifications after marking grant as read:");
console.log(await holderClient.notifications().list());

// Holder can now get the credential from their local store.
// This implies the client has processed, verified, and stored it upon admission.
const holderReceivedCredential = await holderClient.credentials().get(issuerCredential.sad.d);
console.log("Credential as stored by Holder:");
console.log(holderReceivedCredential);

```

    Holder's notifications after marking grant as read:
    {
      start: 0,
      end: 0,
      total: 1,
      notes: [
        {
          i: "0ACbZun1FuR0LVW15liZs__t",
          dt: "2025-05-29T20:24:18.783949+00:00",
          r: true,
          a: {
            r: "/exn/ipex/grant",
            d: "EFpe32xUqb4wBA-aqAp9mP9tWuIzygUgn_jGB3U0tI6b",
            m: ""
          }
        }
      ]
    }
    Credential as stored by Holder:
    {
      sad: {
        v: "ACDC10JSON0001c4_",
        d: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
        i: "EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97",
        ri: "ENq65LYOeEAtrbPXeAk9qZosEO4D0S5CG8Gih7Mtxq_x",
        s: "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
        a: {
          d: "ENsM2aiweRKfacgf-_-eBr4lA-raT6fVGofbSoXe7HIf",
          i: "EBYnS7d4XTWYzbuHQvnHhLXiMPFTSs2NDsdDfRVISrAs",
          eventName: "GLEIF Summit",
          accessLevel: "staff",
          validDate: "2026-10-01",
          dt: "2025-05-29T20:24:17.619000+00:00"
        }
      },
      atc: "-IABEK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK0AAAAAAAAAAAAAAAAAAAAAAAEK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
      iss: {
        v: "KERI10JSON0000ed_",
        t: "iss",
        d: "EMxOK6I3aSGWRSspQZTuH_6ky7Z8NiD5VdTMWQuqx1ch",
        i: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
        s: "0",
        ri: "ENq65LYOeEAtrbPXeAk9qZosEO4D0S5CG8Gih7Mtxq_x",
        dt: "2025-05-29T20:24:17.619000+00:00"
      },
      issatc: "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAACEM5BULkQe7KbFquWzcXNCW4KCixoXmkUIC-N39zZz7EK",
      pre: "EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97",
      schema: {
        "$id": "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
        "$schema": "http://json-schema.org/draft-07/schema#",
        title: "EventPass",
        description: "Event Pass Schema",
        type: "object",
        credentialType: "EventPassCred",
        version: "1.0.0",
        properties: {
          v: { description: "Credential Version String", type: "string" },
          d: { description: "Credential SAID", type: "string" },
          u: { description: "One time use nonce", type: "string" },
          i: { description: "Issuer AID", type: "string" },
          ri: { description: "Registry SAID", type: "string" },
          s: { description: "Schema SAID", type: "string" },
          a: { oneOf: [ [Object], [Object] ] }
        },
        additionalProperties: false,
        required: [ "v", "d", "i", "ri", "s", "a" ]
      },
      chains: [],
      status: {
        vn: [ 1, 0 ],
        i: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
        s: "0",
        d: "EMxOK6I3aSGWRSspQZTuH_6ky7Z8NiD5VdTMWQuqx1ch",
        ri: "ENq65LYOeEAtrbPXeAk9qZosEO4D0S5CG8Gih7Mtxq_x",
        ra: {},
        a: { s: 2, d: "EM5BULkQe7KbFquWzcXNCW4KCixoXmkUIC-N39zZz7EK" },
        dt: "2025-05-29T20:24:17.619000+00:00",
        et: "iss"
      },
      anchor: {
        pre: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
        sn: 0,
        d: "EMxOK6I3aSGWRSspQZTuH_6ky7Z8NiD5VdTMWQuqx1ch"
      },
      anc: {
        v: "KERI10JSON00013a_",
        t: "ixn",
        d: "EM5BULkQe7KbFquWzcXNCW4KCixoXmkUIC-N39zZz7EK",
        i: "EKf0WUQoPYkZ-6lw3kvIqaalToJOY5svyI2yMiHRCU97",
        s: "2",
        p: "EBVehtsYtIzXxk0CsYqDiofCRwN-0PWQ0NXBGSY0as1j",
        a: [
          {
            i: "EK3dbQU7spCTQl1cl-0lcxmVYT3aVBGhTSqAtHU_mNsK",
            s: "0",
            d: "EMxOK6I3aSGWRSspQZTuH_6ky7Z8NiD5VdTMWQuqx1ch"
          }
        ]
      },
      ancatc: [
        "-VBq-AABAADAVoeFqSa4eifGcAbeKQHpfH2g6xvodY4qsN3-S2z429Ri3SYXIABW4sMp4acFR38RIgoM-slqRqyn-_o_9KgL-BADAAAMbFrn9dSjRfHI5QAKMmDME9AtWsXIihFhLSXHG7yM1gx5XEUZ11FWUGH8h8Me2qbnwxppvm6ZXnIz8ck3IToFABCpYBNvtpjFO1dCxsRDbyLGTDN2S4e51MkUibe0C7-iXfEa6KIy3k-ozAn-ZKWJfIDoIr4LRHODn7_zgQ_TrkIEACDC8j6n2ECId9E7LOgORKUDfDjTWuYoyjA_yiHHmqJl7z9IHEHOgHEKpSZwckdbEOvM42K0ryUZ3zINJzBjezMO-EAB0AAAAAAAAAAAAAAAAAAAAAAA1AAG2025-05-29T20c24c18d873391p00c00"
      ]
    }


### Step 8: Issuer Receives Admit Notification

The Issuer, in turn, will receive a notification that the Holder has admitted the credential. The Issuer's client lists its notifications, finds the `admit` message, and marks it as read. This completes the issuance loop.


```typescript
// Issuer retrieves the Admit notification from the Holder.

let issuerAdmitNotifications;

// Retry loop for the Issuer to receive the admit notification.
for (let attempt = 1; attempt <= DEFAULT_RETRIES ; attempt++) {
    try{
        // List notifications, filtering for unread IPEX_ADMIT_ROUTE messages.
        let allNotifications = await issuerClient.notifications().list();
        issuerAdmitNotifications = allNotifications.notes.filter(
            (n) => n.a.r === IPEX_ADMIT_ROUTE && n.r === false
        )        
        if(issuerAdmitNotifications.length === 0){ 
            throw new Error("Admit notification not found"); // Throw error to trigger retry
        }
        break; // Exit loop if notification found
    }
    catch (error){    
         console.log(`[Retry] Admit notification not found for Issuer on attempt #${attempt} of ${DEFAULT_RETRIES}`);
         if (attempt === DEFAULT_RETRIES) {
             console.error(`[Retry] Max retries (${DEFAULT_RETRIES}) reached for Issuer's admit notification.`);
             throw error; 
         }
         console.log(`[Retry] Waiting ${DEFAULT_DELAY_MS}ms before next attempt...`);
         await new Promise(resolve => setTimeout(resolve, DEFAULT_DELAY_MS));
    }
}

const admitNotificationForIssuer = issuerAdmitNotifications[0] // Assuming one notification

// Issuer marks the admit notification as read.
await issuerClient.notifications().mark(admitNotificationForIssuer.i);
console.log("Issuer's notifications after marking admit as read:");
console.log(await issuerClient.notifications().list());
```

    Issuer's notifications after marking admit as read:
    {
      start: 0,
      end: 0,
      total: 1,
      notes: [
        {
          i: "0ABnoqQ_B6Ji-hf0JqpwK-At",
          dt: "2025-05-29T20:24:24.382383+00:00",
          r: true,
          a: {
            r: "/exn/ipex/admit",
            d: "EGKNxFutH-pmMISwUs5BOPloxfxBD1FUUdszHd3_btrT",
            m: ""
          }
        }
      ]
    }


**Cleanup (Optional)**

Once the IPEX flow for issuance is complete and notifications have been processed, both parties can optionally delete these notifications from their local client stores.


```typescript
// Issuer Remove Admit Notification from their list
await issuerClient.notifications().delete(admitNotificationForIssuer.i);
console.log("Issuer's notifications after deleting admit notification:");
console.log(await issuerClient.notifications().list());

// Holder Remove Grant Notification from their list
await holderClient.notifications().delete(grantNotification.i);
console.log("Holder's notifications after deleting grant notification:");
console.log(await holderClient.notifications().list());
```

    Issuer's notifications after deleting admit notification:
    { start: 0, end: 0, total: 0, notes: [] }
    Holder's notifications after deleting grant notification:
    { start: 0, end: 0, total: 0, notes: [] }

