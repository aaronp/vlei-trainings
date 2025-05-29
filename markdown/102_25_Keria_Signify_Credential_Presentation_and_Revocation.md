# Signify-ts: ACDC Presentation and Revocation with IPEX

<div class="alert alert-primary">
<b>🎯 OBJECTIVE</b><hr>
Demonstrate the process of presenting an ACDC (Authentic Chained Data Container) from a Holder to a Verifier using the IPEX protocol with the Signify-ts library and the process of credential revocation.
</div>

<div class="alert alert-info">
<b>ℹ️ NOTE</b><hr>
This section utilizes utility functions (from <code>./scripts_ts/utils.ts</code>) to quickly establish the necessary preconditions for credential presentation. 
</div>

## Prerequisites: Client and Credential Setup 

The client setup process from the previous notebook is reused here.


```typescript
import { randomPasscode, Serder} from 'npm:signify-ts';
import { initializeSignify, 
         initializeAndConnectClient,
         createNewAID,
         addEndRoleForAID,
         generateOOBI,
         resolveOOBI,
         createTimestamp,
         createCredentialRegistry,
         getSchema,
         issueCredential,
         ipexGrantCredential,
         getCredentialState,
         waitForAndGetNotification,
         ipexAdmitGrant,
         markNotificationRead,
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

    Using Passcode (bran): D6C8T874QFdpN-bm53Oyn
    Client boot process initiated with Keria agent.
      Client AID Prefix:  ECrtbg-Ckhor8rXi68ma_v9zo6KswhsgkCWsMu60GBm5
      Agent AID Prefix:   ELpZFiX4Sc2NHroz6RIXQCfwuhSAdRZQBVdi2KYUxXvl
    Initiating AID inception for alias: issuerAid
    Successfully created AID with prefix: EGAtpZ2APitpDfU3lCohC2u6jZ7yXRa9y7XUVoAkvnQe
    Assigning 'agent' role to Keria Agent ELpZFiX4Sc2NHroz6RIXQCfwuhSAdRZQBVdi2KYUxXvl for AID alias issuerAid
    Successfully assigned 'agent' role for AID alias issuerAid.
    Generating OOBI for AID alias issuerAid with role agent
    Generated OOBI URL: http://keria:3902/oobi/EGAtpZ2APitpDfU3lCohC2u6jZ7yXRa9y7XUVoAkvnQe/agent/ELpZFiX4Sc2NHroz6RIXQCfwuhSAdRZQBVdi2KYUxXvl
    Using Passcode (bran): Dpc0bmo88jvsNQi1cDHJl
    Client boot process initiated with Keria agent.
      Client AID Prefix:  EGCSEH94i6p1EVESF3Rb5B0ZDRDnGwZnD1N7HV62sIEa
      Agent AID Prefix:   ECQ2orD_lNoBfKsEyz-yDBn8O915qwtUI5aT7SRcSyeO
    Initiating AID inception for alias: holderAid
    Successfully created AID with prefix: EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP
    Assigning 'agent' role to Keria Agent ECQ2orD_lNoBfKsEyz-yDBn8O915qwtUI5aT7SRcSyeO for AID alias holderAid
    Successfully assigned 'agent' role for AID alias holderAid.
    Generating OOBI for AID alias holderAid with role agent
    Generated OOBI URL: http://keria:3902/oobi/EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP/agent/ECQ2orD_lNoBfKsEyz-yDBn8O915qwtUI5aT7SRcSyeO
    Using Passcode (bran): CGCzXE7ubxKwGJWNK_YYH
    Client boot process initiated with Keria agent.
      Client AID Prefix:  ENYqYU2NWYZL8arVYVvP_rTKeWfsF0u-aaxk88zOWVN2
      Agent AID Prefix:   EAbThFrYhPFuuOBClapE0q8N9zvoLtRF2bwe60YM6RfZ
    Initiating AID inception for alias: verifierAid
    Successfully created AID with prefix: EIRdifOx7ot4c2xJ4ph2ipVb8mvry-CAR-NpKeYBMPXx
    Assigning 'agent' role to Keria Agent EAbThFrYhPFuuOBClapE0q8N9zvoLtRF2bwe60YM6RfZ for AID alias verifierAid
    Successfully assigned 'agent' role for AID alias verifierAid.
    Generating OOBI for AID alias verifierAid with role agent
    Generated OOBI URL: http://keria:3902/oobi/EIRdifOx7ot4c2xJ4ph2ipVb8mvry-CAR-NpKeYBMPXx/agent/EAbThFrYhPFuuOBClapE0q8N9zvoLtRF2bwe60YM6RfZ
    Resolving OOBI URL: http://keria:3902/oobi/EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP/agent/ECQ2orD_lNoBfKsEyz-yDBn8O915qwtUI5aT7SRcSyeO with alias holderContact
    Successfully resolved OOBI URL. Response: OK
    Contact "holderContact" (ID: undefined) added/updated.
    Resolving OOBI URL: http://keria:3902/oobi/EGAtpZ2APitpDfU3lCohC2u6jZ7yXRa9y7XUVoAkvnQe/agent/ELpZFiX4Sc2NHroz6RIXQCfwuhSAdRZQBVdi2KYUxXvl with alias issuerContact
    Successfully resolved OOBI URL. Response: OK
    Contact "issuerContact" (ID: undefined) added/updated.
    Resolving OOBI URL: http://keria:3902/oobi/EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP/agent/ECQ2orD_lNoBfKsEyz-yDBn8O915qwtUI5aT7SRcSyeO with alias holderContact
    Successfully resolved OOBI URL. Response: OK
    Contact "holderContact" (ID: undefined) added/updated.
    Resolving OOBI URL: http://keria:3902/oobi/EIRdifOx7ot4c2xJ4ph2ipVb8mvry-CAR-NpKeYBMPXx/agent/EAbThFrYhPFuuOBClapE0q8N9zvoLtRF2bwe60YM6RfZ with alias verifierContact
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


As you will be conducting a credential presentation in this notebook, let's generate one for use in the presentation workflow. 


```typescript
// Create Issuer Credential Registry
const issuerRegistryName = 'issuerRegistry'
const { registrySaid: registrySaid } = await createCredentialRegistry(issuerClient, issuerAidAlias, issuerRegistryName)

// Define credential Claims
const credentialClaims = {
    "eventName":"GLEIF Summit",
    "accessLevel":"staff",
    "validDate":"2026-10-01"
}

// Issuer - Issue Credential
const { credentialSaid: credentialSaid} = await issueCredential(
    issuerClient, 
    issuerAidAlias, 
    registrySaid, 
    schemaSaid,
    holderAid.i,
    credentialClaims
)

// Issuer - get credential (with all its data)
const credential = await issuerClient.credentials().get(credentialSaid);

// Issuer - Ipex grant
const grantResponse = await ipexGrantCredential(
    issuerClient,
    issuerAidAlias, 
    holderAid.i,
    credential,
    ipexAdmitGrant
)

// Holder - Wait for grant notification
const grantNotifications = await waitForAndGetNotification(holderClient, IPEX_GRANT_ROUTE)
const grantNotification = grantNotifications[0]

// Holder - Admit Grant
const admitResponse = await ipexAdmitGrant(
    holderClient,
    holderAidAlias,
    issuerAid.i,
    grantNotification.a.d
)

// Holder - Mark notification
await markNotificationRead(holderClient, grantNotification.i)

// Issuer - Wait for admit notification
const admitNotifications = await waitForAndGetNotification(issuerClient, IPEX_ADMIT_ROUTE)
const admitNotification = admitNotifications[0]

// Issuer - Mark notification
await markNotificationRead(issuerClient, admitNotification.i)
```

    Creating credential registry "issuerRegistry" for AID alias "issuerAid"...
    Successfully created credential registry: ENfYUmF1JYTEEaCWfVoKttTuFLBDcD2TE2TKRB2eio3N
    Issuing credential from AID "issuerAid" to AID "EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP"...
    {
      name: "credential.EEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS",
      metadata: {
        ced: {
          v: "ACDC10JSON0001c4_",
          d: "EEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS",
          i: "EGAtpZ2APitpDfU3lCohC2u6jZ7yXRa9y7XUVoAkvnQe",
          ri: "ENfYUmF1JYTEEaCWfVoKttTuFLBDcD2TE2TKRB2eio3N",
          s: "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
          a: {
            d: "EEELX_4BhUAmR3nCwdrIvkRMmfA4u9Baf2hA0op3sqyX",
            i: "EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP",
            eventName: "GLEIF Summit",
            accessLevel: "staff",
            validDate: "2026-10-01",
            dt: "2025-05-29T20:26:07.430000+00:00"
          }
        },
        depends: {
          name: "witness.ECGTILLohpdVr4axRrYesklZqJEhH1gknL2HxC6PwkZl",
          metadata: { pre: "EGAtpZ2APitpDfU3lCohC2u6jZ7yXRa9y7XUVoAkvnQe", sn: 2 },
          done: false,
          error: null,
          response: null
        }
      },
      done: true,
      error: null,
      response: {
        ced: {
          v: "ACDC10JSON0001c4_",
          d: "EEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS",
          i: "EGAtpZ2APitpDfU3lCohC2u6jZ7yXRa9y7XUVoAkvnQe",
          ri: "ENfYUmF1JYTEEaCWfVoKttTuFLBDcD2TE2TKRB2eio3N",
          s: "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
          a: {
            d: "EEELX_4BhUAmR3nCwdrIvkRMmfA4u9Baf2hA0op3sqyX",
            i: "EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP",
            eventName: "GLEIF Summit",
            accessLevel: "staff",
            validDate: "2026-10-01",
            dt: "2025-05-29T20:26:07.430000+00:00"
          }
        }
      }
    }
    Successfully issued credential with SAID: EEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS
    AID "issuerAid" granting credential to AID "EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP" via IPEX...
    Successfully submitted IPEX grant from "issuerAid" to "EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    AID "holderAid" admitting IPEX grant "EIwfVKdtbymYjpta0WfbUFwFdsoeaMmmPHoT18F29YtJ" from AID "EGAtpZ2APitpDfU3lCohC2u6jZ7yXRa9y7XUVoAkvnQe"...
    Successfully submitted IPEX admit for grant "EIwfVKdtbymYjpta0WfbUFwFdsoeaMmmPHoT18F29YtJ".
    Marking notification "0AClCNRGOoJZBwiDMuTpNttr" as read...
    Notification "0AClCNRGOoJZBwiDMuTpNttr" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0AB6o2lswWgvfVoPY6G04YlE" as read...
    Notification "0AB6o2lswWgvfVoPY6G04YlE" marked as read.


## Credential Presentation Workflow (IPEX)

Now that the Holder possesses the credential, they can present it to a Verifier. This workflow also uses IPEX, but typically starts with the Verifier requesting a presentation.

Below are presented the code snipets you need to follow to do the presentation.

### Step 1: Verifier Requests Presentation (Apply)

The Verifier initiates the presentation process by sending an IPEX apply message. This `apply` message is an `exn` message specifying the criteria for the credential they are requesting. This includes the `schemaSaid` and can include specific attributes the credential must have.


```typescript
// Verifier Ipex Apply (Presentation request)

// Prepare the IPEX apply message.
const [apply, sigsApply, _endApply] = await verifierClient.ipex().apply({ //_endApply is not used
    senderName: verifierAidAlias,     // Alias of the Verifier's AID
    schemaSaid: schemaSaid,           // SAID of the schema for the requested credential
    attributes: { eventName:'GLEIF Summit' }, // Specific attributes the credential should have
    recipient: holderAid.i,           // AID of the Holder being asked for the presentation
    datetime: createTimestamp(),      // Timestamp for the apply message
});

// Verifier submits the prepared apply message to the Holder.
const applyOperation = await verifierClient
    .ipex()
    .submitApply(verifierAidAlias, apply, sigsApply, [holderAid.i]);

// Wait for the submission operation to complete.
const applyResponse = await verifierClient
    .operations()
    .wait(applyOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

// Clean up the operation.
await verifierClient.operations().delete(applyOperation.name);
```

### Step 2: Holder Receives Apply Request

Holder Apply Notification and Exchange
The Holder receives a notification for the Verifier's `apply` request. They retrieve the details of this request from the exchange message. After processing, the Holder marks the notification as read.


```typescript
// Holder receives the IPEX apply notification from the Verifier.

let holderApplyNotifications;

// Retry loop for the Holder to receive the apply notification.
for (let attempt = 1; attempt <= DEFAULT_RETRIES ; attempt++) {
    try{
        // List notifications, filtering for unread IPEX_APPLY_ROUTE messages.
        let allNotifications = await holderClient.notifications().list()
        holderApplyNotifications = allNotifications.notes.filter(
            (n) => n.a.r === IPEX_APPLY_ROUTE && n.r === false
        )        
        if(holderApplyNotifications.length === 0){ 
            throw new Error("Apply notification not found"); // Throw error to trigger retry
        }
        break; // Exit loop if notification found
    }
    catch (error){    
         console.log(`[Retry] Apply notification not found for Holder on attempt #${attempt} of ${DEFAULT_RETRIES}`);
         if (attempt === DEFAULT_RETRIES) {
             console.error(`[Retry] Max retries (${DEFAULT_RETRIES}) reached for Holder's apply notification.`);
             throw error; 
         }
         console.log(`[Retry] Waiting ${DEFAULT_DELAY_MS}ms before next attempt...`);
         await new Promise(resolve => setTimeout(resolve, DEFAULT_DELAY_MS));
    }
}

const applyNotificationForHolder = holderApplyNotifications[0] // Assuming one notification

console.log("Holder received Apply Notification:");
console.log(applyNotificationForHolder);

// Retrieve the full IPEX apply exchange details.
const applyExchange = await holderClient.exchanges().get(applyNotificationForHolder.a.d);
console.log("Details of Apply Exchange received by Holder:");
console.log(applyExchange);

// Extract the SAID of the apply 'exn' message for use in the offer.
const applyExchangeSaid = applyExchange.exn.d;

// Holder marks the apply notification as read.
await holderClient.notifications().mark(applyNotificationForHolder.i);
console.log("Holder's notifications after marking apply as read:");
console.log(await holderClient.notifications().list());


```

    [Retry] Apply notification not found for Holder on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    Holder received Apply Notification:
    {
      i: "0ACiPmQnzeDArrst7TIPSeXj",
      dt: "2025-05-29T20:26:14.532869+00:00",
      r: false,
      a: {
        r: "/exn/ipex/apply",
        d: "EM0FJu04eBq241D1GsQW3rbHlGiAvT-AvMml6SlmA7N1",
        m: ""
      }
    }
    Details of Apply Exchange received by Holder:
    {
      exn: {
        v: "KERI10JSON0001a0_",
        t: "exn",
        d: "EM0FJu04eBq241D1GsQW3rbHlGiAvT-AvMml6SlmA7N1",
        i: "EIRdifOx7ot4c2xJ4ph2ipVb8mvry-CAR-NpKeYBMPXx",
        rp: "EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP",
        p: "",
        dt: "2025-05-29T20:26:14.196000+00:00",
        r: "/ipex/apply",
        q: {},
        a: {
          i: "EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP",
          m: "",
          s: "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
          a: { eventName: "GLEIF Summit" }
        },
        e: {}
      },
      pathed: {}
    }
    Holder's notifications after marking apply as read:
    {
      start: 0,
      end: 1,
      total: 2,
      notes: [
        {
          i: "0AClCNRGOoJZBwiDMuTpNttr",
          dt: "2025-05-29T20:26:08.596320+00:00",
          r: true,
          a: {
            r: "/exn/ipex/grant",
            d: "EIwfVKdtbymYjpta0WfbUFwFdsoeaMmmPHoT18F29YtJ",
            m: ""
          }
        },
        {
          i: "0ACiPmQnzeDArrst7TIPSeXj",
          dt: "2025-05-29T20:26:14.532869+00:00",
          r: true,
          a: {
            r: "/exn/ipex/apply",
            d: "EM0FJu04eBq241D1GsQW3rbHlGiAvT-AvMml6SlmA7N1",
            m: ""
          }
        }
      ]
    }


### Step 3: Holder Finds Matching Credential

The Holder now needs to find a credential in their possession that satisfies the Verifier's `apply` request (matches the schema SAID and any specified attributes). The code below constructs a filter based on the `applyExchange` data and uses it to search the Holder's credentials.


```typescript
// The apply operation from the Verifier asks for a specific credential 
// (matching schema and attribute values).
// This code snippet creates a credential filter based on the criteria
// from the applyExchange message received by the Holder.

let filter: { [x: string]: any } = { '-s': applyExchange.exn.a.s }; // Filter by schema SAID
// Add attribute filters from the apply request
for (const key in applyExchange.exn.a.a) { // 'a.a' contains the requested attributes
    filter[`-a-${key}`] = applyExchange.exn.a.a[key];
}

console.log("Constructed filter for matching credentials:");
console.log(filter);

// Holder lists credentials matching the filter.
const matchingCredentials = await holderClient.credentials().list({ filter });

console.log("Matching credentials found by Holder:");
console.log(matchingCredentials); // Should list the EventPass credential issued earlier
```

    Constructed filter for matching credentials:
    {
      "-s": "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
      "-a-eventName": "GLEIF Summit"
    }
    Matching credentials found by Holder:
    [
      {
        sad: {
          v: "ACDC10JSON0001c4_",
          d: "EEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS",
          i: "EGAtpZ2APitpDfU3lCohC2u6jZ7yXRa9y7XUVoAkvnQe",
          ri: "ENfYUmF1JYTEEaCWfVoKttTuFLBDcD2TE2TKRB2eio3N",
          s: "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
          a: {
            d: "EEELX_4BhUAmR3nCwdrIvkRMmfA4u9Baf2hA0op3sqyX",
            i: "EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP",
            eventName: "GLEIF Summit",
            accessLevel: "staff",
            validDate: "2026-10-01",
            dt: "2025-05-29T20:26:07.430000+00:00"
          }
        },
        atc: "-IABEEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS0AAAAAAAAAAAAAAAAAAAAAAAEEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS",
        iss: {
          v: "KERI10JSON0000ed_",
          t: "iss",
          d: "EGFhTc9OGQxWTS2M-1E696noMd0bYIluM-8awxQ7DB2I",
          i: "EEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS",
          s: "0",
          ri: "ENfYUmF1JYTEEaCWfVoKttTuFLBDcD2TE2TKRB2eio3N",
          dt: "2025-05-29T20:26:07.430000+00:00"
        },
        issatc: "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAACECGTILLohpdVr4axRrYesklZqJEhH1gknL2HxC6PwkZl",
        pre: "EGAtpZ2APitpDfU3lCohC2u6jZ7yXRa9y7XUVoAkvnQe",
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
            a: { oneOf: [Array] }
          },
          additionalProperties: false,
          required: [ "v", "d", "i", "ri", "s", "a" ]
        },
        chains: [],
        status: {
          vn: [ 1, 0 ],
          i: "EEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS",
          s: "0",
          d: "EGFhTc9OGQxWTS2M-1E696noMd0bYIluM-8awxQ7DB2I",
          ri: "ENfYUmF1JYTEEaCWfVoKttTuFLBDcD2TE2TKRB2eio3N",
          ra: {},
          a: { s: 2, d: "ECGTILLohpdVr4axRrYesklZqJEhH1gknL2HxC6PwkZl" },
          dt: "2025-05-29T20:26:07.430000+00:00",
          et: "iss"
        },
        anchor: {
          pre: "EEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS",
          sn: 0,
          d: "EGFhTc9OGQxWTS2M-1E696noMd0bYIluM-8awxQ7DB2I"
        },
        anc: {
          v: "KERI10JSON00013a_",
          t: "ixn",
          d: "ECGTILLohpdVr4axRrYesklZqJEhH1gknL2HxC6PwkZl",
          i: "EGAtpZ2APitpDfU3lCohC2u6jZ7yXRa9y7XUVoAkvnQe",
          s: "2",
          p: "EKSNPXTx-_l2xeC2wr912wefKgRmtME4XGP7r0lj5Huz",
          a: [
            {
              i: "EEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS",
              s: "0",
              d: "EGFhTc9OGQxWTS2M-1E696noMd0bYIluM-8awxQ7DB2I"
            }
          ]
        },
        ancatc: [
          "-VBq-AABAAAyCV_qCoG8qXv2lg3GvOYjim2VPCCNRBqHTEzw2nvxAlapBmoCf1LpVRa4uTbvkQ9pJ6PU2Va3yKPKVyeP78sK-BADAAAYBDOseqCy2OCBMmQZ0lXBGLUgca0PqjM5JyEvYtwg72Y3D8Q0dhxwsi014Ga0vzNhvYa9DrQKEeyDBPJDWXMBABCLvxIPIngeqhgo3RVbBtwiyq7QsFkLRx7mQfZJKYoDbtc_YuyIpqe4FK8GvpE6C1jhdHSOoslJ6hvSSl2AJ1gKACAc-954eKj8JRgmkZJ8dftUi_a7EKkCD8a40KSg6cAMspAXCEOGwGXFK8ZITXu_s5uZb2Diheq6Xp0Zh6oyulYA-EAB0AAAAAAAAAAAAAAAAAAAAAAA1AAG2025-05-29T20c26c08d686555p00c00"
        ]
      }
    ]


### Step 4: Holder Offers Credential

Assuming a matching credential is found, the Holder prepares an IPEX offer message. This `offer` includes the ACDC they are presenting. This is sent back to the Verifier.


```typescript
// Holder prepares and submits an IPEX offer message with the matching credential.

// Prepare the IPEX offer message.
const [offer, sigsOffer, endOffer] = await holderClient.ipex().offer({
    senderName: holderAidAlias,                   // Alias of the Holder's AID
    recipient: verifierAid.i,                     // AID of the Verifier
    acdc: new Serder(matchingCredentials[0].sad), // The ACDC being offered (first matching credential)
    applySaid: applyExchangeSaid,                 // SAID of the Verifier's apply 'exn' message this offer is responding to
    datetime: createTimestamp(),                  // Timestamp for the offer message
});

// Holder submits the prepared offer message to the Verifier.
const offerOperation = await holderClient
    .ipex()
    .submitOffer(holderAidAlias, offer, sigsOffer, endOffer, [
        verifierAid.i, // Recipient AID
    ]);

// Wait for the submission operation to complete.
const offerResponse = await holderClient
    .operations()
    .wait(offerOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

// Clean up the operation.
await holderClient.operations().delete(offerOperation.name);
console.log("Holder submitted IPEX Offer to Verifier.");


```

    Holder submitted IPEX Offer to Verifier.


### Step 5: Verifier Receives Offer

The Verifier receives a notification for the Holder's `offer`. The Verifier retrieves the exchange details and marks the notification.


```typescript
// Verifier receives the IPEX offer notification from the Holder.

let verifierOfferNotifications;

// Retry loop for the Verifier to receive the offer notification.
for (let attempt = 1; attempt <= DEFAULT_RETRIES ; attempt++) {
    try{
        // List notifications, filtering for unread IPEX_OFFER_ROUTE messages.
        verifierOfferNotifications = await verifierClient.notifications().list(
            (n) => n.a.r === IPEX_OFFER_ROUTE && n.r === false
        );
        if(verifierOfferNotifications.notes.length === 0){ 
            throw new Error("Offer notification not found"); // Throw error to trigger retry
        }
        break; // Exit loop if notification found
    }
    catch (error){    
         console.log(`[Retry] Offer notification not found for Verifier on attempt #${attempt} of ${DEFAULT_RETRIES}`);
         if (attempt === DEFAULT_RETRIES) {
             console.error(`[Retry] Max retries (${DEFAULT_RETRIES}) reached for Verifier's offer notification.`);
             throw error; 
         }
         console.log(`[Retry] Waiting ${DEFAULT_DELAY_MS}ms before next attempt...`);
         await new Promise(resolve => setTimeout(resolve, DEFAULT_DELAY_MS));
    }
}

const offerNotificationForVerifier = verifierOfferNotifications.notes[0]; // Assuming one notification

console.log("Verifier received Offer Notification:");
console.log(offerNotificationForVerifier);

// Retrieve the full IPEX offer exchange details.
const offerExchange = await verifierClient.exchanges().get(offerNotificationForVerifier.a.d);
console.log("Details of Offer Exchange received by Verifier:");
console.log(offerExchange); // This will contain the ACDC presented by the Holder

// Extract the SAID of the offer 'exn' message for use in the agree.
let offerExchangeSaid = offerExchange.exn.d;

// Verifier marks the offer notification as read.
await verifierClient.notifications().mark(offerNotificationForVerifier.i);
console.log("Verifier's notifications after marking offer as read:");
console.log(await verifierClient.notifications().list());
```

    [Retry] Offer notification not found for Verifier on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    Verifier received Offer Notification:
    {
      i: "0ABF2s4SZxsJQEpuLzZ5wpWX",
      dt: "2025-05-29T20:26:20.034377+00:00",
      r: false,
      a: {
        r: "/exn/ipex/offer",
        d: "ED0qDolOD0tD6gHefenknOi-lNZVvMUY4nDCHlQIl2Os",
        m: ""
      }
    }
    Details of Offer Exchange received by Verifier:
    {
      exn: {
        v: "KERI10JSON000376_",
        t: "exn",
        d: "ED0qDolOD0tD6gHefenknOi-lNZVvMUY4nDCHlQIl2Os",
        i: "EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP",
        rp: "EIRdifOx7ot4c2xJ4ph2ipVb8mvry-CAR-NpKeYBMPXx",
        p: "EM0FJu04eBq241D1GsQW3rbHlGiAvT-AvMml6SlmA7N1",
        dt: "2025-05-29T20:26:19.664000+00:00",
        r: "/ipex/offer",
        q: {},
        a: { i: "EIRdifOx7ot4c2xJ4ph2ipVb8mvry-CAR-NpKeYBMPXx", m: "" },
        e: {
          acdc: {
            v: "ACDC10JSON0001c4_",
            d: "EEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS",
            i: "EGAtpZ2APitpDfU3lCohC2u6jZ7yXRa9y7XUVoAkvnQe",
            ri: "ENfYUmF1JYTEEaCWfVoKttTuFLBDcD2TE2TKRB2eio3N",
            s: "EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK",
            a: {
              d: "EEELX_4BhUAmR3nCwdrIvkRMmfA4u9Baf2hA0op3sqyX",
              i: "EL0Gb8ca44xGMt2EkVvUQb2phIv0XopnErfYFkpPpiXP",
              eventName: "GLEIF Summit",
              accessLevel: "staff",
              validDate: "2026-10-01",
              dt: "2025-05-29T20:26:07.430000+00:00"
            }
          },
          d: "EFPuZL2KL2vlJhKctz4uDoEsx9xXA5UXWVq0UzWyFR8n"
        }
      },
      pathed: {}
    }
    Verifier's notifications after marking offer as read:
    {
      start: 0,
      end: 0,
      total: 1,
      notes: [
        {
          i: "0ABF2s4SZxsJQEpuLzZ5wpWX",
          dt: "2025-05-29T20:26:20.034377+00:00",
          r: true,
          a: {
            r: "/exn/ipex/offer",
            d: "ED0qDolOD0tD6gHefenknOi-lNZVvMUY4nDCHlQIl2Os",
            m: ""
          }
        }
      ]
    }


### Step 6: Verifier Agrees and Validates

Finally, the Verifier, after validating the offered credential (which signify-ts does implicitly upon processing the offer and preparing the agree), sends an IPEX agree message back to the Holder. This confirms successful receipt and validation of the presentation.


```typescript
// Verifier prepares and submits an IPEX agree message.

// Prepare the IPEX agree message.
const [agree, sigsAgree, _endAgree] = await verifierClient.ipex().agree({
    senderName: verifierAidAlias, // Alias of the Verifier's AID
    recipient: holderAid.i,       // AID of the Holder
    offerSaid: offerExchangeSaid, // SAID of the Holder's offer 'exn' message this agree is responding to
    datetime: createTimestamp(),  // Timestamp for the agree message
});

// Verifier submits the prepared agree message to the Holder.
const agreeOperation = await verifierClient
    .ipex()
    .submitAgree(verifierAidAlias, agree, sigsAgree, [holderAid.i]);

// Wait for the submission operation to complete.
const agreeResponse = await verifierClient
    .operations()
    .wait(agreeOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

// Clean up the operation.
await verifierClient.operations().delete(agreeOperation.name);
console.log("Verifier submitted IPEX Agree to Holder, completing the presentation exchange.");

// At this point, the Verifier has successfully received and validated the credential.
// The Verifier's client would have stored the presented credential details if needed.
```

    Verifier submitted IPEX Agree to Holder, completing the presentation exchange.


## Credential Revocation by Issuer

Circumstances may require a credential to be invalidated before its intended expiry, or if it has no expiry. This process is known as revocation. Only the original Issuer of a credential can revoke it. Revocation involves the Issuer recording a revocation event in the specific credential's Transaction Event Log (TEL), which is part of the Issuer's Credential Registry. This event is, like all TEL events, anchored to the Issuer's KEL.

The Issuer uses the `issuerClient.credentials().revoke()` method, specifying the alias of their issuing AID and the SAID of the credential to be revoked. This action creates a new event in the TEL associated with the credential, marking its status as revoked.

First, check the credential status before revocation. The status object contains details about the latest event in the credential's TEL. The et field indicates the event type (e.g., iss for issuance).


```typescript

// Log the credential's status from the Issuer's perspective before revocation.
// The 'status' field shows the latest event in the credential's Transaction Event Log (TEL).
// 'et: "iss"' indicates it's currently in an issued state.
const statusBefore = (await issuerClient.credentials().get(credentialSaid)).status;
console.log("Credential status before revocation:", statusBefore);

// Issuer revokes the credential.
// This creates a revocation event in the credential's TEL within the Issuer's registry.
const revokeResult = await issuerClient.credentials().revoke(issuerAidAlias, credentialSaid); // Changed from revokeOperation to revokeResult to get .op
const revokeOperation = revokeResult.op; // Get the operation from the result

// Wait for the revocation operation to complete.
const revokeResponse = await issuerClient
    .operations()
    .wait(revokeOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS)); // Used revokeOperation directly

// Log the credential status after revocation.
// Note the 'et: "rev"' indicating it's now revoked, and the sequence number 's' has incremented.
const statusAfter = (await issuerClient.credentials().get(credentialSaid)).status;
console.log("Credential status after revocation:", statusAfter);



```

    Credential status before revocation: {
      vn: [ 1, 0 ],
      i: "EEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS",
      s: "0",
      d: "EGFhTc9OGQxWTS2M-1E696noMd0bYIluM-8awxQ7DB2I",
      ri: "ENfYUmF1JYTEEaCWfVoKttTuFLBDcD2TE2TKRB2eio3N",
      ra: {},
      a: { s: 2, d: "ECGTILLohpdVr4axRrYesklZqJEhH1gknL2HxC6PwkZl" },
      dt: "2025-05-29T20:26:07.430000+00:00",
      et: "iss"
    }
    Credential status after revocation: {
      vn: [ 1, 0 ],
      i: "EEMwiaqqc-Z-4co3EZIhAsOBHHU1ItiYhljGwAj_dihS",
      s: "1",
      d: "EAWCm0vPTcAnJana1oUZdmB7w_T2UYpq0o3ccV55_LJZ",
      ri: "ENfYUmF1JYTEEaCWfVoKttTuFLBDcD2TE2TKRB2eio3N",
      ra: {},
      a: { s: 3, d: "EHxWGmR378gvTEEzZHsAkhy4luivUzY7YiJoMuCNDoXZ" },
      dt: "2025-05-29T20:26:25.536000+00:00",
      et: "rev"
    }


The output shows the change in the credential's status object:

- Before revocation, `et` (event type) was `iss`.
- After revocation, `et` is `rev`.
- The sequence number `s` of the TEL event also increments, reflecting the new event.
- The digest d of the event changes, as it's a new event.

This demonstrates that the Issuer has successfully updated the credential's status in their registry. Anyone (like a Verifier) who subsequently checks this registry for the credential's status will see that it has been revoked.

Once a Holder becomes aware that a credential they possess has been revoked (e.g., by checking its status in the Issuer's registry or being informed through other means), they should no longer rely on it. It's good practice for the Holder to delete the revoked credential from their local store to prevent accidental presentation.

The `holderClient.credentials().delete()` method removes the credential from the Holder's local client storage.


```typescript
// Holder deletes the (now revoked) credential from their local store.
await holderClient.credentials().delete(credentialSaid);

// Verify the credential is no longer in the Holder's list.
console.log("Holder's credential list after deleting the revoked credential:");
console.log(await holderClient.credentials().list()); // Should be an empty array or not contain the revoked credential

```

    Holder's credential list after deleting the revoked credential:
    []

