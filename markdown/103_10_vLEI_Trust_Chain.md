# vLEI Trust Chain

<div class="alert alert-primary">
<b>🎯 OBJECTIVE</b><hr>
To provide a practical, hands-on demonstration of the vLEI trust chain using Signify-ts. 
</div>

## The simplified vLEI Trust Chain 

To clearly explain the fundamentals of vLEI credentials and schemas, this notebook presents a simplified model of the credential issuance hierarchy. We will trace the flow of authority and the process of creating chained credentials using official vLEI schema definitions. For the sake of clarity, we have excluded the more advanced topics of multisignatures and delegated identifier structures, which are key components of the complete vLEI production trust chain. A practical, in-depth example of these advanced features can be found in the **[qvi-software repository](https://github.com/GLEIF-IT/qvi-software/tree/main/qvi-workflow)**

## Setup Phase

The first step is to create the four distinct identity clients that represent the actors in our scenario: GLEIF, a Qualified vLEI Issuer (QVI), a Legal Entity (LE), and a Role holder. We will establish secure connections between all relevant parties using OOBIs and create the necessary credential registries for the issuers.


```typescript
import { randomPasscode, Saider} from 'npm:signify-ts@0.3.0-rc1';
import { 
  initializeSignify, initializeAndConnectClient, createNewAID, addEndRoleForAID,
  generateOOBI, resolveOOBI, createCredentialRegistry, issueCredential,
  ipexGrantCredential, getCredentialState, waitForAndGetNotification,
  ipexAdmitGrant, markNotificationRead,
  DEFAULT_IDENTIFIER_ARGS, ROLE_AGENT, IPEX_GRANT_ROUTE, IPEX_ADMIT_ROUTE, SCHEMA_SERVER_HOST,
  prTitle, prMessage, prContinue, prAlert, isServiceHealthy, sleep
} from './scripts_ts/utils.ts';

initializeSignify()

// Create clients, AIDs and OOBIs.
prTitle("Creating clients setup")

// Fixed Bran to keep a consistent root of trust (DO NOT MODIFY)
const gleifBran = "Dm8Tmz05CF6_JLX9sVlFe" 
const gleifAlias = 'gleif'
const { client: gleifClient } = await initializeAndConnectClient(gleifBran)
let gleifPrefix

// GLEIF
try{
    const gleifAid = await gleifClient.identifiers().get(gleifAlias);
    gleifPrefix = gleifAid.prefix
} catch {
    prMessage("Creating GLEIF AID")
    const { aid: newAid} = await createNewAID(gleifClient, gleifAlias, DEFAULT_IDENTIFIER_ARGS);
    await addEndRoleForAID(gleifClient, gleifAlias, ROLE_AGENT); 
    gleifPrefix = newAid.i
}
const gleifOOBI = await generateOOBI(gleifClient, gleifAlias, ROLE_AGENT);

prMessage(`GLEIF Prefix: ${gleifPrefix}`)

// QVI
const qviBran = randomPasscode()
const qviAlias = 'qvi'
const { client: qviClient } = await initializeAndConnectClient(qviBran)
const { aid: qviAid} = await createNewAID(qviClient, qviAlias, DEFAULT_IDENTIFIER_ARGS);
await addEndRoleForAID(qviClient, qviAlias, ROLE_AGENT);
const qviOOBI = await generateOOBI(qviClient, qviAlias, ROLE_AGENT);
const qviPrefix = qviAid.i
prMessage(`QVI Prefix: ${qviPrefix}`)

// LE
const leBran = randomPasscode()
const leAlias = 'le'
const { client: leClient } = await initializeAndConnectClient(leBran)
const { aid: leAid} = await createNewAID(leClient, leAlias, DEFAULT_IDENTIFIER_ARGS);
await addEndRoleForAID(leClient, leAlias, ROLE_AGENT);
const leOOBI = await generateOOBI(leClient, leAlias, ROLE_AGENT);
const lePrefix = leAid.i
prMessage(`LE Prefix: ${lePrefix}`)

// Role Holder
const roleBran = randomPasscode()
const roleAlias = 'role'
const { client: roleClient } = await initializeAndConnectClient(roleBran)
const { aid: roleAid} = await createNewAID(roleClient, roleAlias, DEFAULT_IDENTIFIER_ARGS);
await addEndRoleForAID(roleClient, roleAlias, ROLE_AGENT);
const roleOOBI = await generateOOBI(roleClient, roleAlias, ROLE_AGENT);
const rolePrefix = roleAid.i
prMessage(`ROLE Prefix: ${rolePrefix}`)

// Client OOBI resolution (Create contacts)
prTitle("Resolving OOBIs")

await Promise.all([
    resolveOOBI(gleifClient, qviOOBI, qviAlias),
    resolveOOBI(qviClient, gleifOOBI, gleifAlias),
    resolveOOBI(qviClient, leOOBI, leAlias),
    resolveOOBI(qviClient, roleOOBI, roleAlias),
    resolveOOBI(leClient, gleifOOBI, gleifAlias),
    resolveOOBI(leClient, qviOOBI, qviAlias),
    resolveOOBI(leClient, roleOOBI, roleAlias),
    resolveOOBI(roleClient, gleifOOBI, gleifAlias),
    resolveOOBI(roleClient, leOOBI, leAlias),
    resolveOOBI(roleClient, qviOOBI, qviAlias)
]);

// Create Credential Registries
prTitle("Creating Credential Registries")

const { registrySaid: qviRegistrySaid } = await createCredentialRegistry(qviClient, qviAlias, 'qviRegistry')
const { registrySaid: leRegistrySaid } = await createCredentialRegistry(leClient, leAlias, 'leRegistry')

//GLEIF Registry
let gleifRegistrySaid
try{
    const registries = await gleifClient.registries().list(gleifAlias);
    gleifRegistrySaid = registries[0].regk
} catch {
    prMessage("Creating GLEIF Registry")
    const { registrySaid: newRegistrySaid } = await createCredentialRegistry(gleifClient, gleifAlias, 'gleifRegistry')
    gleifRegistrySaid = newRegistrySaid
}

prContinue()
```

    
    [1m[4m[44m[90m  Creating clients setup  [0m
    
    Using Passcode (bran): Dm8Tmz05CF6_JLX9sVlFe
    Signify-ts library initialized.
    Client boot process initiated with KERIA agent.
      Client AID Prefix:  EAahBlwoMzpTutCwwyc8QitdbzrbLXhKLuydIbVOGjCM
      Agent AID Prefix:   EBkzKIrx9k2OJBSnrbx_fcewGxpgTb8SnZ2dgN1DJ2Aw
    
    [1m[94mCreating GLEIF AID[0m
    
    Initiating AID inception for alias: gleif
    Successfully created AID with prefix: EFsQnjOuzAPnQj37T65YvQqpyAgTTvLEkLPampLWr1af
    Assigning 'agent' role to KERIA Agent EBkzKIrx9k2OJBSnrbx_fcewGxpgTb8SnZ2dgN1DJ2Aw for AID alias gleif
    Successfully assigned 'agent' role for AID alias gleif.
    Generating OOBI for AID alias gleif with role agent
    Generated OOBI URL: http://keria:3902/oobi/EFsQnjOuzAPnQj37T65YvQqpyAgTTvLEkLPampLWr1af/agent/EBkzKIrx9k2OJBSnrbx_fcewGxpgTb8SnZ2dgN1DJ2Aw
    
    [1m[94mGLEIF Prefix: EFsQnjOuzAPnQj37T65YvQqpyAgTTvLEkLPampLWr1af[0m
    
    Using Passcode (bran): BtchPnOGvCMsj8k7f62-k
    Client boot process initiated with KERIA agent.
      Client AID Prefix:  EHCI5OwDXjInVn7DgNeCEp_tZPiKkCpAGNIIDTdvGU85
      Agent AID Prefix:   ELNInQmjpHNfgRvVhbD18mQeXl1LesfAmTF97mseudXz
    Initiating AID inception for alias: qvi
    Successfully created AID with prefix: EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj
    Assigning 'agent' role to KERIA Agent ELNInQmjpHNfgRvVhbD18mQeXl1LesfAmTF97mseudXz for AID alias qvi
    Successfully assigned 'agent' role for AID alias qvi.
    Generating OOBI for AID alias qvi with role agent
    Generated OOBI URL: http://keria:3902/oobi/EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj/agent/ELNInQmjpHNfgRvVhbD18mQeXl1LesfAmTF97mseudXz
    
    [1m[94mQVI Prefix: EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj[0m
    
    Using Passcode (bran): CCka0sOjurA-c69C53iGV
    Client boot process initiated with KERIA agent.
      Client AID Prefix:  EMb35Cwpi5KpvJoY354GSh7oy_ovv2vCbO1bAG9-azIL
      Agent AID Prefix:   EGIgbR9DRBLcmrnrSO05mw4cClzqY_e6co1eNS0OxKx6
    Initiating AID inception for alias: le
    Successfully created AID with prefix: EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k
    Assigning 'agent' role to KERIA Agent EGIgbR9DRBLcmrnrSO05mw4cClzqY_e6co1eNS0OxKx6 for AID alias le
    Successfully assigned 'agent' role for AID alias le.
    Generating OOBI for AID alias le with role agent
    Generated OOBI URL: http://keria:3902/oobi/EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k/agent/EGIgbR9DRBLcmrnrSO05mw4cClzqY_e6co1eNS0OxKx6
    
    [1m[94mLE Prefix: EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k[0m
    
    Using Passcode (bran): DNkFV0ZyFFKraynQdvgN5
    Client boot process initiated with KERIA agent.
      Client AID Prefix:  EKARukpYybII9JkGY5UkqrqAnT8xvsCSKa-lQ9aFXjpj
      Agent AID Prefix:   EDY65J6bUJdD1uH2ZK1reF3Zb5mDktpDYPD4H-r6FfVz
    Initiating AID inception for alias: role
    Successfully created AID with prefix: EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs
    Assigning 'agent' role to KERIA Agent EDY65J6bUJdD1uH2ZK1reF3Zb5mDktpDYPD4H-r6FfVz for AID alias role
    Successfully assigned 'agent' role for AID alias role.
    Generating OOBI for AID alias role with role agent
    Generated OOBI URL: http://keria:3902/oobi/EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs/agent/EDY65J6bUJdD1uH2ZK1reF3Zb5mDktpDYPD4H-r6FfVz
    
    [1m[94mROLE Prefix: EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs[0m
    
    
    [1m[4m[44m[90m  Resolving OOBIs  [0m
    
    Resolving OOBI URL: http://keria:3902/oobi/EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj/agent/ELNInQmjpHNfgRvVhbD18mQeXl1LesfAmTF97mseudXz with alias qvi
    Resolving OOBI URL: http://keria:3902/oobi/EFsQnjOuzAPnQj37T65YvQqpyAgTTvLEkLPampLWr1af/agent/EBkzKIrx9k2OJBSnrbx_fcewGxpgTb8SnZ2dgN1DJ2Aw with alias gleif
    Resolving OOBI URL: http://keria:3902/oobi/EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k/agent/EGIgbR9DRBLcmrnrSO05mw4cClzqY_e6co1eNS0OxKx6 with alias le
    Resolving OOBI URL: http://keria:3902/oobi/EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs/agent/EDY65J6bUJdD1uH2ZK1reF3Zb5mDktpDYPD4H-r6FfVz with alias role
    Resolving OOBI URL: http://keria:3902/oobi/EFsQnjOuzAPnQj37T65YvQqpyAgTTvLEkLPampLWr1af/agent/EBkzKIrx9k2OJBSnrbx_fcewGxpgTb8SnZ2dgN1DJ2Aw with alias gleif
    Resolving OOBI URL: http://keria:3902/oobi/EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj/agent/ELNInQmjpHNfgRvVhbD18mQeXl1LesfAmTF97mseudXz with alias qvi
    Resolving OOBI URL: http://keria:3902/oobi/EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs/agent/EDY65J6bUJdD1uH2ZK1reF3Zb5mDktpDYPD4H-r6FfVz with alias role
    Resolving OOBI URL: http://keria:3902/oobi/EFsQnjOuzAPnQj37T65YvQqpyAgTTvLEkLPampLWr1af/agent/EBkzKIrx9k2OJBSnrbx_fcewGxpgTb8SnZ2dgN1DJ2Aw with alias gleif
    Resolving OOBI URL: http://keria:3902/oobi/EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k/agent/EGIgbR9DRBLcmrnrSO05mw4cClzqY_e6co1eNS0OxKx6 with alias le
    Resolving OOBI URL: http://keria:3902/oobi/EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj/agent/ELNInQmjpHNfgRvVhbD18mQeXl1LesfAmTF97mseudXz with alias qvi
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Contact "gleif" added/updated.
    Contact "qvi" added/updated.
    Contact "qvi" added/updated.
    Contact "gleif" added/updated.
    Contact "role" added/updated.
    Contact "le" added/updated.
    Contact "qvi" added/updated.
    Contact "role" added/updated.
    Contact "gleif" added/updated.
    Contact "le" added/updated.
    
    [1m[4m[44m[90m  Creating Credential Registries  [0m
    
    Creating credential registry "qviRegistry" for AID alias "qvi"...
    Successfully created credential registry: EEZXpqjCsXQszkRh9VO8KmNXJaGi7zTCgh9Xzi17Guwo
    Creating credential registry "leRegistry" for AID alias "le"...
    Successfully created credential registry: EEe46QMdH8JHZ6AppJ-NkDN31OM70CURQwzfmAy-pn0B
    
    [1m[94mCreating GLEIF Registry[0m
    
    Creating credential registry "gleifRegistry" for AID alias "gleif"...
    Successfully created credential registry: EHL34riBhZia4-m2nD7ZFYnSRRQLojE2V8xFAz4IKgp5
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


## Schema Resolution

For any party to issue or verify a credential, they must first have a copy of its corresponding schema. The schemas define the structure, attributes, and rules for each type of vLEI credential. In this ecosystem, schemas are identified by a SAID and are hosted on a schema server. All participants will resolve the OOBIs for the schemas they need to interact with.

The schemas used in this demonstration are:

- **QVI Credential**: Issued by GLEIF to a QVI, authorizing it to issue vLEI credentials.
- **vLEI Credential**: Issued by a QVI to a Legal Entity, representing its digital identity.
- **OOR Auth Credential**: An authorization issued by a Legal Entity to a QVI, permitting the QVI to issue a specific OOR credential on its behalf.
- **OOR Credential**: Issued to an individual in an official capacity (e.g., CEO), based on an OOR authorization.
- **ECR Auth Credential**: An authorization issued by a Legal Entity, permitting another party (like a QVI) to issue an ECR credential on its behalf.
- **ECR Credential**: Issued to an individual for a specific business role or context (e.g., Project Manager), based on an ECR authorization or issued directly by the LE.

<div class="alert alert-info">
<b>ℹ️ NOTE</b><hr>
For this demonstration, the vLEI schemas are pre-loaded into our local schema server, and their SAIDs are known beforehand.
</div>


```typescript
// Schemas

// vLEI Schema SAIDs. These are well known schemas. Already preloaded
const QVI_SCHEMA_SAID = 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao';
const LE_SCHEMA_SAID = 'ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY';
const ECR_AUTH_SCHEMA_SAID = 'EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g';
const ECR_SCHEMA_SAID = 'EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw';
const OOR_AUTH_SCHEMA_SAID = 'EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E';
const OOR_SCHEMA_SAID = 'EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy';

const QVI_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${QVI_SCHEMA_SAID}`;
const LE_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${LE_SCHEMA_SAID}`;
const ECR_AUTH_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${ECR_AUTH_SCHEMA_SAID}`;
const ECR_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${ECR_SCHEMA_SAID}`;
const OOR_AUTH_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${OOR_AUTH_SCHEMA_SAID}`;
const OOR_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${OOR_SCHEMA_SAID}`;

prTitle("Schema OOBIs")
prMessage(`QVI_SCHEMA_URL: ${QVI_SCHEMA_URL}`)
prMessage(`LE_SCHEMA_URL: ${LE_SCHEMA_URL}`)
prMessage(`ECR_AUTH_SCHEMA_URL: ${ECR_AUTH_SCHEMA_URL}`)
prMessage(`ECR_SCHEMA_URL: ${ECR_SCHEMA_URL}`)
prMessage(`OOR_AUTH_SCHEMA_URL: ${OOR_AUTH_SCHEMA_URL}`)
prMessage(`OOR_SCHEMA_URL: ${OOR_SCHEMA_URL}`)

prContinue()
```

    
    [1m[4m[44m[90m  Schema OOBIs  [0m
    
    
    [1m[94mQVI_SCHEMA_URL: http://vlei-server:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao[0m
    
    
    [1m[94mLE_SCHEMA_URL: http://vlei-server:7723/oobi/ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY[0m
    
    
    [1m[94mECR_AUTH_SCHEMA_URL: http://vlei-server:7723/oobi/EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g[0m
    
    
    [1m[94mECR_SCHEMA_URL: http://vlei-server:7723/oobi/EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw[0m
    
    
    [1m[94mOOR_AUTH_SCHEMA_URL: http://vlei-server:7723/oobi/EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E[0m
    
    
    [1m[94mOOR_SCHEMA_URL: http://vlei-server:7723/oobi/EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy[0m
    
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


All clients now resolve all the necessary schemas.


```typescript
prTitle("Resolving Schemas")
await Promise.all([
    resolveOOBI(gleifClient, QVI_SCHEMA_URL),
    
    resolveOOBI(qviClient, QVI_SCHEMA_URL),
    resolveOOBI(qviClient, LE_SCHEMA_URL),
    resolveOOBI(qviClient, ECR_AUTH_SCHEMA_URL),
    resolveOOBI(qviClient, ECR_SCHEMA_URL),
    resolveOOBI(qviClient, OOR_AUTH_SCHEMA_URL),
    resolveOOBI(qviClient, OOR_SCHEMA_URL),
    
    resolveOOBI(leClient, QVI_SCHEMA_URL),
    resolveOOBI(leClient, LE_SCHEMA_URL),
    resolveOOBI(leClient, ECR_AUTH_SCHEMA_URL),
    resolveOOBI(leClient, ECR_SCHEMA_URL),
    resolveOOBI(leClient, OOR_AUTH_SCHEMA_URL),
    resolveOOBI(leClient, OOR_SCHEMA_URL),
    
    resolveOOBI(roleClient, QVI_SCHEMA_URL),
    resolveOOBI(roleClient, LE_SCHEMA_URL),
    resolveOOBI(roleClient, ECR_AUTH_SCHEMA_URL),
    resolveOOBI(roleClient, ECR_SCHEMA_URL),
    resolveOOBI(roleClient, OOR_AUTH_SCHEMA_URL),
    resolveOOBI(roleClient, OOR_SCHEMA_URL),
]);

prContinue()
```

    
    [1m[4m[44m[90m  Resolving Schemas  [0m
    
    Resolving OOBI URL: http://vlei-server:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E with alias undefined
    Resolving OOBI URL: http://vlei-server:7723/oobi/EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy with alias undefined
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Successfully resolved OOBI URL. Response: OK
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    Contact "undefined" added/updated.
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


## Credential Issuance Chain
The core of this demonstration is to build the vLEI trust chain credential by credential. The test follows the official vLEI ecosystem hierarchy, showing how authority is passed down from GLEIF to a QVI, then to a Legal Entity, and finally to an individual Role Holder.

The issuance flow is as follows:

- **QVI Credential**: GLEIF issues a "Qualified vLEI Issuer" credential to the QVI.
- **LE Credential**: The QVI issues a "Legal Entity" credential to the LE.
- **OOR Auth Credential**: The LE issues an "Official Organizational Role" authorization to the QVI.
- **OOR Credential**: The QVI, using the authorization from the previous step, issues the final OOR credential to the Role holder.
- **ECR Auth Credential**: The LE issues an "Engagement Context Role" authorization credential to the QVI.
- **ECR Credential (Path 1)**: The LE directly issues an ECR credential to the Role holder.
- **ECR Credential (Path 2)**: The QVI issues another ECR credential to the same Role holder, this time using the ECR authorization credential.

The key to this chain of trust lies within the `e` (edges) block of each ACDC. This block contains cryptographic pointers to the credential that authorizes the issuance of the current one. We will examine these edge blocks at each step to see how the chain is formed.

### Step 1: QVI Credential - GLEIF issues a Qualified vLEI Issuer credential to the QVI

The chain of trust begins with GLEIF, the root of the ecosystem, issuing a credential to a QVI. This credential attests that the QVI is qualified and authorized to issue vLEI credentials to other legal entities. As the first link in our chain, this credential does not have an edge block pointing to a prior authority.




```typescript
// QVI LEI (Arbitrary value)
const qviData = {
    LEI: '254900OPPU84GM83MG36',
};

// GLEIF - Issue credential
prTitle("Issuing Credential")
const { credentialSaid: credentialSaid} = await issueCredential(
    gleifClient, gleifAlias, gleifRegistrySaid, 
    QVI_SCHEMA_SAID, 
    qviPrefix, 
    qviData
)

// GLEIF - get credential
const qviCredential = await gleifClient.credentials().get(credentialSaid);

// GLEIF - Ipex grant
prTitle("Granting Credential")
const grantResponse = await ipexGrantCredential(
    gleifClient, gleifAlias, 
    qviPrefix, 
    qviCredential
)

// QVI - Wait for grant notification
const grantNotifications = await waitForAndGetNotification(qviClient, IPEX_GRANT_ROUTE)
const grantNotification = grantNotifications[0]

// QVI - Admit Grant
prTitle("Admitting Grant")
const admitResponse = await ipexAdmitGrant(
    qviClient, qviAlias,
    gleifPrefix, 
    grantNotification.a.d
)

// QVI - Mark notification
await markNotificationRead(qviClient, grantNotification.i)

// GLEIF - Wait for admit notification
const admitNotifications = await waitForAndGetNotification(gleifClient, IPEX_ADMIT_ROUTE)
const admitNotification = admitNotifications[0]

// GLEIF - Mark notification
await markNotificationRead(gleifClient, admitNotification.i)

prContinue()
```

    
    [1m[4m[44m[90m  Issuing Credential  [0m
    
    Issuing credential from AID "gleif" to AID "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj"...
    {
      name: "credential.EMX_-55TpNEMsAAQ1sP_fgsJBOTZtBZ8uUBY1gHWn4Ir",
      metadata: {
        ced: {
          v: "ACDC10JSON000197_",
          d: "EMX_-55TpNEMsAAQ1sP_fgsJBOTZtBZ8uUBY1gHWn4Ir",
          i: "EFsQnjOuzAPnQj37T65YvQqpyAgTTvLEkLPampLWr1af",
          ri: "EHL34riBhZia4-m2nD7ZFYnSRRQLojE2V8xFAz4IKgp5",
          s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
          a: {
            d: "ENbPEr99fQhA4ubAZZ51mk5YhG-qpY4ZYRxXZP4BmjDi",
            i: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
            LEI: "254900OPPU84GM83MG36",
            dt: "2025-06-24T19:28:06.520000+00:00"
          }
        },
        depends: {
          name: "witness.EDNh6dd9i8dC8NLCVsSVRT0Hptu6sYxgXpdjhE7dAxeK",
          metadata: { pre: "EFsQnjOuzAPnQj37T65YvQqpyAgTTvLEkLPampLWr1af", sn: 2 },
          done: false,
          error: null,
          response: null
        }
      },
      done: true,
      error: null,
      response: {
        ced: {
          v: "ACDC10JSON000197_",
          d: "EMX_-55TpNEMsAAQ1sP_fgsJBOTZtBZ8uUBY1gHWn4Ir",
          i: "EFsQnjOuzAPnQj37T65YvQqpyAgTTvLEkLPampLWr1af",
          ri: "EHL34riBhZia4-m2nD7ZFYnSRRQLojE2V8xFAz4IKgp5",
          s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
          a: {
            d: "ENbPEr99fQhA4ubAZZ51mk5YhG-qpY4ZYRxXZP4BmjDi",
            i: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
            LEI: "254900OPPU84GM83MG36",
            dt: "2025-06-24T19:28:06.520000+00:00"
          }
        }
      }
    }
    Successfully issued credential with SAID: EMX_-55TpNEMsAAQ1sP_fgsJBOTZtBZ8uUBY1gHWn4Ir
    
    [1m[4m[44m[90m  Granting Credential  [0m
    
    AID "gleif" granting credential to AID "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj" via IPEX...
    Successfully submitted IPEX grant from "gleif" to "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
    [1m[4m[44m[90m  Admitting Grant  [0m
    
    AID "qvi" admitting IPEX grant "ENwrfkOO9SbI6KazXfKr-NMw02giqWz3oePneESH0x8G" from AID "EFsQnjOuzAPnQj37T65YvQqpyAgTTvLEkLPampLWr1af"...
    Successfully submitted IPEX admit for grant "ENwrfkOO9SbI6KazXfKr-NMw02giqWz3oePneESH0x8G".
    Marking notification "0ABAfWuT1savZxRAgcqY802o" as read...
    Notification "0ABAfWuT1savZxRAgcqY802o" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0ACXq-gsPShb6IKYTXwp3tJd" as read...
    Notification "0ACXq-gsPShb6IKYTXwp3tJd" marked as read.
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


### Step 2: LE Credential - QVI issues a Legal Entity credential to the LE

Now that the QVI is authorized, it can issue a vLEI credential to a Legal Entity. To maintain the chain of trust, this new LE Credential must be cryptographically linked back to the QVI's authorizing credential.

This link is created in the `leEdge` object.

- `n: qviCredential.sad.d`: The `n` field (node) is populated with the SAID of the QVI's own credential, issued in Step 1. This is the direct cryptographic pointer.
- `s: qviCredential.sad.s`: The `s` field specifies the required schema SAID of the credential being pointed to, ensuring the link is to the correct type of credential.

The `Saider.saidify()` function is a utility that makes this edge block itself verifiable. It calculates a cryptographic digest (SAID) of the edge's content and embeds that digest back into the block under the `d` field.


```typescript
// Credential Data
const leData = {
    LEI: '875500ELOZEL05BVXV37',
};

const leEdge = Saider.saidify({
    d: '',
    qvi: {
        n: qviCredential.sad.d,
        s: qviCredential.sad.s,
    },
})[1];

const leRules = Saider.saidify({
    d: '',
    usageDisclaimer: {
        l: 'Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.',
    },
    issuanceDisclaimer: {
        l: 'All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.',
    },
})[1];

// qvi - Issue credential
prTitle("Issuing Credential")
const { credentialSaid: credentialSaid} = await issueCredential(
    qviClient, qviAlias, qviRegistrySaid, 
    LE_SCHEMA_SAID, 
    lePrefix,
    leData, leEdge, leRules
)

// qvi - get credential (with all its data)
prTitle("Granting Credential")
const leCredential = await qviClient.credentials().get(credentialSaid);

// qvi - Ipex grant
const grantResponse = await ipexGrantCredential(
    qviClient, qviAlias, 
    lePrefix, 
    leCredential
)

// LE - Wait for grant notification
const grantNotifications = await waitForAndGetNotification(leClient, IPEX_GRANT_ROUTE)
const grantNotification = grantNotifications[0]

// LE - Admit Grant
prTitle("Admitting Grant")
const admitResponse = await ipexAdmitGrant(
    leClient, leAlias,
    qviPrefix, 
    grantNotification.a.d
)

// LE - Mark notification
await markNotificationRead(leClient, grantNotification.i)

// QVI - Wait for admit notification
const admitNotifications = await waitForAndGetNotification(qviClient, IPEX_ADMIT_ROUTE)
const admitNotification = admitNotifications[0]

// QVI - Mark notification
await markNotificationRead(qviClient, admitNotification.i)

prContinue()
```

    
    [1m[4m[44m[90m  Issuing Credential  [0m
    
    Issuing credential from AID "qvi" to AID "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k"...
    {
      name: "credential.EAJX9B1r2nC5alvdvAE4qskkoGdnxtJD2YtRVCsF8TAy",
      metadata: {
        ced: {
          v: "ACDC10JSON0005c8_",
          d: "EAJX9B1r2nC5alvdvAE4qskkoGdnxtJD2YtRVCsF8TAy",
          i: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
          ri: "EEZXpqjCsXQszkRh9VO8KmNXJaGi7zTCgh9Xzi17Guwo",
          s: "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY",
          a: {
            d: "EIGxwpgaWf7pn-8OCu4Uxb5hUEunZjQWYdOBf1Gb1tsc",
            i: "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k",
            LEI: "875500ELOZEL05BVXV37",
            dt: "2025-06-24T19:28:14.963000+00:00"
          },
          e: {
            d: "EJ3HU09tREilsDI4_D9fBHNoWxKT47Xx3VOLjZrFbTMX",
            qvi: {
              n: "EMX_-55TpNEMsAAQ1sP_fgsJBOTZtBZ8uUBY1gHWn4Ir",
              s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao"
            }
          },
          r: {
            d: "EGZ97EjPSINR-O-KHDN_uw4fdrTxeuRXrqT5ZHHQJujQ",
            usageDisclaimer: {
              l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled."
            },
            issuanceDisclaimer: {
              l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework."
            }
          }
        },
        depends: {
          name: "witness.EJMCBf6xmkCJbJubb-iArh1H3GiGNZ8Fr_qK5EkGHgOf",
          metadata: { pre: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj", sn: 2 },
          done: false,
          error: null,
          response: null
        }
      },
      done: true,
      error: null,
      response: {
        ced: {
          v: "ACDC10JSON0005c8_",
          d: "EAJX9B1r2nC5alvdvAE4qskkoGdnxtJD2YtRVCsF8TAy",
          i: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
          ri: "EEZXpqjCsXQszkRh9VO8KmNXJaGi7zTCgh9Xzi17Guwo",
          s: "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY",
          a: {
            d: "EIGxwpgaWf7pn-8OCu4Uxb5hUEunZjQWYdOBf1Gb1tsc",
            i: "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k",
            LEI: "875500ELOZEL05BVXV37",
            dt: "2025-06-24T19:28:14.963000+00:00"
          },
          e: {
            d: "EJ3HU09tREilsDI4_D9fBHNoWxKT47Xx3VOLjZrFbTMX",
            qvi: {
              n: "EMX_-55TpNEMsAAQ1sP_fgsJBOTZtBZ8uUBY1gHWn4Ir",
              s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao"
            }
          },
          r: {
            d: "EGZ97EjPSINR-O-KHDN_uw4fdrTxeuRXrqT5ZHHQJujQ",
            usageDisclaimer: {
              l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled."
            },
            issuanceDisclaimer: {
              l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework."
            }
          }
        }
      }
    }
    Successfully issued credential with SAID: EAJX9B1r2nC5alvdvAE4qskkoGdnxtJD2YtRVCsF8TAy
    
    [1m[4m[44m[90m  Granting Credential  [0m
    
    AID "qvi" granting credential to AID "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k" via IPEX...
    Successfully submitted IPEX grant from "qvi" to "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
    [1m[4m[44m[90m  Admitting Grant  [0m
    
    AID "le" admitting IPEX grant "EO5FFydeFpyTuxFGAphJgE8suKA5XT8BrhQcech7Ysrl" from AID "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj"...
    Successfully submitted IPEX admit for grant "EO5FFydeFpyTuxFGAphJgE8suKA5XT8BrhQcech7Ysrl".
    Marking notification "0AAOLWMCBBJ8iWiFUwjTLEyw" as read...
    Notification "0AAOLWMCBBJ8iWiFUwjTLEyw" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0AAbAhCfnveF8xdo8ip8L9iH" as read...
    Notification "0AAbAhCfnveF8xdo8ip8L9iH" marked as read.
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


### Step 3: OOR AUTH Credential - LE issues an Official Organizational Role authorization to QVI

Before a QVI can issue a credential for an official role (like CEO or Director) on behalf of a Legal Entity, it must first receive explicit authorization. This step shows the LE issuing an "OOR Authorization" credential to the QVI.

The edge block here links back to the `leCredential` from **Step 2**, proving that the entity granting this authorization is a valid Legal Entity within the vLEI ecosystem.


```typescript
// Credential Data
const oorAuthData = {
    AID: '',
    LEI: leData.LEI,
    personLegalName: 'Jane Doe',
    officialRole: 'CEO',
};

const oorAuthEdge = Saider.saidify({
    d: '',
    le: {
        n: leCredential.sad.d,
        s: leCredential.sad.s,
    },
})[1];

// LE - Issue credential
prTitle("Issuing Credential")

const { credentialSaid: credentialSaid} = await issueCredential(
    leClient, leAlias, leRegistrySaid, 
    OOR_AUTH_SCHEMA_SAID,
    qviPrefix,
    oorAuthData, oorAuthEdge, leRules // Reuses LE rules
)

// LE - get credential
const oorAuthCredential = await leClient.credentials().get(credentialSaid);

// LE - Ipex grant
prTitle("Granting Credential")

const grantResponse = await ipexGrantCredential(
    leClient, leAlias, 
    qviPrefix,
    oorAuthCredential
)

// QVI - Wait for grant notification
const grantNotifications = await waitForAndGetNotification(qviClient, IPEX_GRANT_ROUTE)
const grantNotification = grantNotifications[0]

// QVI - Admit Grant
prTitle("Admitting Grant")
const admitResponse = await ipexAdmitGrant(
    qviClient, qviAlias,
    lePrefix,
    grantNotification.a.d
)

// QVI - Mark notification
await markNotificationRead(qviClient, grantNotification.i)

// LE - Wait for admit notification
const admitNotifications = await waitForAndGetNotification(leClient, IPEX_ADMIT_ROUTE)
const admitNotification = admitNotifications[0]

// LE - Mark notification
await markNotificationRead(leClient, admitNotification.i)

prContinue()
```

    
    [1m[4m[44m[90m  Issuing Credential  [0m
    
    Issuing credential from AID "le" to AID "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj"...
    {
      name: "credential.EKCJnq0kZpnOuRGf4fJOKb-nwE-JnoxaP-e1Z3D9gC0G",
      metadata: {
        ced: {
          v: "ACDC10JSON000602_",
          d: "EKCJnq0kZpnOuRGf4fJOKb-nwE-JnoxaP-e1Z3D9gC0G",
          i: "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k",
          ri: "EEe46QMdH8JHZ6AppJ-NkDN31OM70CURQwzfmAy-pn0B",
          s: "EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E",
          a: {
            d: "EBw6ECiZoLcqpTZ2hDc8aGvGJOnxA1pTC_v9jDDSIaer",
            i: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
            AID: "",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "Jane Doe",
            officialRole: "CEO",
            dt: "2025-06-24T19:28:23.279000+00:00"
          },
          e: {
            d: "EBLcpP6yJD-71Hcgs_XmE4-gALyAktRkuFjDh_iESNv2",
            le: {
              n: "EAJX9B1r2nC5alvdvAE4qskkoGdnxtJD2YtRVCsF8TAy",
              s: "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY"
            }
          },
          r: {
            d: "EGZ97EjPSINR-O-KHDN_uw4fdrTxeuRXrqT5ZHHQJujQ",
            usageDisclaimer: {
              l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled."
            },
            issuanceDisclaimer: {
              l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework."
            }
          }
        },
        depends: {
          name: "witness.ENmLCePedmccHm3xXbpxqQmoytpisIj8Tlz-fLz2m2Zr",
          metadata: { pre: "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k", sn: 2 },
          done: false,
          error: null,
          response: null
        }
      },
      done: true,
      error: null,
      response: {
        ced: {
          v: "ACDC10JSON000602_",
          d: "EKCJnq0kZpnOuRGf4fJOKb-nwE-JnoxaP-e1Z3D9gC0G",
          i: "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k",
          ri: "EEe46QMdH8JHZ6AppJ-NkDN31OM70CURQwzfmAy-pn0B",
          s: "EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E",
          a: {
            d: "EBw6ECiZoLcqpTZ2hDc8aGvGJOnxA1pTC_v9jDDSIaer",
            i: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
            AID: "",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "Jane Doe",
            officialRole: "CEO",
            dt: "2025-06-24T19:28:23.279000+00:00"
          },
          e: {
            d: "EBLcpP6yJD-71Hcgs_XmE4-gALyAktRkuFjDh_iESNv2",
            le: {
              n: "EAJX9B1r2nC5alvdvAE4qskkoGdnxtJD2YtRVCsF8TAy",
              s: "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY"
            }
          },
          r: {
            d: "EGZ97EjPSINR-O-KHDN_uw4fdrTxeuRXrqT5ZHHQJujQ",
            usageDisclaimer: {
              l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled."
            },
            issuanceDisclaimer: {
              l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework."
            }
          }
        }
      }
    }
    Successfully issued credential with SAID: EKCJnq0kZpnOuRGf4fJOKb-nwE-JnoxaP-e1Z3D9gC0G
    
    [1m[4m[44m[90m  Granting Credential  [0m
    
    AID "le" granting credential to AID "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj" via IPEX...
    Successfully submitted IPEX grant from "le" to "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
    [1m[4m[44m[90m  Admitting Grant  [0m
    
    AID "qvi" admitting IPEX grant "EK5zNJ109LddO0Y3eFdDdr5xG0i0d-QNWBDmGIR2Jjo6" from AID "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k"...
    Successfully submitted IPEX admit for grant "EK5zNJ109LddO0Y3eFdDdr5xG0i0d-QNWBDmGIR2Jjo6".
    Marking notification "0ADMM0B19VV8lc8Q1EkFHJTN" as read...
    Notification "0ADMM0B19VV8lc8Q1EkFHJTN" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0AAN4p3hjOtNKKllAJ4NA2WD" as read...
    Notification "0AAN4p3hjOtNKKllAJ4NA2WD" marked as read.
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


### Step 4: OOR Credential - QVI issues the final OOR credential to the Role holder

Now, with the specific OOR authorization from the LE, the QVI can issue the final OOR credential to the individual Role Holder.

This is a critical link in the chain. The edge block in this new credential points to the `oorAuthCredential` from **Step 3**.

- `o: 'I2I'`: It uses the `I2I` (Issuer-to-Issuee) operator. This enforces a strict rule during verification, the issuer of this OOR credential (the QVI) must be the same entity as the issuee of the authorization credential it's pointing to. This cryptographically proves that the QVI had the correct, specific authorization from the LE to issue this very role credential.


```typescript
// Credential Data
const oorData = {
    LEI: oorAuthData.LEI,
    personLegalName: oorAuthData.personLegalName,
    officialRole: oorAuthData.officialRole,
};

const oorEdge = Saider.saidify({
    d: '',
    auth: {
        n: oorAuthCredential.sad.d,
        s: oorAuthCredential.sad.s,
        o: 'I2I',
    },
})[1];

// QVI - Issue credential
prTitle("Issuing Credential")
const { credentialSaid: credentialSaid} = await issueCredential(
    qviClient, qviAlias, qviRegistrySaid, 
    OOR_SCHEMA_SAID,
    rolePrefix,
    oorData, oorEdge, leRules // Reuses LE rules
)

// QVI - get credential (with all its data)
prTitle("Granting Credential")
const oorCredential = await qviClient.credentials().get(credentialSaid);

// QVI - Ipex grant
const grantResponse = await ipexGrantCredential(
    qviClient, qviAlias, 
    rolePrefix,
    oorCredential
)

// ROLE - Wait for grant notification
const grantNotifications = await waitForAndGetNotification(roleClient, IPEX_GRANT_ROUTE)
const grantNotification = grantNotifications[0]

// ROLE - Admit Grant
prTitle("Admitting Grant")
const admitResponse = await ipexAdmitGrant(
    roleClient, roleAlias,
    qviPrefix,
    grantNotification.a.d
)

// LE - Mark notification
await markNotificationRead(roleClient, grantNotification.i)

// QVI - Wait for admit notification
const admitNotifications = await waitForAndGetNotification(qviClient, IPEX_ADMIT_ROUTE)
const admitNotification = admitNotifications[0]

// QVI - Mark notification
await markNotificationRead(qviClient, admitNotification.i)

prContinue()
```

    
    [1m[4m[44m[90m  Issuing Credential  [0m
    
    Issuing credential from AID "qvi" to AID "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs"...
    {
      name: "credential.EANGkhcjCzpnOgVHdJHH8Q7hAuh5Opko5_n2LaDYKKqx",
      metadata: {
        ced: {
          v: "ACDC10JSON000605_",
          d: "EANGkhcjCzpnOgVHdJHH8Q7hAuh5Opko5_n2LaDYKKqx",
          i: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
          ri: "EEZXpqjCsXQszkRh9VO8KmNXJaGi7zTCgh9Xzi17Guwo",
          s: "EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy",
          a: {
            d: "ECAvuwOzcqNxtoy_kJXWA972eDylUN1HUP11BRrekA8y",
            i: "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "Jane Doe",
            officialRole: "CEO",
            dt: "2025-06-24T19:28:31.676000+00:00"
          },
          e: {
            d: "EGswrWhV3qRiSS4hdFCH3qoWIXOn3UsZYGuo3M1R1F5b",
            auth: {
              n: "EKCJnq0kZpnOuRGf4fJOKb-nwE-JnoxaP-e1Z3D9gC0G",
              s: "EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E",
              o: "I2I"
            }
          },
          r: {
            d: "EGZ97EjPSINR-O-KHDN_uw4fdrTxeuRXrqT5ZHHQJujQ",
            usageDisclaimer: {
              l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled."
            },
            issuanceDisclaimer: {
              l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework."
            }
          }
        },
        depends: {
          name: "witness.EPSa5iSXmD3Zo3GyyhI46r3MbRQHtnpNY_n0bWrOZ-lt",
          metadata: { pre: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj", sn: 3 },
          done: false,
          error: null,
          response: null
        }
      },
      done: true,
      error: null,
      response: {
        ced: {
          v: "ACDC10JSON000605_",
          d: "EANGkhcjCzpnOgVHdJHH8Q7hAuh5Opko5_n2LaDYKKqx",
          i: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
          ri: "EEZXpqjCsXQszkRh9VO8KmNXJaGi7zTCgh9Xzi17Guwo",
          s: "EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy",
          a: {
            d: "ECAvuwOzcqNxtoy_kJXWA972eDylUN1HUP11BRrekA8y",
            i: "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "Jane Doe",
            officialRole: "CEO",
            dt: "2025-06-24T19:28:31.676000+00:00"
          },
          e: {
            d: "EGswrWhV3qRiSS4hdFCH3qoWIXOn3UsZYGuo3M1R1F5b",
            auth: {
              n: "EKCJnq0kZpnOuRGf4fJOKb-nwE-JnoxaP-e1Z3D9gC0G",
              s: "EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E",
              o: "I2I"
            }
          },
          r: {
            d: "EGZ97EjPSINR-O-KHDN_uw4fdrTxeuRXrqT5ZHHQJujQ",
            usageDisclaimer: {
              l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled."
            },
            issuanceDisclaimer: {
              l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework."
            }
          }
        }
      }
    }
    Successfully issued credential with SAID: EANGkhcjCzpnOgVHdJHH8Q7hAuh5Opko5_n2LaDYKKqx
    
    [1m[4m[44m[90m  Granting Credential  [0m
    
    AID "qvi" granting credential to AID "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs" via IPEX...
    Successfully submitted IPEX grant from "qvi" to "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
    [1m[4m[44m[90m  Admitting Grant  [0m
    
    AID "role" admitting IPEX grant "EJbTD2HKb5URPnNDSrhtwUFfA4QUFJDYRwClz1tFsK5m" from AID "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj"...
    Successfully submitted IPEX admit for grant "EJbTD2HKb5URPnNDSrhtwUFfA4QUFJDYRwClz1tFsK5m".
    Marking notification "0ABtk0hea0sm8mQifhmg1Ulm" as read...
    Notification "0ABtk0hea0sm8mQifhmg1Ulm" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0ACeC9sVwEwhq0oWprIKHMv1" as read...
    Notification "0ACeC9sVwEwhq0oWprIKHMv1" marked as read.
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


### Step 5: ECR AUTH Credential - LE issues an ECR authorization credential to the QVI

This flow mirrors the OOR authorization. The LE issues an Engagement Context Role (ECR) authorization to the QVI. This allows the QVI to issue credentials for non-official but contextually important roles (e.g., "Project Lead," "Authorized Signatory for Invoices"). The `ecrAuthEdge` again links to the LE's root credential to prove the source of the authorization.



```typescript
// Credential Data
const ecrAuthData = {
    AID: '',
    LEI: leData.LEI,
    personLegalName: 'John Doe',
    engagementContextRole: 'Managing Director',
};

const ecrAuthEdge = Saider.saidify({
    d: '',
    le: {
        n: leCredential.sad.d,
        s: leCredential.sad.s,
    },
})[1];

const ecrAuthRules = Saider.saidify({
    d: '',
    usageDisclaimer: {
        l: 'Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.',
    },
    issuanceDisclaimer: {
        l: 'All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.',
    },
    privacyDisclaimer: {
        l: 'Privacy Considerations are applicable to QVI ECR AUTH vLEI Credentials.  It is the sole responsibility of QVIs as Issuees of QVI ECR AUTH vLEI Credentials to present these Credentials in a privacy-preserving manner using the mechanisms provided in the Issuance and Presentation Exchange (IPEX) protocol specification and the Authentic Chained Data Container (ACDC) specification.  https://github.com/WebOfTrust/IETF-IPEX and https://github.com/trustoverip/tswg-acdc-specification.',
    },
})[1];

// LE - Issue credential
prTitle("Issuing Credential")

const { credentialSaid: credentialSaid} = await issueCredential(
    leClient, leAlias, leRegistrySaid, 
    ECR_AUTH_SCHEMA_SAID,
    qviPrefix,
    ecrAuthData, ecrAuthEdge, ecrAuthRules
)

// LE - get credential
const ecrAuthCredential = await leClient.credentials().get(credentialSaid);

// LE - Ipex grant
prTitle("Granting Credential")

const grantResponse = await ipexGrantCredential(
    leClient, leAlias, 
    qviPrefix,
    ecrAuthCredential
)

// QVI - Wait for grant notification
const grantNotifications = await waitForAndGetNotification(qviClient, IPEX_GRANT_ROUTE)
const grantNotification = grantNotifications[0]

// QVI - Admit Grant
prTitle("Admitting Grant")
const admitResponse = await ipexAdmitGrant(
    qviClient, qviAlias,
    lePrefix,
    grantNotification.a.d
)

// QVI - Mark notification
await markNotificationRead(qviClient, grantNotification.i)

// LE - Wait for admit notification
const admitNotifications = await waitForAndGetNotification(leClient, IPEX_ADMIT_ROUTE)
const admitNotification = admitNotifications[0]

// LE - Mark notification
await markNotificationRead(leClient, admitNotification.i)

prContinue()
```

    
    [1m[4m[44m[90m  Issuing Credential  [0m
    
    Issuing credential from AID "le" to AID "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj"...
    {
      name: "credential.EJ2aTqu1cyfSboIX407oiDspkY0SqkV1Y_bGDugKxsV7",
      metadata: {
        ced: {
          v: "ACDC10JSON000816_",
          d: "EJ2aTqu1cyfSboIX407oiDspkY0SqkV1Y_bGDugKxsV7",
          i: "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k",
          ri: "EEe46QMdH8JHZ6AppJ-NkDN31OM70CURQwzfmAy-pn0B",
          s: "EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g",
          a: {
            d: "EDZwOnJAEeKSyjUVHudL-Oq44_bskRT_4SQc1hzXckay",
            i: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
            AID: "",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "John Doe",
            engagementContextRole: "Managing Director",
            dt: "2025-06-24T19:28:40.032000+00:00"
          },
          e: {
            d: "EBLcpP6yJD-71Hcgs_XmE4-gALyAktRkuFjDh_iESNv2",
            le: {
              n: "EAJX9B1r2nC5alvdvAE4qskkoGdnxtJD2YtRVCsF8TAy",
              s: "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY"
            }
          },
          r: {
            d: "EKHMDCNFlMBaMdDOq5Pf_vGMxkTqrDMrTx_28cZZJCcW",
            usageDisclaimer: {
              l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled."
            },
            issuanceDisclaimer: {
              l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework."
            },
            privacyDisclaimer: {
              l: "Privacy Considerations are applicable to QVI ECR AUTH vLEI Credentials.  It is the sole responsibility of QVIs as Issuees of QVI ECR AUTH vLEI Credentials to present these Credentials in a privacy-preserving manner using the mechanisms provided in the Issuance and Presentation Exchange (IPEX) protocol specification and the Authentic Chained Data Container (ACDC) specification.  https://github.com/WebOfTrust/IETF-IPEX and https://github.com/trustoverip/tswg-acdc-specification."
            }
          }
        },
        depends: {
          name: "witness.EJVFx2AuTjHOYZDuBqoZFewCQVW05mPdrGySiva9CONM",
          metadata: { pre: "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k", sn: 3 },
          done: false,
          error: null,
          response: null
        }
      },
      done: true,
      error: null,
      response: {
        ced: {
          v: "ACDC10JSON000816_",
          d: "EJ2aTqu1cyfSboIX407oiDspkY0SqkV1Y_bGDugKxsV7",
          i: "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k",
          ri: "EEe46QMdH8JHZ6AppJ-NkDN31OM70CURQwzfmAy-pn0B",
          s: "EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g",
          a: {
            d: "EDZwOnJAEeKSyjUVHudL-Oq44_bskRT_4SQc1hzXckay",
            i: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
            AID: "",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "John Doe",
            engagementContextRole: "Managing Director",
            dt: "2025-06-24T19:28:40.032000+00:00"
          },
          e: {
            d: "EBLcpP6yJD-71Hcgs_XmE4-gALyAktRkuFjDh_iESNv2",
            le: {
              n: "EAJX9B1r2nC5alvdvAE4qskkoGdnxtJD2YtRVCsF8TAy",
              s: "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY"
            }
          },
          r: {
            d: "EKHMDCNFlMBaMdDOq5Pf_vGMxkTqrDMrTx_28cZZJCcW",
            usageDisclaimer: {
              l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled."
            },
            issuanceDisclaimer: {
              l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework."
            },
            privacyDisclaimer: {
              l: "Privacy Considerations are applicable to QVI ECR AUTH vLEI Credentials.  It is the sole responsibility of QVIs as Issuees of QVI ECR AUTH vLEI Credentials to present these Credentials in a privacy-preserving manner using the mechanisms provided in the Issuance and Presentation Exchange (IPEX) protocol specification and the Authentic Chained Data Container (ACDC) specification.  https://github.com/WebOfTrust/IETF-IPEX and https://github.com/trustoverip/tswg-acdc-specification."
            }
          }
        }
      }
    }
    Successfully issued credential with SAID: EJ2aTqu1cyfSboIX407oiDspkY0SqkV1Y_bGDugKxsV7
    
    [1m[4m[44m[90m  Granting Credential  [0m
    
    AID "le" granting credential to AID "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj" via IPEX...
    Successfully submitted IPEX grant from "le" to "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
    [1m[4m[44m[90m  Admitting Grant  [0m
    
    AID "qvi" admitting IPEX grant "ELpYIuIs7kVoNzrjm81-Y_kTTCK0gttsC3jQ-Ho8QCxQ" from AID "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k"...
    Successfully submitted IPEX admit for grant "ELpYIuIs7kVoNzrjm81-Y_kTTCK0gttsC3jQ-Ho8QCxQ".
    Marking notification "0AA0n1CD-xqW1Xmg3Or-xfjz" as read...
    Notification "0AA0n1CD-xqW1Xmg3Or-xfjz" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0ACuCQMAvC7zKc2kvh0UIWT5" as read...
    Notification "0ACuCQMAvC7zKc2kvh0UIWT5" marked as read.
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


### Step 6 (Path 1): ECR Credential - LE directly issues an Engagement Context Role credential to the Role holder

The vLEI framework is flexible. For ECR credentials, the Legal Entity can bypass a QVI and issue them directly. This path demonstrates that flow. The `ecrEdge` links directly to the LE's own vLEI credential, signifying its direct authority to define and issue this role.


```typescript
// Credential Data
const ecrData = {
    LEI: leData.LEI,
    personLegalName: 'John Doe',
    engagementContextRole: 'Managing Director',
};

const ecrEdge = Saider.saidify({
    d: '',
    le: {
        n: leCredential.sad.d,
        s: leCredential.sad.s,
    },
})[1];

const ecrRules = Saider.saidify({
    d: '',
    usageDisclaimer: {
        l: 'Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.',
    },
    issuanceDisclaimer: {
        l: 'All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.',
    },
    privacyDisclaimer: {
        l: 'It is the sole responsibility of Holders as Issuees of an ECR vLEI Credential to present that Credential in a privacy-preserving manner using the mechanisms provided in the Issuance and Presentation Exchange (IPEX) protocol specification and the Authentic Chained Data Container (ACDC) specification. https://github.com/WebOfTrust/IETF-IPEX and https://github.com/trustoverip/tswg-acdc-specification.',
    },
})[1];

// lE - Issue credential
prTitle("Issuing Credential")

const { credentialSaid: credentialSaid} = await issueCredential(
    leClient, leAlias, leRegistrySaid, 
    ECR_SCHEMA_SAID,
    rolePrefix,
    ecrData, ecrEdge, ecrRules,
	true
)

// lE - get credential
const ecrCredential = await leClient.credentials().get(credentialSaid);

// lE - Ipex grant
prTitle("Granting Credential")

const grantResponse = await ipexGrantCredential(
    leClient, leAlias, 
    rolePrefix,
    ecrCredential
)

// role - Wait for grant notification
const grantNotifications = await waitForAndGetNotification(roleClient, IPEX_GRANT_ROUTE)
const grantNotification = grantNotifications[0]

// role - Admit Grant
prTitle("Admitting Grant")

const admitResponse = await ipexAdmitGrant(
    roleClient, roleAlias,
    lePrefix,
    grantNotification.a.d
)

// role - Mark notification
await markNotificationRead(roleClient, grantNotification.i)

// le - Wait for admit notification
const admitNotifications = await waitForAndGetNotification(leClient, IPEX_ADMIT_ROUTE)
const admitNotification = admitNotifications[0]

// le - Mark notification
await markNotificationRead(leClient, admitNotification.i)

prContinue()
```

    
    [1m[4m[44m[90m  Issuing Credential  [0m
    
    Issuing credential from AID "le" to AID "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs"...
    {
      name: "credential.EAuxDYPcWvdfUbTHMv-s2qWCXpyvSXqyM2CmFCpUQ8b1",
      metadata: {
        ced: {
          v: "ACDC10JSON0007dc_",
          d: "EAuxDYPcWvdfUbTHMv-s2qWCXpyvSXqyM2CmFCpUQ8b1",
          u: "0AChjG1XlhKDy06p6xqPjIpq",
          i: "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k",
          ri: "EEe46QMdH8JHZ6AppJ-NkDN31OM70CURQwzfmAy-pn0B",
          s: "EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw",
          a: {
            d: "EFmr85PqCDoBJk3XcUB3Iui0Ol5b7PEPDjSKisy7K3-8",
            i: "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "John Doe",
            engagementContextRole: "Managing Director",
            dt: "2025-06-24T19:28:48.230000+00:00"
          },
          e: {
            d: "EBLcpP6yJD-71Hcgs_XmE4-gALyAktRkuFjDh_iESNv2",
            le: {
              n: "EAJX9B1r2nC5alvdvAE4qskkoGdnxtJD2YtRVCsF8TAy",
              s: "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY"
            }
          },
          r: {
            d: "EIfq_m1DI2IQ1MgHhUl9sq3IQ_PJP9WQ1LhbMscngDCB",
            usageDisclaimer: {
              l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled."
            },
            issuanceDisclaimer: {
              l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework."
            },
            privacyDisclaimer: {
              l: "It is the sole responsibility of Holders as Issuees of an ECR vLEI Credential to present that Credential in a privacy-preserving manner using the mechanisms provided in the Issuance and Presentation Exchange (IPEX) protocol specification and the Authentic Chained Data Container (ACDC) specification. https://github.com/WebOfTrust/IETF-IPEX and https://github.com/trustoverip/tswg-acdc-specification."
            }
          }
        },
        depends: {
          name: "witness.EGY7WcbPFSIZG8xmEommMC2m83NOjJHUivR7ZFXHCsQJ",
          metadata: { pre: "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k", sn: 4 },
          done: false,
          error: null,
          response: null
        }
      },
      done: true,
      error: null,
      response: {
        ced: {
          v: "ACDC10JSON0007dc_",
          d: "EAuxDYPcWvdfUbTHMv-s2qWCXpyvSXqyM2CmFCpUQ8b1",
          u: "0AChjG1XlhKDy06p6xqPjIpq",
          i: "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k",
          ri: "EEe46QMdH8JHZ6AppJ-NkDN31OM70CURQwzfmAy-pn0B",
          s: "EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw",
          a: {
            d: "EFmr85PqCDoBJk3XcUB3Iui0Ol5b7PEPDjSKisy7K3-8",
            i: "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "John Doe",
            engagementContextRole: "Managing Director",
            dt: "2025-06-24T19:28:48.230000+00:00"
          },
          e: {
            d: "EBLcpP6yJD-71Hcgs_XmE4-gALyAktRkuFjDh_iESNv2",
            le: {
              n: "EAJX9B1r2nC5alvdvAE4qskkoGdnxtJD2YtRVCsF8TAy",
              s: "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY"
            }
          },
          r: {
            d: "EIfq_m1DI2IQ1MgHhUl9sq3IQ_PJP9WQ1LhbMscngDCB",
            usageDisclaimer: {
              l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled."
            },
            issuanceDisclaimer: {
              l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework."
            },
            privacyDisclaimer: {
              l: "It is the sole responsibility of Holders as Issuees of an ECR vLEI Credential to present that Credential in a privacy-preserving manner using the mechanisms provided in the Issuance and Presentation Exchange (IPEX) protocol specification and the Authentic Chained Data Container (ACDC) specification. https://github.com/WebOfTrust/IETF-IPEX and https://github.com/trustoverip/tswg-acdc-specification."
            }
          }
        }
      }
    }
    Successfully issued credential with SAID: EAuxDYPcWvdfUbTHMv-s2qWCXpyvSXqyM2CmFCpUQ8b1
    
    [1m[4m[44m[90m  Granting Credential  [0m
    
    AID "le" granting credential to AID "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs" via IPEX...
    Successfully submitted IPEX grant from "le" to "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
    [1m[4m[44m[90m  Admitting Grant  [0m
    
    AID "role" admitting IPEX grant "EHrmNq_VgQ3eX4-V4ZSw4to2QN5YWQYyWjK4NGy3ZLqp" from AID "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k"...
    Successfully submitted IPEX admit for grant "EHrmNq_VgQ3eX4-V4ZSw4to2QN5YWQYyWjK4NGy3ZLqp".
    Marking notification "0ADSNvaIqznW41jSE4Fk2ZCg" as read...
    Notification "0ADSNvaIqznW41jSE4Fk2ZCg" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0ADxUMasCrLdjrTAalrapuAb" as read...
    Notification "0ADxUMasCrLdjrTAalrapuAb" marked as read.
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


### Step 6 (Path 2): ECR Credential - QVI issues another ECR credential using the AUTH credential

This is an alternate path for ECR issuance. Here, the QVI uses the `ECR AUTH` credential it received from the LE in **Step 5** to issue an ECR credential. Just like the OOR flow, the edge block uses the `I2I` operator, proving the QVI is acting on a specific, verifiable authorization from the Legal Entity.


```typescript
// Credential Data
const ecrEdgeByQvi = Saider.saidify({
    d: '',
    auth: {
        n: ecrAuthCredential.sad.d,
        s: ecrAuthCredential.sad.s,
        o: 'I2I',
    },
})[1];

// QVI - Issue credential
prTitle("Issuing Credential")
const { credentialSaid: credentialSaid} = await issueCredential(
    qviClient,  qviAlias, qviRegistrySaid, 
    ECR_SCHEMA_SAID,
    rolePrefix,
    ecrData, ecrEdgeByQvi, ecrRules,
    true
)

// QVI - get credential (with all its data)
prTitle("Granting Credential")
const ecrByQviCredential = await qviClient.credentials().get(credentialSaid);

// QVI - Ipex grant
const grantResponse = await ipexGrantCredential(
    qviClient, qviAlias, 
    rolePrefix,
    ecrByQviCredential
)

// ROLE - Wait for grant notification
const grantNotifications = await waitForAndGetNotification(roleClient, IPEX_GRANT_ROUTE)
const grantNotification = grantNotifications[0]

// ROLE - Admit Grant
prTitle("Admitting Grant")
const admitResponse = await ipexAdmitGrant(
    roleClient, roleAlias,
    qviPrefix,
    grantNotification.a.d
)

// LE - Mark notification
await markNotificationRead(roleClient, grantNotification.i)

// QVI - Wait for admit notification
const admitNotifications = await waitForAndGetNotification(qviClient, IPEX_ADMIT_ROUTE)
const admitNotification = admitNotifications[0]

// QVI - Mark notification
await markNotificationRead(qviClient, admitNotification.i)

prContinue()
```

    
    [1m[4m[44m[90m  Issuing Credential  [0m
    
    Issuing credential from AID "qvi" to AID "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs"...
    {
      name: "credential.EN4_xSYyoT1rLQbLHVEWOpYpD-RyAhM-oMSOzYWQyGjT",
      metadata: {
        ced: {
          v: "ACDC10JSON0007e8_",
          d: "EN4_xSYyoT1rLQbLHVEWOpYpD-RyAhM-oMSOzYWQyGjT",
          u: "0AArV-XKLILXt2kSmFSr6x_h",
          i: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
          ri: "EEZXpqjCsXQszkRh9VO8KmNXJaGi7zTCgh9Xzi17Guwo",
          s: "EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw",
          a: {
            d: "EIaj4B__w6Gmv1gKzRBBU36_5rTIj5cFYOSj5F-7xPK2",
            i: "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "John Doe",
            engagementContextRole: "Managing Director",
            dt: "2025-06-24T19:28:56.498000+00:00"
          },
          e: {
            d: "EIg3W_n_fwnCN0TZ_JM3MimrSCOZH-8OGjkZs5Snp09o",
            auth: {
              n: "EJ2aTqu1cyfSboIX407oiDspkY0SqkV1Y_bGDugKxsV7",
              s: "EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g",
              o: "I2I"
            }
          },
          r: {
            d: "EIfq_m1DI2IQ1MgHhUl9sq3IQ_PJP9WQ1LhbMscngDCB",
            usageDisclaimer: {
              l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled."
            },
            issuanceDisclaimer: {
              l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework."
            },
            privacyDisclaimer: {
              l: "It is the sole responsibility of Holders as Issuees of an ECR vLEI Credential to present that Credential in a privacy-preserving manner using the mechanisms provided in the Issuance and Presentation Exchange (IPEX) protocol specification and the Authentic Chained Data Container (ACDC) specification. https://github.com/WebOfTrust/IETF-IPEX and https://github.com/trustoverip/tswg-acdc-specification."
            }
          }
        },
        depends: {
          name: "witness.ED-ud1Ef0_1iul_5lH_O9dnFtxBKOjgtH7VKXJQllijM",
          metadata: { pre: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj", sn: 4 },
          done: false,
          error: null,
          response: null
        }
      },
      done: true,
      error: null,
      response: {
        ced: {
          v: "ACDC10JSON0007e8_",
          d: "EN4_xSYyoT1rLQbLHVEWOpYpD-RyAhM-oMSOzYWQyGjT",
          u: "0AArV-XKLILXt2kSmFSr6x_h",
          i: "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
          ri: "EEZXpqjCsXQszkRh9VO8KmNXJaGi7zTCgh9Xzi17Guwo",
          s: "EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw",
          a: {
            d: "EIaj4B__w6Gmv1gKzRBBU36_5rTIj5cFYOSj5F-7xPK2",
            i: "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "John Doe",
            engagementContextRole: "Managing Director",
            dt: "2025-06-24T19:28:56.498000+00:00"
          },
          e: {
            d: "EIg3W_n_fwnCN0TZ_JM3MimrSCOZH-8OGjkZs5Snp09o",
            auth: {
              n: "EJ2aTqu1cyfSboIX407oiDspkY0SqkV1Y_bGDugKxsV7",
              s: "EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g",
              o: "I2I"
            }
          },
          r: {
            d: "EIfq_m1DI2IQ1MgHhUl9sq3IQ_PJP9WQ1LhbMscngDCB",
            usageDisclaimer: {
              l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled."
            },
            issuanceDisclaimer: {
              l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework."
            },
            privacyDisclaimer: {
              l: "It is the sole responsibility of Holders as Issuees of an ECR vLEI Credential to present that Credential in a privacy-preserving manner using the mechanisms provided in the Issuance and Presentation Exchange (IPEX) protocol specification and the Authentic Chained Data Container (ACDC) specification. https://github.com/WebOfTrust/IETF-IPEX and https://github.com/trustoverip/tswg-acdc-specification."
            }
          }
        }
      }
    }
    Successfully issued credential with SAID: EN4_xSYyoT1rLQbLHVEWOpYpD-RyAhM-oMSOzYWQyGjT
    
    [1m[4m[44m[90m  Granting Credential  [0m
    
    AID "qvi" granting credential to AID "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs" via IPEX...
    Successfully submitted IPEX grant from "qvi" to "EO9yI1WhQCrZEMtPwJbq7is3D9jhMtzsEIncPcfCWENs".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
    [1m[4m[44m[90m  Admitting Grant  [0m
    
    AID "role" admitting IPEX grant "EIw08vv5CHJiykdv6Pjlkfrxg9xlacAXscBqlC-UvTbd" from AID "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj"...
    Successfully submitted IPEX admit for grant "EIw08vv5CHJiykdv6Pjlkfrxg9xlacAXscBqlC-UvTbd".
    Marking notification "0AAo00yLIli-1LK2vtcXz5QP" as read...
    Notification "0AAo00yLIli-1LK2vtcXz5QP" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0ABx9D64VNnResjAm0uwUL2J" as read...
    Notification "0ABx9D64VNnResjAm0uwUL2J" marked as read.
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


## The vLEI Reporting Agent

Once credentials like the ones created in this chain are issued and held by their respective entities, a common next step is to present them for verification or auditing. The vLEI Audit Reporting Agent, known as Sally, is a component designed for this purpose.

Sally acts as a direct-mode validator. It receives presentations of vLEI credentials (like the QVI, vLEI and OOR credentials), cryptographically verifies their structure and integrity, and then performs a POST request to a pre-configured webhook URL. This allows external systems to receive trusted, real-time notifications about credential presentations and revocations within the vLEI ecosystem.

For more details about sally go to this **[repository](https://github.com/GLEIF-IT/sally)**

To continue with the example you need to start the sally service following the instructions below (⚠️ The command is programatically generated):


```typescript
// Ask user to start the sally service setting the proper root of trust for this run
prAlert(`Please run this command on you local machine before continuing, and wait for the container to start:`)

prMessage(`GEDA_PRE=${gleifPrefix} docker compose up --build direct-sally -d`)

const isReady = confirm("Is the service running and ready to accept connections?");
if (isReady) {
    prContinue()
} else {
    throw new Error("❌ Script aborted by user. Please start the service and run the script again.");
}

```

    
    [1m[43m[94mPlease run this command on you local machine before continuing, and wait for the container to start:[0m
    
    
    [1m[94mGEDA_PRE=EFsQnjOuzAPnQj37T65YvQqpyAgTTvLEkLPampLWr1af docker compose up --build direct-sally -d[0m
    


    Is the service running and ready to accept connections? [y/N]  y


    
    [1m[42m[90m  You can continue ✅  [0m
    
    


<div class="alert alert-info">
    <b>ℹ️ NOTE</b><hr>
    When the sally service is started, the Root of Trust prefix is passed via the <code>GEDA_PRE</code> variable.  
</div>

### The Presentation Workflow

The following code block performs the entire presentation flow in four main steps.

1. **Establishing Contact with Sally:** Before the Legal Entity client (`leClient`) can present its credentials, it must first know how to communicate with Sally. The first action in the code is `resolveOOBI(leClient, sallyOOBI, sallyAlias)`, which resolves Sally's OOBI to establish this connection.
2. **Running the Local Sally Service:** The code will then prompt you to start the local Sally service using a `docker compose` command. This command is critical for the demonstration:
    - It starts a container running the Sally agent.
    - It also starts a simple hook service that acts as the webhook endpoint, listening for and storing the reports that Sally will post.
    - The `GEDA_PRE=${gleifPrefix}` variable passed to the command provides Sally with the Root of Trust AID for this specific notebook run. Sally requires this information to validate the entire credential chain, from the LE credential presented to it all the way back to its root anchor at GLEIF.
3. **Presenting the Credential:** The `presentToSally()` function uses `ipexGrantCredential` to send the `leCredential` to Sally's AID. This action is the `signify-ts` equivalent of using `kli ipex grant` for credential presentation and initiates the verification process within Sally.
4. **Verifying the Audit Report:** Finally, the `pollForCredential()` function simulates a webhook listener. Instead of running a full server, it simply polls the hook service where Sally sends its report. Upon receiving a successful `200 OK` response, it fetches and displays the JSON report, confirming that Sally received the presentation, successfully verified the trust chain, and dispatched its audit report.


```typescript
// Present to sally

const sallyOOBI = "http://direct-sally:9823/oobi"
const sallyPrefix = "ECLwKe5b33BaV20x7HZWYi_KUXgY91S41fRL2uCaf4WQ"
const sallyAlias = "sally"

// Ipex presentation of LE credential
async function presentToSally(){
    prTitle("Presenting vLEI Credential to sally")
    const grantResponse = await ipexGrantCredential(
        leClient,  leAlias, 
        sallyPrefix,
        leCredential
    )
}

// Poll webhook for LE credential data
const webhookUrl = `${"http://hook:9923"}/?holder=${lePrefix}`;

// // Ipex presentation of LE credential
// async function presentToSally(){
//     prTitle("Presenting QVI Credential to sally")
//     const grantResponse = await ipexGrantCredential(
//         qviClient,  qviAlias, 
//         sallyPrefix,
//         qviCredential
//     )
// }

// // Poll webhook for LE credential data
// const webhookUrl = `${"http://hook:9923"}/?holder=${qviPrefix}`;

//----------------------

async function pollForCredential() {

    const TIMEOUT_SECONDS = 25;
    let present_result = 0;
    const start = Date.now();

    while (present_result !== 200) {

        if ((Date.now() - start) / 1000 > TIMEOUT_SECONDS) {
            prMessage(`TIMEOUT - Sally did not receive the Credential`);
            break; // Exit the loop
        }
        // Run curl to get just the HTTP status code
        try {
            const command = new Deno.Command("curl", {
                args: ["-s", "-o", "/dev/null", "-w", "%{http_code}", webhookUrl],
            });
            const { stdout } = await command.output();
            const httpCodeStr = new TextDecoder().decode(stdout);
            present_result = parseInt(httpCodeStr, 10) || 0; // Default to 0 if parsing fails
            prMessage(`Received ${present_result} from Sally`);
        } catch (error) {
            prMessage(`[QVI] Polling command failed: ${error.message}`);
            present_result = 0; // Reset on failure to avoid exiting loop
        }
        if (present_result !== 200) {
            await sleep(1000); 
        }
    }
    if (present_result === 200) {
        prTitle("Fetching Credential Info...");
        const command = new Deno.Command("curl", {
            args: ["-s", webhookUrl]
        });
        const { stdout } = await command.output();
        const responseBody = new TextDecoder().decode(stdout);
        try {
            const jsonObject = JSON.parse(responseBody);
            const formattedJson = JSON.stringify(jsonObject, null, 2);
            prMessage(formattedJson);
        } catch (error) {
            prMessage("Response was not valid JSON. Printing raw body:");
            prMessage(responseBody);
        }
    }
}

while(! await isServiceHealthy("http://direct-sally:9823/health")){
    prMessage(`Please run this command on you local machine before continuing, and wait for the container to start:`)
    prMessage(`GEDA_PRE=${gleifPrefix} docker compose up --build direct-sally -d`)
    await sleep(5000);
}

await resolveOOBI(leClient, sallyOOBI, sallyAlias)
await resolveOOBI(qviClient, sallyOOBI, sallyAlias)
await presentToSally()
await pollForCredential()

prContinue()
```

    Checking health at: http://direct-sally:9823/health
    Received status: 200. Service is healthy.
    Resolving OOBI URL: http://direct-sally:9823/oobi with alias sally
    Successfully resolved OOBI URL. Response: OK
    Contact "sally" added/updated.
    Resolving OOBI URL: http://direct-sally:9823/oobi with alias sally
    Successfully resolved OOBI URL. Response: OK
    Contact "sally" added/updated.
    
    [1m[4m[44m[90m  Presenting vLEI Credential to sally  [0m
    
    AID "le" granting credential to AID "ECLwKe5b33BaV20x7HZWYi_KUXgY91S41fRL2uCaf4WQ" via IPEX...
    Successfully submitted IPEX grant from "le" to "ECLwKe5b33BaV20x7HZWYi_KUXgY91S41fRL2uCaf4WQ".
    
    [1m[94mReceived 404 from Sally[0m
    
    
    [1m[94mReceived 404 from Sally[0m
    
    
    [1m[94mReceived 404 from Sally[0m
    
    
    [1m[94mReceived 404 from Sally[0m
    
    
    [1m[94mReceived 404 from Sally[0m
    
    
    [1m[94mReceived 404 from Sally[0m
    
    
    [1m[94mReceived 404 from Sally[0m
    
    
    [1m[94mReceived 200 from Sally[0m
    
    
    [1m[4m[44m[90m  Fetching Credential Info...  [0m
    
    
    [1m[94m{
      "credential": "EAJX9B1r2nC5alvdvAE4qskkoGdnxtJD2YtRVCsF8TAy",
      "type": "LE",
      "issuer": "EFKblgHYtG05Q-BQu3IfiesWNKPCv5ybX4jdidamsMHj",
      "holder": "EG-4h_mAPdwJ6DmaQRJqXgAepHVt0Csb1SXA_Ymn_M4k",
      "LEI": "875500ELOZEL05BVXV37",
      "personLegalName": "",
      "officialRole": ""
    }[0m
    
    
    [1m[42m[90m  You can continue ✅  [0m
    
    


<div class="alert alert-prymary">
<b>📝 SUMMARY</b><hr>
This notebook provided a practical walkthrough of a simplified vLEI trust chain using Signify-ts, demonstrating:
<ul>
<li><b>Hierarchical Trust:</b> Each credential in the chain cryptographically references its authorizing credential, creating a verifiable link back to the Root of Trust (GLEIF).</li>
<li><b>Multiple Issuance Paths:</b> The vLEI ecosystem supports different issuance models, including direct issuance by a Legal Entity (for ECRs) and authorized issuance by a QVI on behalf of an LE (for OORs and ECRs).</li>
<li><b>IPEX Protocol:</b> The Issuance and Presentation Exchange protocol facilitates the secure delivery of credentials between parties using a grant/admit message flow.</li>
<li><b>Schema Compliance:</b> Every credential adheres to a specific, SAID-identified vLEI schema, ensuring interoperability and consistent data structures.</li>
<li><b>Credential Chaining:</b> The 'edges' section of an ACDC is used to reference the SAID of a source credential, explicitly defining the chain of authority.</li>
<li><b>Audit Agent Interaction:</b> A credential holder can present their ACDC to an external agent like Sally for verification and auditing. Sally validates the entire trust chain and notifies an external service via a webhook.</li>
</ul>
This represents a functional, albeit simplified, model of how the vLEI ecosystem issues verifiable credentials for legal entities and their roles while maintaining a robust and verifiable chain of trust.
</div>


```typescript

```
