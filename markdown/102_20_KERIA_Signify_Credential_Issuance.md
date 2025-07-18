# Signify TS: ACDC Credential Issuance with IPEX

<div class="alert alert-primary">
<b>🎯 OBJECTIVE</b><hr>
Demonstrate the process of issuing an ACDC (Authentic Chained Data Container) from an Issuer to a Holder using the Issuance and Presentation Exchange (IPEX) protocol with the Signify TS library.
</div>

<div class="alert alert-info">
<b>ℹ️ NOTE</b><hr>
This section utilizes utility functions (from <code>./scripts_ts/utils.ts</code>) to quickly establish the necessary preconditions for credential issuance. The detailed steps for client initialization, AID creation, end role assignment, and OOBI resolution were covered in the "KERIA-Signify Connecting Controllers" notebook. Here, we provide a high-level recap of what these utility functions accomplish.
</div>

## Prerequisites: Client and AID Setup

The setup process, streamlined by the utility functions, performs the following key actions:

* **Signify Library Initialization**: Ensures the underlying cryptographic components (libsodium) of Signify TS are ready.
* **Client Initialization & Connection**: Three `SignifyClient` instances are created—one each for an Issuer, a Holder, and a Verifier. Each client is bootstrapped and connected to its KERIA agent.
* **AID Creation**: Each client (Issuer, Holder, Verifier) creates a primary AID using default arguments.
* **End Role Assignment**: An `agent` end role is assigned to each client's KERIA Agent AID.
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

    Using Passcode (bran): AKZY1fNBwmlOKq3flQKKF


    Client boot process initiated with KERIA agent.


      Client AID Prefix:  EBeTToCL9Bu5T4cG3trMBPGtQefG6P2ubR8ItatYAaMz


      Agent AID Prefix:   ENQeKR27rBqEQichHWRN6f-cFIVUOPYVFx8Kcsx1GuOc


    Initiating AID inception for alias: issuerAid


    Successfully created AID with prefix: EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY


    Assigning 'agent' role to KERIA Agent ENQeKR27rBqEQichHWRN6f-cFIVUOPYVFx8Kcsx1GuOc for AID alias issuerAid


    Successfully assigned 'agent' role for AID alias issuerAid.


    Generating OOBI for AID alias issuerAid with role agent


    Generated OOBI URL: http://keria:3902/oobi/EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY/agent/ENQeKR27rBqEQichHWRN6f-cFIVUOPYVFx8Kcsx1GuOc


    Using Passcode (bran): DFBHt1TdQF62vcmrYhME1


    Client boot process initiated with KERIA agent.


      Client AID Prefix:  EPOlStDvCocLPQK3k69c3X8wr6isLGj6YVm5iV6YkEBb


      Agent AID Prefix:   EOMGu_PusfnTv1Q7W2uLcPI35s0aHIzuSaF6KX09fzpx


    Initiating AID inception for alias: holderAid


    Successfully created AID with prefix: EKbgh2bOcETApqRbnUd5A_MTQC6ahiNgSRkuLNpR5X0-


    Assigning 'agent' role to KERIA Agent EOMGu_PusfnTv1Q7W2uLcPI35s0aHIzuSaF6KX09fzpx for AID alias holderAid


    Successfully assigned 'agent' role for AID alias holderAid.


    Generating OOBI for AID alias holderAid with role agent


    Generated OOBI URL: http://keria:3902/oobi/EKbgh2bOcETApqRbnUd5A_MTQC6ahiNgSRkuLNpR5X0-/agent/EOMGu_PusfnTv1Q7W2uLcPI35s0aHIzuSaF6KX09fzpx


    Using Passcode (bran): Aq0kul5oYDcDmixxgjR7A


    Client boot process initiated with KERIA agent.


      Client AID Prefix:  ECzzvkokAPW27PRqD-NXKbKVSpv38VJrM6Vy5BhqIFNo


      Agent AID Prefix:   ELllLsBHd8qhMvY10pniW3awVn3rilMEKv6kNnEpQg6I


    Initiating AID inception for alias: verifierAid


    Successfully created AID with prefix: EANP3JMLUsU5ngCxl4p4vtywC2K8Bd8ab2Fg60ikKEU-


    Assigning 'agent' role to KERIA Agent ELllLsBHd8qhMvY10pniW3awVn3rilMEKv6kNnEpQg6I for AID alias verifierAid


    Successfully assigned 'agent' role for AID alias verifierAid.


    Generating OOBI for AID alias verifierAid with role agent


    Generated OOBI URL: http://keria:3902/oobi/EANP3JMLUsU5ngCxl4p4vtywC2K8Bd8ab2Fg60ikKEU-/agent/ELllLsBHd8qhMvY10pniW3awVn3rilMEKv6kNnEpQg6I


    Resolving OOBI URL: http://keria:3902/oobi/EKbgh2bOcETApqRbnUd5A_MTQC6ahiNgSRkuLNpR5X0-/agent/EOMGu_PusfnTv1Q7W2uLcPI35s0aHIzuSaF6KX09fzpx with alias holderContact


    Successfully resolved OOBI URL. Response: OK


    Contact "holderContact" added/updated.


    Resolving OOBI URL: http://keria:3902/oobi/EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY/agent/ENQeKR27rBqEQichHWRN6f-cFIVUOPYVFx8Kcsx1GuOc with alias issuerContact


    Successfully resolved OOBI URL. Response: OK


    Contact "issuerContact" added/updated.


    Resolving OOBI URL: http://keria:3902/oobi/EKbgh2bOcETApqRbnUd5A_MTQC6ahiNgSRkuLNpR5X0-/agent/EOMGu_PusfnTv1Q7W2uLcPI35s0aHIzuSaF6KX09fzpx with alias holderContact


    Successfully resolved OOBI URL. Response: OK


    Contact "holderContact" added/updated.


    Resolving OOBI URL: http://keria:3902/oobi/EANP3JMLUsU5ngCxl4p4vtywC2K8Bd8ab2Fg60ikKEU-/agent/ELllLsBHd8qhMvY10pniW3awVn3rilMEKv6kNnEpQg6I with alias verifierContact


    Successfully resolved OOBI URL. Response: OK


    Contact "verifierContact" added/updated.


    Resolving OOBI URL: http://vlei-server:7723/oobi/EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK with alias schemaContact


    Successfully resolved OOBI URL. Response: OK


    Contact "schemaContact" added/updated.


    Resolving OOBI URL: http://vlei-server:7723/oobi/EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK with alias schemaContact


    Successfully resolved OOBI URL. Response: OK


    Contact "schemaContact" added/updated.


    Resolving OOBI URL: http://vlei-server:7723/oobi/EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK with alias schemaContact


    Successfully resolved OOBI URL. Response: OK


    Contact "schemaContact" added/updated.


    Client setup and OOBI resolutions complete.


## Credential Issuance Workflow Steps

With the clients set up and connected, you can proceed with the credential issuance workflow. This involves the Issuer creating a credential and transferring it to the Holder using the IPEX protocol. Below are the code snippets you need to follow to do the issuance.

### Step 1: Create Issuer's Credential Registry

Before an Issuer can issue credentials, it needs a Credential Registry. In KERI, a Credential Registry is implemented using a **Transaction Event Log (TEL)**. This TEL is a secure, hash-linked log, managed by the Issuer's AID, specifically for being the registry referenced by each ACDC event, both issuance and revocation. The registry itself is identified by a SAID derived from its inception event (`vcp` event type for registry inception). The TEL's history is anchored to the Issuer's Key Event Log, ensuring that all changes to the registry's state are cryptographically secured by the Issuer's controlling keys. This anchoring is achieved by including a digest of the TEL event within an anchor that is included in the data property of a KEL event.

Use the code below to let the Issuer client create this registry. A human-readable name (`issuerRegistryName`) is used to reference it within the client.

<div class="alert alert-info">
    <b>ℹ️ NOTE: Production Registry Naming Suggestion</b>
    <hr/>
    <p>In production code you can name the registry whatever you want. It is not something that needs to be shown to the user and can be wholly managed behind the scenes. The important architectural consideration is that an issuer has a registry. Whether you decide to name the registry a user facing name or just a system name is up to you.</p>
    <p>The suggestion is to keep the name a system-level thing that is not user facing unless absolutely necessary and valuable to the end user. The less things the end user has to worry about, the better. Generally speaking, the name of an ACDC registry is a developer or architect level concern, not a user concern, unless you are exposing multiple registries to the end user and need human-friendly names to distinguish them.</p>
</div>


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

    Registry 'issuerRegistry' created for Issuer AID EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY.


    Registry creation response: {
      "anchor": {
        "i": "EA4LjjIE2SfG5ZLvWNMomRoBL25sOzeYXTYlyFckLiEH",
        "s": "0",
        "d": "EA4LjjIE2SfG5ZLvWNMomRoBL25sOzeYXTYlyFckLiEH"
      }
    }


    Registry: Name='issuerRegistry', SAID (regk)='EA4LjjIE2SfG5ZLvWNMomRoBL25sOzeYXTYlyFckLiEH'


### Step 2: Retrieve Schema Definition

The Issuer needs the definition of the schema against which they intend to issue a credential. Since the schema OOBI was resolved during the setup phase, the schema definition can now be retrieved from the KERIA agent's cache using its SAID. You will reuse the `EventPass` schema (SAID: `EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK`) from previous KLI examples.


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
      - This field [will change](https://trustoverip.github.io/tswg-acdc-specification/#top-level-fields) from `ri` to `rd` in the upcoming 2.0 version of KERI and the 1.0 version of the ACDC Spec.
        - `ri`: meant "registry identifier"
        - `rd`: means "registry digest"
    - `s`: The SAID of the schema (`schemaSaid`) this credential adheres to.
    - `a`: An attributes block containing:
      - `i`: The AID of the Issuee (the Holder, holderAid.i).
      - The actual `credentialClaims`.

This `issue` command creates the ACDC locally within the Issuer's client and records an issuance event (e.g., `iss`) in the specified registry's TEL by sending the issued ACDC to the connected KERIA agent. The SAID of the newly created credential is then extracted from the response from KERIA..

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
console.log("Issuing credential...")

// Issuance is an asynchronous operation.
const issueOperation = await issueResult.op; //In this case is .op instead of .op() (Inconsistency in the sdk)

// Wait for the issuance operation to complete.
const issueResponse = await issuerClient
    .operations()
    .wait(issueOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));
console.log("Finished issuing credential.");

// Clean up the operation.
await issuerClient.operations().delete(issueOperation.name);

// Extract the SAID of the newly created credential from the response.
// This SAID uniquely identifies this specific ACDC instance.
const credentialSaid = issueResponse.response.ced.d

// Display the issued credential from the Issuer's perspective.
const issuerCredential = await issuerClient.credentials().get(credentialSaid);
console.log(issuerCredential)
```

    Issuing credential...


    Finished issuing credential.


    {
      sad: {
        v: "ACDC10JSON0001c4_",
        d: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
        i: "EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY",
        ri: "EA4LjjIE2SfG5ZLvWNMomRoBL25sOzeYXTYlyFckLiEH",
        s: "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
        a: {
          d: "EIpTPqAX3CjYsFJn13OSRLgTojc5N5ecpp_dRzeIQ094",
          i: "EKbgh2bOcETApqRbnUd5A_MTQC6ahiNgSRkuLNpR5X0-",
          eventName: "GLEIF Summit",
          accessLevel: "staff",
          validDate: "2026-10-01",
          dt: "2025-07-18T00:20:21.979000+00:00"
        }
      },
      atc: "-IABELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j10AAAAAAAAAAAAAAAAAAAAAAAELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
      iss: {
        v: "KERI10JSON0000ed_",
        t: "iss",
        d: "EHi5JRGXifVZUsdGv9sXOCLkfRNrmte5NuJhGa7kJVzM",
        i: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
        s: "0",
        ri: "EA4LjjIE2SfG5ZLvWNMomRoBL25sOzeYXTYlyFckLiEH",
        dt: "2025-07-18T00:20:21.979000+00:00"
      },
      issatc: "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAACEOZa4v9bZNNSorDp8c-BBYTTmEYsYSwgv7RcIvFD3fAA",
      pre: "EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY",
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
        i: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
        s: "0",
        d: "EHi5JRGXifVZUsdGv9sXOCLkfRNrmte5NuJhGa7kJVzM",
        ri: "EA4LjjIE2SfG5ZLvWNMomRoBL25sOzeYXTYlyFckLiEH",
        ra: {},
        a: { s: 2, d: "EOZa4v9bZNNSorDp8c-BBYTTmEYsYSwgv7RcIvFD3fAA" },
        dt: "2025-07-18T00:20:21.979000+00:00",
        et: "iss"
      },
      anchor: {
        pre: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
        sn: 0,
        d: "EHi5JRGXifVZUsdGv9sXOCLkfRNrmte5NuJhGa7kJVzM"
      },
      anc: {
        v: "KERI10JSON00013a_",
        t: "ixn",
        d: "EOZa4v9bZNNSorDp8c-BBYTTmEYsYSwgv7RcIvFD3fAA",
        i: "EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY",
        s: "2",
        p: "EII-kMX52ep_cekP2CELNAQ99X7sChcoo67oZdOpHmdj",
        a: [
          {
            i: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
            s: "0",
            d: "EHi5JRGXifVZUsdGv9sXOCLkfRNrmte5NuJhGa7kJVzM"
          }
        ]
      },
      ancatc: [
        "-VBq-AABAAA_XsnPbTyvPYzGr0mNCY3759ZBSQcS0y2A02XPMr7PuRFm0h4HJfoh5WkY6mopBUtm_4xfG4_hkpR6nXS4-DIF-BADAADmd8Q1mtGQdFVhTGr5XKYGdY-dhORcwOd1Af2Yu0sNc-cD8UU_8Hkib-eF-JBNV5DORjFYw1J5HzFaJWeeqYAMABBtAfjzr8spBZdst0j0khZi7L42LzWSZK0kHbOCNZMHvtfrrQj3sPk85el1LDn43VWCXyUfBrDnSwgZqr51d0IIACAbSx-B3qKgWFOPAgexz2yNwr8Ma7bEejs3UCZSmGnMtHBvz4Urkdhvk7PYDwd8ksU1PJz5cbnP3S8elKoyUwsH-EAB0AAAAAAAAAAAAAAAAAAAAAAA1AAG2025-07-18T00c20c22d083667p00c00"
      ]
    }


### Step 4: Issuer Grants Credential via IPEX

The credential has been created but currently resides with the Issuer. To transfer it to the Holder, the Issuer initiates an IPEX (Issuance and Presentation Exchange) grant. This process uses KERI `exn` (exchange) messages. The grant message effectively offers the credential to the Holder. 

The `issuerClient.ipex().grant()` method prepares the grant message, including the ACDC itself (`acdc`), the issuance event from the registry (`iss`), and the anchoring event from the Issuer's KEL (`anc`) along with its signatures (`ancAttachment`).
Then, `issuerClient.ipex().submitGrant()` sends this packaged grant message to the Holder's KERIA agent.

Use the code below to perform the IPEX grant.


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
// This sends an 'exn' message to the Holder's KERIA agent.
const submitGrantOperation = await issuerClient
    .ipex()
    .submitGrant(
        issuerAidAlias,  // Issuer's AID alias
        grant,           // The grant message payload
        gsigs,           // Signatures for the grant message
        gend,            // Endorsements for the grant message
        [holderAid.i]    // List of recipient AIDs
    );
console.log("Sending IPEX Grant as issuer")

// Wait for the submission operation to complete.
const submitGrantResponse = await issuerClient
    .operations()
    .wait(submitGrantOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));
console.log("IPEX Grant sent")

// Clean up the operation.
await issuerClient.operations().delete(submitGrantOperation.name);
```

    Sending IPEX Grant as issuer


    IPEX Grant sent


#### Credential Status Checking

**Holder Checks Credential Status (Optional)**

The Holder can proactively check the status of a credential in the Issuer's registry if they know the registry's SAID (`issuerRegistry.regk`) and the credential's SAID (`issuerCredential.sad.d`). This query demonstrates how a party can verify the status of an ACDC directly from its TEL.

The retry loop below shows one way to cause the holder to wait for the issued credential to arrive.


```typescript
// The flow transitions from the Issuer to the Holder.
// A delay and retry mechanism is added to allow time for KERIA agents and witnesses
// to propagate the credential issuance information.

let credentialState;

// Retry loop to fetch credential state from the Holder's perspective.
for (let attempt = 1; attempt <= DEFAULT_RETRIES ; attempt++) {
    try{
        // Holder's client queries the state of the credential in the Issuer's registry.
        credentialState = await holderClient.credentials().state(issuerRegistry.regk, issuerCredential.sad.d)
        console.log("Received the credential.")
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


    Received the credential.


    {
      vn: [ 1, 0 ],
      i: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
      s: "0",
      d: "EHi5JRGXifVZUsdGv9sXOCLkfRNrmte5NuJhGa7kJVzM",
      ri: "EA4LjjIE2SfG5ZLvWNMomRoBL25sOzeYXTYlyFckLiEH",
      ra: {},
      a: { s: 2, d: "EOZa4v9bZNNSorDp8c-BBYTTmEYsYSwgv7RcIvFD3fAA" },
      dt: "2025-07-18T00:20:21.979000+00:00",
      et: "iss"
    }


#### Notifications API for IPEX messages

Sending an IPEX Grant also causes a notification object to be sent from the issuer (discloser) to the holder (disclosee). The Notifications API is an internal module used to signal transmission of an ACDC. Polling the list of received notifications is the way a holder knows when they have received a credential presentation through an IPEX grant.

### Step 5: Holder Receives IPEX Grant Notification

The Holder's KERIA agent will receive the grant `exn` message sent by the Issuer and a notification object referencing the grant message. The Holder's client can list its notifications to find this incoming grant. The notification will contain the SAID of the `exn` message (`grantNotification.a.d`), which can then be used to retrieve the full details of the grant exchange from the Holder's client.




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
        console.log("Found an unread notification for an IPEX Grant");
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

console.log("The notification", grantNotification) // Displays the notification details

// Retrieve the full IPEX grant exchange details using the SAID from the notification.
// The 'exn' field in the exchange will contain the actual credential data.
const grantExchange = await holderClient.exchanges().get(grantNotification.a.d);

console.log("The grant referenced by the notification")
console.log(grantExchange) // Displays the content of the grant message
```

    Found an unread notification for an IPEX Grant


    The notification {
      i: "0AByDAn4HYgPHtuJrvCig30Q",
      dt: "2025-07-18T00:20:24.773780+00:00",
      r: false,
      a: {
        r: "/exn/ipex/grant",
        d: "EJ0Kd6gWZnQlCnK-3GnQQMbwank0vAvpmN4ss_XlhhdK",
        m: ""
      }
    }


    The grant referenced by the notification


    {
      exn: {
        v: "KERI10JSON00057f_",
        t: "exn",
        d: "EJ0Kd6gWZnQlCnK-3GnQQMbwank0vAvpmN4ss_XlhhdK",
        i: "EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY",
        rp: "EKbgh2bOcETApqRbnUd5A_MTQC6ahiNgSRkuLNpR5X0-",
        p: "",
        dt: "2025-07-18T00:20:24.405000+00:00",
        r: "/ipex/grant",
        q: {},
        a: { i: "EKbgh2bOcETApqRbnUd5A_MTQC6ahiNgSRkuLNpR5X0-", m: "" },
        e: {
          acdc: {
            v: "ACDC10JSON0001c4_",
            d: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
            i: "EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY",
            ri: "EA4LjjIE2SfG5ZLvWNMomRoBL25sOzeYXTYlyFckLiEH",
            s: "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
            a: {
              d: "EIpTPqAX3CjYsFJn13OSRLgTojc5N5ecpp_dRzeIQ094",
              i: "EKbgh2bOcETApqRbnUd5A_MTQC6ahiNgSRkuLNpR5X0-",
              eventName: "GLEIF Summit",
              accessLevel: "staff",
              validDate: "2026-10-01",
              dt: "2025-07-18T00:20:21.979000+00:00"
            }
          },
          iss: {
            v: "KERI10JSON0000ed_",
            t: "iss",
            d: "EHi5JRGXifVZUsdGv9sXOCLkfRNrmte5NuJhGa7kJVzM",
            i: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
            s: "0",
            ri: "EA4LjjIE2SfG5ZLvWNMomRoBL25sOzeYXTYlyFckLiEH",
            dt: "2025-07-18T00:20:21.979000+00:00"
          },
          anc: {
            v: "KERI10JSON00013a_",
            t: "ixn",
            d: "EOZa4v9bZNNSorDp8c-BBYTTmEYsYSwgv7RcIvFD3fAA",
            i: "EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY",
            s: "2",
            p: "EII-kMX52ep_cekP2CELNAQ99X7sChcoo67oZdOpHmdj",
            a: [ [Object] ]
          },
          d: "EAaFqBzUELUVCGLFoubm-PoJrEPS8YjnrxhFXY8IzM-U"
        }
      },
      pathed: {
        acdc: "-IABELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j10AAAAAAAAAAAAAAAAAAAAAAAEHi5JRGXifVZUsdGv9sXOCLkfRNrmte5NuJhGa7kJVzM",
        iss: "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAAAEOZa4v9bZNNSorDp8c-BBYTTmEYsYSwgv7RcIvFD3fAA",
        anc: "-VBq-AABAAA_XsnPbTyvPYzGr0mNCY3759ZBSQcS0y2A02XPMr7PuRFm0h4HJfoh5WkY6mopBUtm_4xfG4_hkpR6nXS4-DIF-BADAADmd8Q1mtGQdFVhTGr5XKYGdY-dhORcwOd1Af2Yu0sNc-cD8UU_8Hkib-eF-JBNV5DORjFYw1J5HzFaJWeeqYAMABBtAfjzr8spBZdst0j0khZi7L42LzWSZK0kHbOCNZMHvtfrrQj3sPk85el1LDn43VWCXyUfBrDnSwgZqr51d0IIACAbSx-B3qKgWFOPAgexz2yNwr8Ma7bEejs3UCZSmGnMtHBvz4Urkdhvk7PYDwd8ksU1PJz5cbnP3S8elKoyUwsH-EAB0AAAAAAAAAAAAAAAAAAAAAAA1AAG2025-07-18T00c20c22d083667p00c00"
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
          i: "0AByDAn4HYgPHtuJrvCig30Q",
          dt: "2025-07-18T00:20:24.773780+00:00",
          r: true,
          a: {
            r: "/exn/ipex/grant",
            d: "EJ0Kd6gWZnQlCnK-3GnQQMbwank0vAvpmN4ss_XlhhdK",
            m: ""
          }
        }
      ]
    }


    Credential as stored by Holder:


    {
      sad: {
        v: "ACDC10JSON0001c4_",
        d: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
        i: "EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY",
        ri: "EA4LjjIE2SfG5ZLvWNMomRoBL25sOzeYXTYlyFckLiEH",
        s: "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
        a: {
          d: "EIpTPqAX3CjYsFJn13OSRLgTojc5N5ecpp_dRzeIQ094",
          i: "EKbgh2bOcETApqRbnUd5A_MTQC6ahiNgSRkuLNpR5X0-",
          eventName: "GLEIF Summit",
          accessLevel: "staff",
          validDate: "2026-10-01",
          dt: "2025-07-18T00:20:21.979000+00:00"
        }
      },
      atc: "-IABELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j10AAAAAAAAAAAAAAAAAAAAAAAELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
      iss: {
        v: "KERI10JSON0000ed_",
        t: "iss",
        d: "EHi5JRGXifVZUsdGv9sXOCLkfRNrmte5NuJhGa7kJVzM",
        i: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
        s: "0",
        ri: "EA4LjjIE2SfG5ZLvWNMomRoBL25sOzeYXTYlyFckLiEH",
        dt: "2025-07-18T00:20:21.979000+00:00"
      },
      issatc: "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAACEOZa4v9bZNNSorDp8c-BBYTTmEYsYSwgv7RcIvFD3fAA",
      pre: "EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY",
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
        i: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
        s: "0",
        d: "EHi5JRGXifVZUsdGv9sXOCLkfRNrmte5NuJhGa7kJVzM",
        ri: "EA4LjjIE2SfG5ZLvWNMomRoBL25sOzeYXTYlyFckLiEH",
        ra: {},
        a: { s: 2, d: "EOZa4v9bZNNSorDp8c-BBYTTmEYsYSwgv7RcIvFD3fAA" },
        dt: "2025-07-18T00:20:21.979000+00:00",
        et: "iss"
      },
      anchor: {
        pre: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
        sn: 0,
        d: "EHi5JRGXifVZUsdGv9sXOCLkfRNrmte5NuJhGa7kJVzM"
      },
      anc: {
        v: "KERI10JSON00013a_",
        t: "ixn",
        d: "EOZa4v9bZNNSorDp8c-BBYTTmEYsYSwgv7RcIvFD3fAA",
        i: "EInqPd7K84Dfo4DzwPeITao_CX3DAuvP4e9EcTZ8ryYY",
        s: "2",
        p: "EII-kMX52ep_cekP2CELNAQ99X7sChcoo67oZdOpHmdj",
        a: [
          {
            i: "ELnSh4dIcGKK3CfB_NsuaLOOat4GR0KFNLfwQssKv0j1",
            s: "0",
            d: "EHi5JRGXifVZUsdGv9sXOCLkfRNrmte5NuJhGa7kJVzM"
          }
        ]
      },
      ancatc: [
        "-VBq-AABAAA_XsnPbTyvPYzGr0mNCY3759ZBSQcS0y2A02XPMr7PuRFm0h4HJfoh5WkY6mopBUtm_4xfG4_hkpR6nXS4-DIF-BADAADmd8Q1mtGQdFVhTGr5XKYGdY-dhORcwOd1Af2Yu0sNc-cD8UU_8Hkib-eF-JBNV5DORjFYw1J5HzFaJWeeqYAMABBtAfjzr8spBZdst0j0khZi7L42LzWSZK0kHbOCNZMHvtfrrQj3sPk85el1LDn43VWCXyUfBrDnSwgZqr51d0IIACAbSx-B3qKgWFOPAgexz2yNwr8Ma7bEejs3UCZSmGnMtHBvz4Urkdhvk7PYDwd8ksU1PJz5cbnP3S8elKoyUwsH-EAB0AAAAAAAAAAAAAAAAAAAAAAA1AAG2025-07-18T00c20c24d926728p00c00"
      ]
    }


### Step 7: Issuer Receives Admit Notification

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
          i: "0ABYvw7RdLb-uFEp7KYRtPQ9",
          dt: "2025-07-18T00:20:30.374198+00:00",
          r: true,
          a: {
            r: "/exn/ipex/admit",
            d: "EHhpugqbltwwKI1tKOODD7ifmfXbQlOs66bLfDUQGA8Q",
            m: ""
          }
        }
      ]
    }


**Cleanup (Optional)**

Once the IPEX flow for issuance is complete and notifications have been processed, both parties can optionally delete these notifications from their agent notification stores.


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


<div class="alert alert-primary">
<b>📝 SUMMARY</b><hr>
This notebook demonstrated how to perform credential issuance using the Issuance and Presentation Exchange (IPEX) protocol.
<ul>
<li><b>Credential Registry:</b> before any credentials may be created for an issuer it must create a credential registry that will be referenced by a set of issued credentials. An issuer may make more than one registry and name them according to purpose.</li>
<li><b>Schema Definition:</b> every credential must have a schema definition and this schema definition must be loaded into the issuer's local database prior to issuing the credential.</li>
<li><b>Credential Issuance:</b> an issuer may create a credential targeted towards a particular subject, or an identifier that will be the holder of an ACDC credential. Credentials may also be untargeted.</li>
<li><b>Sharing with Holder (subject):</b> following creation an issuer may share the ACDC credential with the subject of the newly created credential, the holder, using an IPEX Grant.</li>
<li><b>IPEX action notifications:</b> as a convenience for the users of the IPEX process there are notifications sent of each IPEX action that begin as unread and may be marked as read once a notification receiver has processed the referenced action or event.</li>
</ul>
The ACDC credential issuance process with IPEX is a critical part of the overall value that the KERI suite of protocols stands to provide as it is the first step in allowing verifiable, provenanced data sharing between multiple parties. This training shows how to use IPEX to issue and share credentials.
</div>
