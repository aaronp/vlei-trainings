# vLEI Trust Chain

<div class="alert alert-primary">
<b>🎯 OBJECTIVE</b><hr>
To provide a practical, hands-on demonstration of the vLEI trust chain using SignifyTS. 
</div>

## The simplified vLEI Trust Chain 

To clearly explain the fundamentals of vLEI credentials and schemas, this notebook presents a simplified model of the credential issuance hierarchy. We will trace the flow of authority and the process of creating chained credentials using official vLEI schema definitions. For the sake of clarity, we have excluded the more advanced topics of multisignatures and delegated identifier structures, which are key components of the complete vLEI production trust chain. A practical, in-depth example of these advanced features can be found in the **[qvi-software repository](https://github.com/GLEIF-IT/qvi-software/tree/main/qvi-workflow)**.

The outcome of this training is to produce a verification chain similar to the one shown below except that all identifiers are single signature identifiers instead of multi-signature identifiers.

![vLEI Verification Chain](./images/vlei-verification-chain.png)

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

// Fixed Bran to keep a consistent root of trust (DO NOT MODIFY or else validation with the Sally verifier will break)
const gleifBran = "Dm8Tmz05CF6_JLX9sVlFe" 
const gleifAlias = 'gleif'
const { client: gleifClient } = await initializeAndConnectClient(gleifBran)
let gleifPrefix

// GLEIF GEDA (GLEIF External Delegated AID) setup
// uses try/catch to permit reusing existing GEDA upon re-run of this test file.
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

// GLEIF GEDA Registry
// uses try/catch to permit reusing existing GEDA upon re-run of this test file.
let gleifRegistrySaid
try{
    const registries = await gleifClient.registries().list(gleifAlias);
    gleifRegistrySaid = registries[0].regk
} catch {
    prMessage("Creating GLEIF Registry")
    const { registrySaid: newRegistrySaid } = await createCredentialRegistry(gleifClient, gleifAlias, 'gleifRegistry')
    gleifRegistrySaid = newRegistrySaid
}
// QVI and LE registry
const { registrySaid: qviRegistrySaid } = await createCredentialRegistry(qviClient, qviAlias, 'qviRegistry')
const { registrySaid: leRegistrySaid } = await createCredentialRegistry(leClient, leAlias, 'leRegistry')

prContinue()
```

    
      Creating clients setup  
    
    Using Passcode (bran): Dm8Tmz05CF6_JLX9sVlFe
    Signify-ts library initialized.
    Client boot process initiated with KERIA agent.
      Client AID Prefix:  EAahBlwoMzpTutCwwyc8QitdbzrbLXhKLuydIbVOGjCM
      Agent AID Prefix:   EK_qCRmuU45_q4QUr_paYswM302iNV_KNADxZWa9_hup
    
    Creating GLEIF AID
    
    Initiating AID inception for alias: gleif
    Successfully created AID with prefix: EKOhpyKyDF4QV7lWP3ZQogr9U5ob2IAy7KrtFuNSio22
    Assigning 'agent' role to KERIA Agent EK_qCRmuU45_q4QUr_paYswM302iNV_KNADxZWa9_hup for AID alias gleif
    Successfully assigned 'agent' role for AID alias gleif.
    Generating OOBI for AID alias gleif with role agent
    Generated OOBI URL: http://keria:3902/oobi/EKOhpyKyDF4QV7lWP3ZQogr9U5ob2IAy7KrtFuNSio22/agent/EK_qCRmuU45_q4QUr_paYswM302iNV_KNADxZWa9_hup
    
    GLEIF Prefix: EKOhpyKyDF4QV7lWP3ZQogr9U5ob2IAy7KrtFuNSio22
    
    Using Passcode (bran): DODop2H7J8hD5ftVUJa_f
    Client boot process initiated with KERIA agent.
      Client AID Prefix:  EBlZaHK_OAIujHTD5d_ExnRHzhGJ3OMaFP88yJDSReri
      Agent AID Prefix:   EKm8xdGrUIix7JZfb-Uo0kLYIpgG9vNIfXt2Xknme5UP
    Initiating AID inception for alias: qvi
    Successfully created AID with prefix: EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb
    Assigning 'agent' role to KERIA Agent EKm8xdGrUIix7JZfb-Uo0kLYIpgG9vNIfXt2Xknme5UP for AID alias qvi
    Successfully assigned 'agent' role for AID alias qvi.
    Generating OOBI for AID alias qvi with role agent
    Generated OOBI URL: http://keria:3902/oobi/EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb/agent/EKm8xdGrUIix7JZfb-Uo0kLYIpgG9vNIfXt2Xknme5UP
    
    QVI Prefix: EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb
    
    Using Passcode (bran): B-5uJ3GH6ettWRz2JyByq
    Client boot process initiated with KERIA agent.
      Client AID Prefix:  EFI5zB2uKlqeVzCXGdanj-vbo9IZz1BApVy2WPaVNE_e
      Agent AID Prefix:   EBIX_9LsD826eLCZuzSMNdf7AEwvkIjV6Linksg9NEOj
    Initiating AID inception for alias: le
    Successfully created AID with prefix: EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG
    Assigning 'agent' role to KERIA Agent EBIX_9LsD826eLCZuzSMNdf7AEwvkIjV6Linksg9NEOj for AID alias le
    Successfully assigned 'agent' role for AID alias le.
    Generating OOBI for AID alias le with role agent
    Generated OOBI URL: http://keria:3902/oobi/EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG/agent/EBIX_9LsD826eLCZuzSMNdf7AEwvkIjV6Linksg9NEOj
    
    LE Prefix: EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG
    
    Using Passcode (bran): B9IqWPGVA9olcdsSv1FDu
    Client boot process initiated with KERIA agent.
      Client AID Prefix:  EIbad3DE1QoPUB0ycEF5rmn0uPQLfrJfzjURbsEefs7I
      Agent AID Prefix:   ENem7qd6RY4Kk1Nr0FFOVfq8l7qosxZ9dM3dBi7xBQ1Y
    Initiating AID inception for alias: role
    Successfully created AID with prefix: EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD
    Assigning 'agent' role to KERIA Agent ENem7qd6RY4Kk1Nr0FFOVfq8l7qosxZ9dM3dBi7xBQ1Y for AID alias role
    Successfully assigned 'agent' role for AID alias role.
    Generating OOBI for AID alias role with role agent
    Generated OOBI URL: http://keria:3902/oobi/EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD/agent/ENem7qd6RY4Kk1Nr0FFOVfq8l7qosxZ9dM3dBi7xBQ1Y
    
    ROLE Prefix: EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD
    
    
      Resolving OOBIs  
    
    Resolving OOBI URL: http://keria:3902/oobi/EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb/agent/EKm8xdGrUIix7JZfb-Uo0kLYIpgG9vNIfXt2Xknme5UP with alias qvi
    Resolving OOBI URL: http://keria:3902/oobi/EKOhpyKyDF4QV7lWP3ZQogr9U5ob2IAy7KrtFuNSio22/agent/EK_qCRmuU45_q4QUr_paYswM302iNV_KNADxZWa9_hup with alias gleif
    Resolving OOBI URL: http://keria:3902/oobi/EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG/agent/EBIX_9LsD826eLCZuzSMNdf7AEwvkIjV6Linksg9NEOj with alias le
    Resolving OOBI URL: http://keria:3902/oobi/EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD/agent/ENem7qd6RY4Kk1Nr0FFOVfq8l7qosxZ9dM3dBi7xBQ1Y with alias role
    Resolving OOBI URL: http://keria:3902/oobi/EKOhpyKyDF4QV7lWP3ZQogr9U5ob2IAy7KrtFuNSio22/agent/EK_qCRmuU45_q4QUr_paYswM302iNV_KNADxZWa9_hup with alias gleif
    Resolving OOBI URL: http://keria:3902/oobi/EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb/agent/EKm8xdGrUIix7JZfb-Uo0kLYIpgG9vNIfXt2Xknme5UP with alias qvi
    Resolving OOBI URL: http://keria:3902/oobi/EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD/agent/ENem7qd6RY4Kk1Nr0FFOVfq8l7qosxZ9dM3dBi7xBQ1Y with alias role
    Resolving OOBI URL: http://keria:3902/oobi/EKOhpyKyDF4QV7lWP3ZQogr9U5ob2IAy7KrtFuNSio22/agent/EK_qCRmuU45_q4QUr_paYswM302iNV_KNADxZWa9_hup with alias gleif
    Resolving OOBI URL: http://keria:3902/oobi/EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG/agent/EBIX_9LsD826eLCZuzSMNdf7AEwvkIjV6Linksg9NEOj with alias le
    Resolving OOBI URL: http://keria:3902/oobi/EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb/agent/EKm8xdGrUIix7JZfb-Uo0kLYIpgG9vNIfXt2Xknme5UP with alias qvi
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
    Contact "le" added/updated.
    Contact "qvi" added/updated.
    Contact "role" added/updated.
    Contact "gleif" added/updated.
    Contact "qvi" added/updated.
    Contact "role" added/updated.
    Contact "le" added/updated.
    Contact "gleif" added/updated.
    
      Creating Credential Registries  
    
    
    Creating GLEIF Registry
    
    Creating credential registry "gleifRegistry" for AID alias "gleif"...
    Successfully created credential registry: EMVSIrBzP0BuAnmuIcE2UwyG_5L8FAIAV3ChB6-PFmy2
    Creating credential registry "qviRegistry" for AID alias "qvi"...
    Successfully created credential registry: ECpgAt4SKlKvNL90AE-fkOZ1OH7mvhMP7iCmq_PNUM2r
    Creating credential registry "leRegistry" for AID alias "le"...
    Successfully created credential registry: EMASG0VnzsqD6M05aisJn_2WpiGtq-R60oTjC7V9db7K
    
      You can continue ✅  
    
    


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
prMessage(`QVI_SCHEMA_URL:\n  - ${QVI_SCHEMA_URL}`)
prMessage(`LE_SCHEMA_URL:\n  - ${LE_SCHEMA_URL}`)
prMessage(`ECR_AUTH_SCHEMA_URL:\n  - ${ECR_AUTH_SCHEMA_URL}`)
prMessage(`ECR_SCHEMA_URL:\n  - ${ECR_SCHEMA_URL}`)
prMessage(`OOR_AUTH_SCHEMA_URL:\n  - ${OOR_AUTH_SCHEMA_URL}`)
prMessage(`OOR_SCHEMA_URL:\n  - ${OOR_SCHEMA_URL}`)

prContinue()
```

    
      Schema OOBIs  
    
    
    QVI_SCHEMA_URL:
      - http://vlei-server:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao
    
    
    LE_SCHEMA_URL:
      - http://vlei-server:7723/oobi/ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY
    
    
    ECR_AUTH_SCHEMA_URL:
      - http://vlei-server:7723/oobi/EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g
    
    
    ECR_SCHEMA_URL:
      - http://vlei-server:7723/oobi/EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw
    
    
    OOR_AUTH_SCHEMA_URL:
      - http://vlei-server:7723/oobi/EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E
    
    
    OOR_SCHEMA_URL:
      - http://vlei-server:7723/oobi/EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy
    
    
      You can continue ✅  
    
    


All clients now resolve all the necessary schemas in order to have knowledge of the schemas they use.


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

    
      Resolving Schemas  
    
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
    
      You can continue ✅  
    
    


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

    
      Issuing Credential  
    
    Issuing credential from AID "gleif" to AID "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb"...
    {
      name: "credential.ELpnnEMY6qbGwb4aQJraUVyhjsDFb7ayByMq60C8I9an",
      metadata: {
        ced: {
          v: "ACDC10JSON000197_",
          d: "ELpnnEMY6qbGwb4aQJraUVyhjsDFb7ayByMq60C8I9an",
          i: "EKOhpyKyDF4QV7lWP3ZQogr9U5ob2IAy7KrtFuNSio22",
          ri: "EMVSIrBzP0BuAnmuIcE2UwyG_5L8FAIAV3ChB6-PFmy2",
          s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
          a: {
            d: "EO43S-TIuVUvT_XvE0QUyiT9zANM2FbPs22yGkvRB39l",
            i: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
            LEI: "254900OPPU84GM83MG36",
            dt: "2025-07-18T00:31:56.279000+00:00"
          }
        },
        depends: {
          name: "witness.EGUapx9fn_BYEaTANhwYfRyTMGHTtGz1bVPygSySNg3W",
          metadata: { pre: "EKOhpyKyDF4QV7lWP3ZQogr9U5ob2IAy7KrtFuNSio22", sn: 2 },
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
          d: "ELpnnEMY6qbGwb4aQJraUVyhjsDFb7ayByMq60C8I9an",
          i: "EKOhpyKyDF4QV7lWP3ZQogr9U5ob2IAy7KrtFuNSio22",
          ri: "EMVSIrBzP0BuAnmuIcE2UwyG_5L8FAIAV3ChB6-PFmy2",
          s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
          a: {
            d: "EO43S-TIuVUvT_XvE0QUyiT9zANM2FbPs22yGkvRB39l",
            i: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
            LEI: "254900OPPU84GM83MG36",
            dt: "2025-07-18T00:31:56.279000+00:00"
          }
        }
      }
    }
    Successfully issued credential with SAID: ELpnnEMY6qbGwb4aQJraUVyhjsDFb7ayByMq60C8I9an
    
      Granting Credential  
    
    AID "gleif" granting credential to AID "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb" via IPEX...
    Successfully submitted IPEX grant from "gleif" to "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
      Admitting Grant  
    
    AID "qvi" admitting IPEX grant "ENvz5X-iphyW3KEZvfB_ZLwJeH43HjB5bDVmjHvkgSvT" from AID "EKOhpyKyDF4QV7lWP3ZQogr9U5ob2IAy7KrtFuNSio22"...
    Successfully submitted IPEX admit for grant "ENvz5X-iphyW3KEZvfB_ZLwJeH43HjB5bDVmjHvkgSvT".
    Marking notification "0AChz-5XOMYg3E1-SHyhjecm" as read...
    Notification "0AChz-5XOMYg3E1-SHyhjecm" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0AD8ui7uQv7Z4SDJZFg0TSAY" as read...
    Notification "0AD8ui7uQv7Z4SDJZFg0TSAY" marked as read.
    
      You can continue ✅  
    
    


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

    
      Issuing Credential  
    
    Issuing credential from AID "qvi" to AID "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG"...
    {
      name: "credential.EBhRb6NzmCprA7p1TubnPfaDkqDIPbSwuG1sUh7DalWq",
      metadata: {
        ced: {
          v: "ACDC10JSON0005c8_",
          d: "EBhRb6NzmCprA7p1TubnPfaDkqDIPbSwuG1sUh7DalWq",
          i: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
          ri: "ECpgAt4SKlKvNL90AE-fkOZ1OH7mvhMP7iCmq_PNUM2r",
          s: "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY",
          a: {
            d: "ENE7ovo4z4SZzchSzEgY0GWIYW2D54_6Xyfz1JiKEsPx",
            i: "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG",
            LEI: "875500ELOZEL05BVXV37",
            dt: "2025-07-18T00:32:04.753000+00:00"
          },
          e: {
            d: "EDgnY4jpaVFuz_Zr8prijPxDJDdytlrkBgQcslSF8DqZ",
            qvi: {
              n: "ELpnnEMY6qbGwb4aQJraUVyhjsDFb7ayByMq60C8I9an",
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
          name: "witness.EDwyo79LSUBNwhjHJP_SKs6ebsiKLx7NvHnZeKRfUuDb",
          metadata: { pre: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb", sn: 2 },
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
          d: "EBhRb6NzmCprA7p1TubnPfaDkqDIPbSwuG1sUh7DalWq",
          i: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
          ri: "ECpgAt4SKlKvNL90AE-fkOZ1OH7mvhMP7iCmq_PNUM2r",
          s: "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY",
          a: {
            d: "ENE7ovo4z4SZzchSzEgY0GWIYW2D54_6Xyfz1JiKEsPx",
            i: "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG",
            LEI: "875500ELOZEL05BVXV37",
            dt: "2025-07-18T00:32:04.753000+00:00"
          },
          e: {
            d: "EDgnY4jpaVFuz_Zr8prijPxDJDdytlrkBgQcslSF8DqZ",
            qvi: {
              n: "ELpnnEMY6qbGwb4aQJraUVyhjsDFb7ayByMq60C8I9an",
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
    Successfully issued credential with SAID: EBhRb6NzmCprA7p1TubnPfaDkqDIPbSwuG1sUh7DalWq
    
      Granting Credential  
    
    AID "qvi" granting credential to AID "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG" via IPEX...
    Successfully submitted IPEX grant from "qvi" to "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
      Admitting Grant  
    
    AID "le" admitting IPEX grant "EAq7_-f8j84vCS7gi-7yt3fA7PSLc23_vzgFFDhpN1C0" from AID "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb"...
    Successfully submitted IPEX admit for grant "EAq7_-f8j84vCS7gi-7yt3fA7PSLc23_vzgFFDhpN1C0".
    Marking notification "0AAzXfgoOf8-LLdWqhybq009" as read...
    Notification "0AAzXfgoOf8-LLdWqhybq009" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0AByAZ3_x_bYkOw07wC2ELR4" as read...
    Notification "0AByAZ3_x_bYkOw07wC2ELR4" marked as read.
    
      You can continue ✅  
    
    


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

    
      Issuing Credential  
    
    Issuing credential from AID "le" to AID "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb"...
    {
      name: "credential.EP6oTQDfrpVVFH0CAgpmNIoJmKC_-xYXgH1n6akLBy_g",
      metadata: {
        ced: {
          v: "ACDC10JSON000602_",
          d: "EP6oTQDfrpVVFH0CAgpmNIoJmKC_-xYXgH1n6akLBy_g",
          i: "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG",
          ri: "EMASG0VnzsqD6M05aisJn_2WpiGtq-R60oTjC7V9db7K",
          s: "EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E",
          a: {
            d: "EP9Q1ajBjgHtIGpP5ndWcHBDQL7NbTaE3ll4oQfcsNvk",
            i: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
            AID: "",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "Jane Doe",
            officialRole: "CEO",
            dt: "2025-07-18T00:32:13.066000+00:00"
          },
          e: {
            d: "EJiyyaCGlPPGA3CvqtR_3SSYRFmZb7hwG2NU9_YniYEe",
            le: {
              n: "EBhRb6NzmCprA7p1TubnPfaDkqDIPbSwuG1sUh7DalWq",
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
          name: "witness.EIXxomNqrIh5QOMvmEZSOV33lLnNNQwOKksCTikvZGTU",
          metadata: { pre: "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG", sn: 2 },
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
          d: "EP6oTQDfrpVVFH0CAgpmNIoJmKC_-xYXgH1n6akLBy_g",
          i: "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG",
          ri: "EMASG0VnzsqD6M05aisJn_2WpiGtq-R60oTjC7V9db7K",
          s: "EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E",
          a: {
            d: "EP9Q1ajBjgHtIGpP5ndWcHBDQL7NbTaE3ll4oQfcsNvk",
            i: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
            AID: "",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "Jane Doe",
            officialRole: "CEO",
            dt: "2025-07-18T00:32:13.066000+00:00"
          },
          e: {
            d: "EJiyyaCGlPPGA3CvqtR_3SSYRFmZb7hwG2NU9_YniYEe",
            le: {
              n: "EBhRb6NzmCprA7p1TubnPfaDkqDIPbSwuG1sUh7DalWq",
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
    Successfully issued credential with SAID: EP6oTQDfrpVVFH0CAgpmNIoJmKC_-xYXgH1n6akLBy_g
    
      Granting Credential  
    
    AID "le" granting credential to AID "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb" via IPEX...
    Successfully submitted IPEX grant from "le" to "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
      Admitting Grant  
    
    AID "qvi" admitting IPEX grant "EFbLEhRyDozmgJ4Brxia5E1umotbIPIcJQ2XbqBwltwW" from AID "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG"...
    Successfully submitted IPEX admit for grant "EFbLEhRyDozmgJ4Brxia5E1umotbIPIcJQ2XbqBwltwW".
    Marking notification "0AD3prpxFkWoEKLgwHlcrNN0" as read...
    Notification "0AD3prpxFkWoEKLgwHlcrNN0" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0AAeKH9pb7rd_kzL85OXAWk4" as read...
    Notification "0AAeKH9pb7rd_kzL85OXAWk4" marked as read.
    
      You can continue ✅  
    
    


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

    
      Issuing Credential  
    
    Issuing credential from AID "qvi" to AID "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD"...
    {
      name: "credential.EMJh3p0CNQerrykfKNQ7HrXeT5ovyyMBcxH_QFSuNRjp",
      metadata: {
        ced: {
          v: "ACDC10JSON000605_",
          d: "EMJh3p0CNQerrykfKNQ7HrXeT5ovyyMBcxH_QFSuNRjp",
          i: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
          ri: "ECpgAt4SKlKvNL90AE-fkOZ1OH7mvhMP7iCmq_PNUM2r",
          s: "EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy",
          a: {
            d: "EEMrzTpQrMB0gzAx8DWZoAQktvxSM41HTzKURY10pJwV",
            i: "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "Jane Doe",
            officialRole: "CEO",
            dt: "2025-07-18T00:32:21.405000+00:00"
          },
          e: {
            d: "EEE-W1E3oMbgt2tniVNCGz7VBYTfBh2Ebe7rM2ckOEwU",
            auth: {
              n: "EP6oTQDfrpVVFH0CAgpmNIoJmKC_-xYXgH1n6akLBy_g",
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
          name: "witness.EI3a0iJaXTXyDKCtUVyBGUGQDXjV2pxilrf6h6X2N42B",
          metadata: { pre: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb", sn: 3 },
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
          d: "EMJh3p0CNQerrykfKNQ7HrXeT5ovyyMBcxH_QFSuNRjp",
          i: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
          ri: "ECpgAt4SKlKvNL90AE-fkOZ1OH7mvhMP7iCmq_PNUM2r",
          s: "EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy",
          a: {
            d: "EEMrzTpQrMB0gzAx8DWZoAQktvxSM41HTzKURY10pJwV",
            i: "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "Jane Doe",
            officialRole: "CEO",
            dt: "2025-07-18T00:32:21.405000+00:00"
          },
          e: {
            d: "EEE-W1E3oMbgt2tniVNCGz7VBYTfBh2Ebe7rM2ckOEwU",
            auth: {
              n: "EP6oTQDfrpVVFH0CAgpmNIoJmKC_-xYXgH1n6akLBy_g",
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
    Successfully issued credential with SAID: EMJh3p0CNQerrykfKNQ7HrXeT5ovyyMBcxH_QFSuNRjp
    
      Granting Credential  
    
    AID "qvi" granting credential to AID "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD" via IPEX...
    Successfully submitted IPEX grant from "qvi" to "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
      Admitting Grant  
    
    AID "role" admitting IPEX grant "ENd52fK--mCcKHvfJ2t3C-4CVMBxj1_MLapx-YazDX_n" from AID "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb"...
    Successfully submitted IPEX admit for grant "ENd52fK--mCcKHvfJ2t3C-4CVMBxj1_MLapx-YazDX_n".
    Marking notification "0AByMpKxGMt2RxzvzyV9fHOX" as read...
    Notification "0AByMpKxGMt2RxzvzyV9fHOX" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0ACnUuT14anZO2QGQ_9Ql9jZ" as read...
    Notification "0ACnUuT14anZO2QGQ_9Ql9jZ" marked as read.
    
      You can continue ✅  
    
    


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

    
      Issuing Credential  
    
    Issuing credential from AID "le" to AID "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb"...
    {
      name: "credential.EK6ZSkelhfJR2i1aKVOzMAaTLyJZZVaaNGVtm2qG3Ned",
      metadata: {
        ced: {
          v: "ACDC10JSON000816_",
          d: "EK6ZSkelhfJR2i1aKVOzMAaTLyJZZVaaNGVtm2qG3Ned",
          i: "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG",
          ri: "EMASG0VnzsqD6M05aisJn_2WpiGtq-R60oTjC7V9db7K",
          s: "EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g",
          a: {
            d: "EHHRh2UlhtwD5XAlKqWsqt4WyN576VtsH2EjcbgqIDND",
            i: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
            AID: "",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "John Doe",
            engagementContextRole: "Managing Director",
            dt: "2025-07-18T00:32:29.547000+00:00"
          },
          e: {
            d: "EJiyyaCGlPPGA3CvqtR_3SSYRFmZb7hwG2NU9_YniYEe",
            le: {
              n: "EBhRb6NzmCprA7p1TubnPfaDkqDIPbSwuG1sUh7DalWq",
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
          name: "witness.EFeNczgi1epWleHR_h0fY0p4WvJBWGJVVQLdie5zuqA3",
          metadata: { pre: "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG", sn: 3 },
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
          d: "EK6ZSkelhfJR2i1aKVOzMAaTLyJZZVaaNGVtm2qG3Ned",
          i: "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG",
          ri: "EMASG0VnzsqD6M05aisJn_2WpiGtq-R60oTjC7V9db7K",
          s: "EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g",
          a: {
            d: "EHHRh2UlhtwD5XAlKqWsqt4WyN576VtsH2EjcbgqIDND",
            i: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
            AID: "",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "John Doe",
            engagementContextRole: "Managing Director",
            dt: "2025-07-18T00:32:29.547000+00:00"
          },
          e: {
            d: "EJiyyaCGlPPGA3CvqtR_3SSYRFmZb7hwG2NU9_YniYEe",
            le: {
              n: "EBhRb6NzmCprA7p1TubnPfaDkqDIPbSwuG1sUh7DalWq",
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
    Successfully issued credential with SAID: EK6ZSkelhfJR2i1aKVOzMAaTLyJZZVaaNGVtm2qG3Ned
    
      Granting Credential  
    
    AID "le" granting credential to AID "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb" via IPEX...
    Successfully submitted IPEX grant from "le" to "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
      Admitting Grant  
    
    AID "qvi" admitting IPEX grant "ENVYzw6LWYhvTNel4F3a8ukR67Ele0hCww_LN5koyQ1b" from AID "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG"...
    Successfully submitted IPEX admit for grant "ENVYzw6LWYhvTNel4F3a8ukR67Ele0hCww_LN5koyQ1b".
    Marking notification "0AA64v8WOwhvfEFzbeavKpRD" as read...
    Notification "0AA64v8WOwhvfEFzbeavKpRD" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0ACSfQaVk3tF4wdtYywLA-OA" as read...
    Notification "0ACSfQaVk3tF4wdtYywLA-OA" marked as read.
    
      You can continue ✅  
    
    


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

    
      Issuing Credential  
    
    Issuing credential from AID "le" to AID "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD"...
    {
      name: "credential.EPiJg8dr85f7gxsqS5aatchdXd7lUgWBvAzeyt5YQIAe",
      metadata: {
        ced: {
          v: "ACDC10JSON0007dc_",
          d: "EPiJg8dr85f7gxsqS5aatchdXd7lUgWBvAzeyt5YQIAe",
          u: "0AAR4PAjL6mV652tH6oElTeK",
          i: "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG",
          ri: "EMASG0VnzsqD6M05aisJn_2WpiGtq-R60oTjC7V9db7K",
          s: "EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw",
          a: {
            d: "EF0DpTizv4UASZhTw28_ahP8nT2GQAxpcL1K-q9JV0-L",
            i: "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "John Doe",
            engagementContextRole: "Managing Director",
            dt: "2025-07-18T00:32:37.263000+00:00"
          },
          e: {
            d: "EJiyyaCGlPPGA3CvqtR_3SSYRFmZb7hwG2NU9_YniYEe",
            le: {
              n: "EBhRb6NzmCprA7p1TubnPfaDkqDIPbSwuG1sUh7DalWq",
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
          name: "witness.EDF-9IqgR4PJY7wbHD-2AXkxnN6v3syzwHV-WNIOMtvK",
          metadata: { pre: "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG", sn: 4 },
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
          d: "EPiJg8dr85f7gxsqS5aatchdXd7lUgWBvAzeyt5YQIAe",
          u: "0AAR4PAjL6mV652tH6oElTeK",
          i: "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG",
          ri: "EMASG0VnzsqD6M05aisJn_2WpiGtq-R60oTjC7V9db7K",
          s: "EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw",
          a: {
            d: "EF0DpTizv4UASZhTw28_ahP8nT2GQAxpcL1K-q9JV0-L",
            i: "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "John Doe",
            engagementContextRole: "Managing Director",
            dt: "2025-07-18T00:32:37.263000+00:00"
          },
          e: {
            d: "EJiyyaCGlPPGA3CvqtR_3SSYRFmZb7hwG2NU9_YniYEe",
            le: {
              n: "EBhRb6NzmCprA7p1TubnPfaDkqDIPbSwuG1sUh7DalWq",
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
    Successfully issued credential with SAID: EPiJg8dr85f7gxsqS5aatchdXd7lUgWBvAzeyt5YQIAe
    
      Granting Credential  
    
    AID "le" granting credential to AID "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD" via IPEX...
    Successfully submitted IPEX grant from "le" to "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
      Admitting Grant  
    
    AID "role" admitting IPEX grant "EE98D8N3Tx99IljSRWK9iYrc8VxvoYEWtdNDCba8IWts" from AID "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG"...
    Successfully submitted IPEX admit for grant "EE98D8N3Tx99IljSRWK9iYrc8VxvoYEWtdNDCba8IWts".
    Marking notification "0ACcGOvtuiQwlXY4wKZdcpeG" as read...
    Notification "0ACcGOvtuiQwlXY4wKZdcpeG" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0AAkd7dOY6wd0tqsnBada0do" as read...
    Notification "0AAkd7dOY6wd0tqsnBada0do" marked as read.
    
      You can continue ✅  
    
    


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

    
      Issuing Credential  
    
    Issuing credential from AID "qvi" to AID "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD"...
    {
      name: "credential.ECI7JLJXxHfbXa8tIKRpb7qAegNjOyRnGpppvc04Npx5",
      metadata: {
        ced: {
          v: "ACDC10JSON0007e8_",
          d: "ECI7JLJXxHfbXa8tIKRpb7qAegNjOyRnGpppvc04Npx5",
          u: "0AAVQUbEDuotWzToMzTaSOdr",
          i: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
          ri: "ECpgAt4SKlKvNL90AE-fkOZ1OH7mvhMP7iCmq_PNUM2r",
          s: "EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw",
          a: {
            d: "EOPKWjQIdGxpuaZ0hCZsWIWZM5zPxPPByNw8cV_j4qEn",
            i: "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "John Doe",
            engagementContextRole: "Managing Director",
            dt: "2025-07-18T00:32:44.767000+00:00"
          },
          e: {
            d: "ENI6yPGvSOZliA6OtRWgD6da5JXZk1VpHi8SQWuTEx-p",
            auth: {
              n: "EK6ZSkelhfJR2i1aKVOzMAaTLyJZZVaaNGVtm2qG3Ned",
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
          name: "witness.EKMeHTsXwxQHzoSesLa-hIwFrrWTtvl3QT0VUywl8lIY",
          metadata: { pre: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb", sn: 4 },
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
          d: "ECI7JLJXxHfbXa8tIKRpb7qAegNjOyRnGpppvc04Npx5",
          u: "0AAVQUbEDuotWzToMzTaSOdr",
          i: "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
          ri: "ECpgAt4SKlKvNL90AE-fkOZ1OH7mvhMP7iCmq_PNUM2r",
          s: "EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw",
          a: {
            d: "EOPKWjQIdGxpuaZ0hCZsWIWZM5zPxPPByNw8cV_j4qEn",
            i: "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD",
            LEI: "875500ELOZEL05BVXV37",
            personLegalName: "John Doe",
            engagementContextRole: "Managing Director",
            dt: "2025-07-18T00:32:44.767000+00:00"
          },
          e: {
            d: "ENI6yPGvSOZliA6OtRWgD6da5JXZk1VpHi8SQWuTEx-p",
            auth: {
              n: "EK6ZSkelhfJR2i1aKVOzMAaTLyJZZVaaNGVtm2qG3Ned",
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
    Successfully issued credential with SAID: ECI7JLJXxHfbXa8tIKRpb7qAegNjOyRnGpppvc04Npx5
    
      Granting Credential  
    
    AID "qvi" granting credential to AID "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD" via IPEX...
    Successfully submitted IPEX grant from "qvi" to "EBH5kVgvQouoPqfTTcXPCkTbqeuWs4ECpndQucY6N3UD".
    Waiting for notification with route "/exn/ipex/grant"...
    [Retry] Grant notification not found on attempt #1 of 5
    [Retry] Waiting 5000ms before next attempt...
    
      Admitting Grant  
    
    AID "role" admitting IPEX grant "ECJEoAxtCbhlOJmT-a3Sa5axCtsw77GtxCdDM40MNttr" from AID "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb"...
    Successfully submitted IPEX admit for grant "ECJEoAxtCbhlOJmT-a3Sa5axCtsw77GtxCdDM40MNttr".
    Marking notification "0ABaltHWBnhZ3XkQGpXrMiA_" as read...
    Notification "0ABaltHWBnhZ3XkQGpXrMiA_" marked as read.
    Waiting for notification with route "/exn/ipex/admit"...
    Marking notification "0ABJHytAegvmC4gT8kc4htzt" as read...
    Notification "0ABJHytAegvmC4gT8kc4htzt" marked as read.
    
      You can continue ✅  
    
    


## The vLEI Reporting Agent

Once credentials like the ones created in this chain are issued and held by their respective entities, a common next step is to present them for verification or auditing. The vLEI Audit Reporting Agent, known as Sally, is a component designed for this purpose.

Sally acts as a direct-mode validator. It receives presentations of vLEI credentials (like the QVI, vLEI and OOR credentials), cryptographically verifies their structure and integrity, and then performs a POST request to a pre-configured webhook URL. This allows external systems to receive trusted, real-time notifications about credential presentations and revocations within the vLEI ecosystem.

For more details about Sally go to its Github **[repository](https://github.com/GLEIF-IT/sally)**.

To continue with the example you need to start the sally service following the instructions below (⚠️ The command is programatically generated) in the root directory of these training materials so the correct docker compose file is found.


```typescript
// Ask user to start the sally service setting the proper root of trust for this run
prAlert(`Please run this command on you local machine in the vlei-trainings directory before continuing, and wait for the container to start:`)

prMessage(`GEDA_PRE=${gleifPrefix} docker compose up --build direct-sally -d`)

const isReady = confirm("Is the service running and ready to accept connections?");
if (isReady) {
    prContinue()
} else {
    throw new Error("❌ Script aborted by user. Please start the service and run the script again.");
}

```

    
    Please run this command on you local machine in the vlei-trainings directory before continuing, and wait for the container to start:
    
    
    GEDA_PRE=EKOhpyKyDF4QV7lWP3ZQogr9U5ob2IAy7KrtFuNSio22 docker compose up --build direct-sally -d
    


    Is the service running and ready to accept connections? [y/N]  y


    
      You can continue ✅  
    
    


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

<div class="alert alert-danger">
    <b>⚠️ BUG ALERT</b><hr>
    <p>There is a known issue where Sally cannot process credential presentation on the first attempt. To work around this, run the code cell below twice</p>  
    <p>For more details on this and other issues, please see the <a href="900_05_Known_Issues.ipynb">Known Issues Section</a></p>
</div>


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
    
      Presenting vLEI Credential to sally  
    
    AID "le" granting credential to AID "ECLwKe5b33BaV20x7HZWYi_KUXgY91S41fRL2uCaf4WQ" via IPEX...
    Successfully submitted IPEX grant from "le" to "ECLwKe5b33BaV20x7HZWYi_KUXgY91S41fRL2uCaf4WQ".
    
    Received 404 from Sally
    
    
    Received 404 from Sally
    
    
    Received 404 from Sally
    
    
    Received 404 from Sally
    
    
    Received 200 from Sally
    
    
      Fetching Credential Info...  
    
    
    {
      "credential": "EBhRb6NzmCprA7p1TubnPfaDkqDIPbSwuG1sUh7DalWq",
      "type": "LE",
      "issuer": "EF9f9EHcW2r42dxOe0nCe73-qmHEJaJJM9YhiC1M-uxb",
      "holder": "EIAaw14n2zX8zfn6IkFLI6k_Gta26wCWV1B27CE9V6OG",
      "LEI": "875500ELOZEL05BVXV37",
      "personLegalName": "",
      "officialRole": ""
    }
    
    
      You can continue ✅  
    
    


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
