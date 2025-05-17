import {
    randomPasscode,
    ready,
    SignifyClient,
    Tier,
    CreateIdentiferArgs,
    State,
    Operation,
    Contact
} from 'npm:signify-ts';

// Default Keria connection parameters (adjust as needed for your environment)
export const DEFAULT_ADMIN_URL = 'http://keria:3901'; 
export const DEFAULT_BOOT_URL = 'http://keria:3903';  
export const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds for operations
export const DEFAULT_DELAY_MS = 5000; // 5 seconds for operations
export const DEFAULT_RETRIES = 5;     // For retries
export const ROLE_AGENT = 'agent'
export const IPEX_GRANT_ROUTE = '/exn/ipex/grant'
export const IPEX_ADMIT_ROUTE = '/exn/ipex/admit'
export const IPEX_APPLY_ROUTE = '/exn/ipex/apply'
export const IPEX_OFFER_ROUTE = '/exn/ipex/offer'
export const SCHEMA_SERVER_HOST = 'http://vlei-server:7723/';

export const DEFAULT_IDENTIFIER_ARGS = {
    toad: 3,
    wits: [  
        'BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha',
        'BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM',
        'BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX'
    ]
};

/**
 * Initializes the Signify-ts library.
 */
export async function initializeSignify() {
    await ready();
    console.log('Signify-ts library initialized.');
}

/**
 * Creates a new SignifyClient instance, boots it, and connects to the Keria agent.
 *
 * @returns {Promise<{ client: SignifyClient; bran: string; clientState: State }>}
 * The initialized client, its bran, and state. 
 */
export async function initializeAndConnectClient(
    bran: string,
    adminUrl: string = DEFAULT_ADMIN_URL,
    bootUrl: string = DEFAULT_BOOT_URL,
    tier: Tier = Tier.low
): Promise<{ client: SignifyClient;clientState: State }> {

    console.log(`Using Passcode (bran): ${bran}`);

    const client = new SignifyClient(adminUrl, bran, tier, bootUrl);

    try {
        await client.boot();
        console.log('Client boot process initiated with Keria agent.');

        await client.connect();
        const clientState = await client.state();

        console.log('  Client AID Prefix: ', clientState?.controller?.state?.i);
        console.log('  Agent AID Prefix:  ', clientState?.agent?.i);

        return { client, clientState };
    } catch (error) {
        console.error('Failed to initialize or connect client:', error);
        throw error;
    }
}

/**
 * Creates a new AID using the provided client.
 *
 * @param {SignifyClient} client - The initialized SignifyClient.
 * @param {string} alias - A human-readable alias for the AID.
 * @param {CreateIdentiferArgs} [identifierArgs=DEFAULT_IDENTIFIER_ARGS] - Configuration for the new AID.
 * @returns {Promise<{ aid: any; operation: Operation<T> }>} The created AID's inception event and the operation details.
 */
export async function createNewAID(
    client: SignifyClient,
    alias: string,
    identifierArgs: CreateIdentiferArgs = DEFAULT_IDENTIFIER_ARGS
): Promise<{ aid: any; operation: Operation<T> }> {
    console.log(`Initiating AID inception for alias: ${alias}`);
    try {
        const inceptionResult = await client.identifiers().create(alias, identifierArgs as any);
        const operationDetails = await inceptionResult.op();

        const completedOperation = await client
            .operations()
            .wait(operationDetails, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

        if (completedOperation.error) {
            throw new Error(`AID creation failed: ${JSON.stringify(completedOperation.error)}`);
        }

        const newAidInceptionEvent = completedOperation.response;
        console.log(`Successfully created AID with prefix: ${newAidInceptionEvent?.i}`);

        await client.operations().delete(completedOperation.name);

        return { aid: newAidInceptionEvent, operation: completedOperation };
    } catch (error) {
        console.error(`Failed to create AID for alias "${alias}":`, error);
        throw error;
    }
}

/**
 * Assigns an end role for a given AID to the client's Keria Agent AID.
 *
 * @returns {Promise<{ operation: Operation<T> }>} The operation details.
 */
export async function addEndRoleForAID(
    client: SignifyClient,
    aidAlias: string,
    role: string
): Promise<{ operation: Operation<T> }> {
    if (!client.agent?.pre) {
        throw new Error('Client agent prefix is not available.');
    }
    const agentAIDPrefix = client.agent.pre;

    console.log(`Assigning '${role}' role to Keria Agent ${agentAIDPrefix} for AID alias ${aidAlias}`);
    try {
        const addRoleResult = await client
            .identifiers()
            .addEndRole(aidAlias, role, agentAIDPrefix);

        const operationDetails = await addRoleResult.op();

        const completedOperation = await client
            .operations()
            .wait(operationDetails, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

        console.log(`Successfully assigned '${role}' role for AID alias ${aidAlias}.`);

        await client.operations().delete(completedOperation.name);

        return { operation: completedOperation };
    } catch (error) {
        console.error(`Failed to add end role for AID alias "${aidAlias}":`, error);
        throw error;
    }
}

/**
 * Generates an OOBI URL for a given AID and role.
 * The arguments for client.oobis().get() are passed directly.
 *
 * @returns {Promise<string>} The generated OOBI URL.
 */
export async function generateOOBI(
    client: SignifyClient,
    aidAlias: string,
    role: string = 'agent'
): Promise<string> {
    console.log(`Generating OOBI for AID alias ${aidAlias} with role ${role}`);
    try {
        const oobiResult = await client.oobis().get(aidAlias, role);
        if (!oobiResult?.oobis?.length) {
            throw new Error('No OOBI URL returned from Keria agent.');
        }
        const oobiUrl = oobiResult.oobis[0];
        console.log(`Generated OOBI URL: ${oobiUrl}`);
        return oobiUrl;
    } catch (error) {
        console.error(`Failed to generate OOBI for AID alias "${aidAlias}":`, error);
        throw error;
    }
}

/**
 * Resolves an OOBI URL
 *
 * @returns {Promise<{ operation: Operation<T>; contacts?: Contact[] }>} The operation details and the resolved contact.
 */
export async function resolveOOBI(
    client: SignifyClient,
    oobiUrl: string,
    contactAlias: string
): Promise<{ operation: Operation<T>; contacts?: Contact[] }> { 
    console.log(`Resolving OOBI URL: ${oobiUrl} with alias ${contactAlias}`);
    try {
        const resolveOperationDetails = await client.oobis().resolve(oobiUrl, contactAlias);
        const completedOperation = await client
            .operations()
            .wait(resolveOperationDetails, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

        if (completedOperation.error) {
            throw new Error(`OOBI resolution failed: ${JSON.stringify(completedOperation.error)}`);
        }
        console.log(`Successfully resolved OOBI URL. Response:`, completedOperation.response ? "OK" : "No response data");

        const contact = await client.contacts().list(undefined, 'alias', contactAlias);

        if (contact) {
            console.log(`Contact "${contactAlias}" (ID: ${contact.id}) added/updated.`);
        } else {
            console.warn(`Contact "${contactAlias}" not found after OOBI resolution.`);
        }

        await client.operations().delete(completedOperation.name);
        
        return { operation: completedOperation, contact: contact };
    } catch (error) {
        console.error(`Failed to resolve OOBI URL "${oobiUrl}":`, error);
        throw error;
    }
}

/**
 * Generates challenge words for authentication.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {number} [strength=128] - The bit strength for the challenge (e.g., 128, 256).
 * @returns {Promise<string[]>} A promise that resolves to an array of challenge words.
 */
export async function generateChallengeWords(
    client: SignifyClient,
    strength: number = 128
): Promise<string[]> {
    console.log(`Generating ${strength}-bit challenge words...`);
    try {
        const challenge = await client.challenges().generate(strength);
        console.log('Generated challenge words:', challenge.words);
        return challenge.words;
    } catch (error) {
        console.error('Failed to generate challenge words:', error);
        throw error;
    }
}

/**
 * Responds to a challenge by signing the words and sending them to the challenger.
 * @param {SignifyClient} client - The SignifyClient instance of the responder.
 * @param {string} sourceAidAlias - The alias of the AID that is responding (signing).
 * @param {string} recipientAidPrefix - The AID prefix of the challenger (to whom the response is sent).
 * @param {string[]} challengeWords - The array of challenge words to sign.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export async function respondToChallenge(
    client: SignifyClient,
    sourceAidAlias: string,
    recipientAidPrefix: string,
    challengeWords: string[]
): Promise<void> {
    console.log(`AID alias '${sourceAidAlias}' responding to challenge from AID '${recipientAidPrefix}'...`);
    try {
        await client.challenges().respond(sourceAidAlias, recipientAidPrefix, challengeWords);
        console.log('Challenge response sent.');
    } catch (error) {
        console.error('Failed to respond to challenge:', error);
        throw error;
    }
}

/**
 * Verifies a challenge response received from another AID.
 * @param {SignifyClient} client - The SignifyClient instance of the verifier.
 * @param {string} allegedSenderAidPrefix - The AID prefix of the AID that allegedly sent the response.
 * @param {string[]} originalChallengeWords - The original challenge words that were sent.
 * @returns {Promise<{ verified: boolean; said?: string; operation?: Operation<T> }>}
 * A promise that resolves to an object indicating if verification was successful,
 * the SAID of the signed exchange message, and the operation details.
 */
export async function verifyChallengeResponse(
    client: SignifyClient,
    allegedSenderAidPrefix: string,
    originalChallengeWords: string[]
): Promise<{ verified: boolean; said?: string; operation?: Operation<T> }> {
    console.log(`Verifying challenge response from AID '${allegedSenderAidPrefix}'...`);
    try {
        const verifyOperation = await client.challenges().verify(allegedSenderAidPrefix, originalChallengeWords);
        const completedOperation = await client
            .operations()
            .wait(verifyOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

        if (completedOperation.error) {
            console.error('Challenge verification failed:', completedOperation.error);
            await client.operations().delete(completedOperation.name);
            return { verified: false, operation: completedOperation };
        }

        const said = completedOperation.response?.exn?.d;
        console.log(`Challenge response verified successfully. SAID of exn: ${said}`);
        
        await client.operations().delete(completedOperation.name);

        return { verified: true, said: said, operation: completedOperation };
    } catch (error) {
        console.error('Failed to verify challenge response:', error);
        throw error;
    }
}

/**
 * Marks a challenge for a contact as authenticated.
 * This is done after successful verification of a challenge response.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {string} contactAidPrefix - The AID prefix of the contact to mark as authenticated.
 * @param {string} signedChallengeSaid - The SAID of the signed challenge exchange message (exn).
 * @returns {Promise<void>} A promise that resolves when the contact is marked.
 */
export async function markChallengeAuthenticated(
    client: SignifyClient,
    contactAidPrefix: string,
    signedChallengeSaid: string
): Promise<void> {
    console.log(`Marking challenge for contact AID '${contactAidPrefix}' as authenticated with SAID '${signedChallengeSaid}'...`);
    try {
        await client.challenges().responded(contactAidPrefix, signedChallengeSaid);
        console.log(`Contact AID '${contactAidPrefix}' marked as authenticated.`);
    } catch (error) {
        console.error(`Failed to mark challenge as authenticated for contact AID '${contactAidPrefix}':`, error);
        throw error;
    }
}

export function createTimestamp() {
    return new Date().toISOString().replace('Z', '000+00:00');
}

// --- Example Usage ---
export async function test() {
    try {
        await initializeSignify();

        // --- Client A (Alfred) Setup ---
        console.log('\n--- Initializing Client A (Alfred) ---');
        const { client: clientA, clientState: clientAState } = await initializeAndConnectClient(randomPasscode());
        const alfredClientAID = clientAState?.controller?.state?.i || 'Unknown Client AID A';
        const aidAAlias = 'alfredPrimaryAID';
        console.log('\n--- Creating AID for Alfred ---');
        const { aid: aidAObj} = await createNewAID(clientA, aidAAlias, DEFAULT_IDENTIFIER_ARGS);
        const aidAPrefix = aidAObj?.i || 'Unknown AID A Prefix';
        console.log(`Alfred's primary AID: ${aidAPrefix}`);
        console.log('\n--- Adding Agent End Role for Alfred ---');
        await addEndRoleForAID(clientA, aidAAlias, 'agent');
        console.log('\n--- Generating OOBI for Alfred ---');
        const alfredOOBI = await generateOOBI(clientA, aidAAlias, 'agent');

        // --- Client B (Betty) Setup ---
        console.log('\n\n--- Initializing Client B (Betty) ---');
        const { client: clientB, clientState: clientBState } = await initializeAndConnectClient(randomPasscode());
        const bettyClientAID = clientBState?.controller?.state?.i || 'Unknown Client AID B';
        const aidBAlias = 'bettyPrimaryAID';
        console.log('\n--- Creating AID for Betty ---');
        const { aid: aidBObj } = await createNewAID(clientB, aidBAlias, DEFAULT_IDENTIFIER_ARGS);
        const aidBPrefix = aidBObj?.i || 'Unknown AID B Prefix';
        console.log(`Betty's primary AID: ${aidBPrefix}`);
        console.log('\n--- Adding Agent End Role for Betty ---');
        await addEndRoleForAID(clientB, aidBAlias, 'agent');
        console.log('\n--- Generating OOBI for Betty ---');
        const bettyOOBI = await generateOOBI(clientB, aidBAlias, 'agent');

        // --- OOBI Resolution ---
        console.log('\n\n--- Betty resolving Alfred\'s OOBI ---');
        const contactAlfredAlias = 'AlfredsContactForBetty';
        await resolveOOBI(clientB, alfredOOBI, contactAlfredAlias);

        console.log('\n--- Alfred resolving Betty\'s OOBI ---');
        const contactBettyAlias = 'BettysContactForAlfred';
        await resolveOOBI(clientA, bettyOOBI, contactBettyAlias);

        // --- Challenge/Response: Alfred challenges Betty ---
        console.log("\n\n--- MUTUAL AUTHENTICATION ---");
        console.log("\n--- Alfred challenges Betty ---");

        // 1. Alfred generates challenge words for Betty
        const alfredChallengeForBetty = await generateChallengeWords(clientA);

        // (Assume words are securely transmitted out-of-band to Betty)

        // 2. Betty responds to Alfred's challenge
        console.log(`\nBetty (AID: ${aidBPrefix}) responding to Alfred's (AID: ${aidAPrefix}) challenge...`);
        await respondToChallenge(clientB, aidBAlias, aidAPrefix, alfredChallengeForBetty);

        // 3. Alfred verifies Betty's response
        console.log(`\nAlfred (AID: ${aidAPrefix}) verifying Betty's (AID: ${aidBPrefix}) response...`);
        const verificationBetty = await verifyChallengeResponse(clientA, aidBPrefix, alfredChallengeForBetty);

        // 4. Alfred marks Betty as authenticated if verification succeeded
        if (verificationBetty.verified && verificationBetty.said) {
            await markChallengeAuthenticated(clientA, aidBPrefix, verificationBetty.said);
            console.log(`Alfred has successfully authenticated Betty (AID: ${aidBPrefix}).`);
        } else {
            console.error(`Alfred failed to authenticate Betty (AID: ${aidBPrefix}).`);
        }

        // --- Challenge/Response: Betty challenges Alfred ---
        console.log("\n--- Betty challenges Alfred ---");

        // 1. Betty generates challenge words for Alfred
        const bettyChallengeForAlfred = await generateChallengeWords(clientB);

        // (Assume words are securely transmitted out-of-band to Alfred)

        // 2. Alfred responds to Betty's challenge
        console.log(`\nAlfred (AID: ${aidAPrefix}) responding to Betty's (AID: ${aidBPrefix}) challenge...`);
        await respondToChallenge(clientA, aidAAlias, aidBPrefix, bettyChallengeForAlfred);

        // 3. Betty verifies Alfred's response
        console.log(`\nBetty (AID: ${aidBPrefix}) verifying Alfred's (AID: ${aidAPrefix}) response...`);
        const verificationAlfred = await verifyChallengeResponse(clientB, aidAPrefix, bettyChallengeForAlfred);
        
        // 4. Betty marks Alfred as authenticated if verification succeeded
        if (verificationAlfred.verified && verificationAlfred.said) {
            await markChallengeAuthenticated(clientB, aidAPrefix, verificationAlfred.said);
            console.log(`Betty has successfully authenticated Alfred (AID: ${aidAPrefix}).`);
        } else {
            console.error(`Betty failed to authenticate Alfred (AID: ${aidAPrefix}).`);
        }

        console.log('\n\n--- Example scenario with mutual authentication completed! ---');
        console.log(`Alfred's Client AID: ${alfredClientAID}, Primary AID: ${aidAPrefix}`);
        console.log(`Betty's Client AID: ${bettyClientAID}, Primary AID: ${aidBPrefix}`);

        // You can inspect contacts to see authentication status
        const alfredsContacts = await clientA.contacts().list();
        console.log("\nAlfred's contacts:", JSON.stringify(alfredsContacts, null, 2));
        const bettysContacts = await clientB.contacts().list();
        console.log("\nBetty's contacts:", JSON.stringify(bettysContacts, null, 2));
    } catch (error) {
        console.error('\n--- An error occurred in the main example: ---', error);
    }
}
