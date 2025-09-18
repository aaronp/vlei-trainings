# AID
Are unique, stable identifiers.
Can be created by a user's own public key.
Can also be given an alias.
Should be verified against the latest key pair for that AID.

See http://localhost:8888/lab/workspaces/auto-h/tree/101_20_Working_with_Keystores_and_AIDs_via_KLI.ipynb


We should also be able to rotate keypairs as per [here](http://localhost:8888/lab/workspaces/auto-h/tree/101_30_Key_Rotation.ipynb)

# CESR

[Composable Event Streaming Record](https://trustoverip.github.io/tswg-cesr-specification/)

a Signing message digests produce a CESR

See http://localhost:8888/lab/workspaces/auto-h/tree/101_25_Signatures.ipynb

The user should be able to create their own keypairs and sign messages (see 'Signing Data' and 'Verifying a Valid Signature')


# Direct and Indirect Operations

See [here](http://localhost:8888/lab/workspaces/auto-h/tree/101_35_Modes_oobis_and_witnesses.ipynb)

Regarding [OOBIs](http://localhost:8888/lab/workspaces/auto-h/tree/101_35_Modes_oobis_and_witnesses.ipynb)


--- Wizard ---


  Based on the ACDC issuance flow from 101_65_ACDC_Issuance.md, here are several approaches for implementing a
  comprehensive wizard:

  ---
  🎯 Option 1: Dual-Role Single Wizard

  Complete end-to-end flow with role switching

  Architecture:

  /wizard
  ├── /components
  │   ├── WizardLayout.tsx           // Main wizard container
  │   ├── RoleSelector.tsx           // Choose Issuer or Holder
  │   ├── StepIndicator.tsx          // Progress visualization
  │   └── /steps
  │       ├── IssuerSteps/
  │       │   ├── 1-SetupIdentity.tsx
  │       │   ├── 2-CreateRegistry.tsx
  │       │   ├── 3-PrepareSchema.tsx
  │       │   ├── 4-DefineCredential.tsx
  │       │   ├── 5-IssueCredential.tsx
  │       │   └── 6-SendGrant.tsx
  │       └── HolderSteps/
  │           ├── 1-SetupIdentity.tsx
  │           ├── 2-ConnectToIssuer.tsx
  │           ├── 3-ReceiveGrant.tsx
  │           └── 4-AdmitCredential.tsx
  ├── /services
  │   ├── wizardState.service.ts     // Cross-step state management
  │   └── ipex.service.ts           // IPEX protocol handler
  └── /types
      └── wizard.types.ts           // Wizard-specific interfaces

  Flow:

  1. Role Selection → Choose Issuer or Holder path
  2. Identity Setup → AID creation/selection
  3. OOBI Exchange → Connect parties
  4. Credential Process → Issue or receive based on role
  5. IPEX Exchange → Grant/Admit flow
  6. Completion → Success confirmation

  Pros: Complete story, educational, single interface
  Cons: Complex state management, requires both roles

  ---
  🎯 Option 2: Separate Role-Specific Wizards

  Independent issuer and holder experiences

  Architecture:

  /wizard
  ├── /issuer-wizard             // Issuer-focused flow
  │   ├── WizardLayout.tsx
  │   ├── /steps
  │   │   ├── 1-SelectHolder.tsx      // Choose/invite holder
  │   │   ├── 2-SetupRegistry.tsx     // Registry management
  │   │   ├── 3-SchemaSelection.tsx   // Schema choice/creation
  │   │   ├── 4-CredentialForm.tsx    // Fill credential data
  │   │   ├── 5-ReviewAndIssue.tsx    // Final review
  │   │   └── 6-SendToHolder.tsx      // IPEX grant
  │   └── /services
  │       └── issuerWizard.service.ts
  └── /holder-wizard             // Holder-focused flow  
      ├── WizardLayout.tsx
      ├── /steps
      │   ├── 1-ConnectToIssuer.tsx   // OOBI resolution
      │   ├── 2-PendingGrants.tsx     // View incoming offers
      │   ├── 3-ReviewCredential.tsx  // Examine offer
      │   └── 4-AcceptCredential.tsx  // Admit process
      └── /services
          └── holderWizard.service.ts

  Navigation:

  - /wizard/issuer - Issuer flow
  - /wizard/holder - Holder flow
  - /wizard - Role selection landing

  Pros: Focused UX, role-specific optimization, cleaner state
  Cons: Separate maintenance, less educational continuity

  ---
  🎯 Option 3: Progressive Disclosure Wizard

  Adaptive complexity based on user experience

  Architecture:

  /wizard
  ├── WizardOrchestrator.tsx     // Smart flow controller
  ├── /modes
  │   ├── /basic                 // Simplified 3-step flow
  │   │   ├── 1-QuickSetup.tsx
  │   │   ├── 2-IssueCredential.tsx
  │   │   └── 3-Complete.tsx
  │   ├── /guided                // Full tutorial flow (as Option 1)
  │   │   └── [complete steps]
  │   └── /expert                // Advanced configuration
  │       └── [technical steps]
  ├── /shared
  │   ├── StepContainer.tsx
  │   ├── ProgressTracker.tsx
  │   └── HelpPanel.tsx
  └── /services
      ├── complexityAdapter.service.ts
      └── tutorialGuide.service.ts

  User Flows:

  - Beginner: "I want to try issuing a VLEI" → Basic mode
  - Learning: "Show me how it works" → Guided mode
  - Expert: "I know what I'm doing" → Expert mode

  Pros: Adaptive UX, educational scaling, broad audience
  Cons: Complex orchestration, multiple UI variants

  ---
  🎯 Option 4: Simulation-Based Demo Wizard

  Live demonstration with mock interactions

  Architecture:

  /wizard
  ├── SimulationEngine.tsx       // Orchestrates demo
  ├── /personas
  │   ├── IssuerPersona.tsx      // Simulated issuer
  │   ├── HolderPersona.tsx      // Simulated holder  
  │   └── VerifierPersona.tsx    // Optional verifier
  ├── /scenarios
  │   ├── VLEIIssuance.scenario.ts
  │   ├── AccessPass.scenario.ts
  │   └── Custom.scenario.ts
  ├── /components
  │   ├── PersonaSwitcher.tsx
  │   ├── MessageFlow.tsx        // Visual IPEX messages
  │   ├── StateViewer.tsx        // Real-time state
  │   └── ActionPanel.tsx        // User interactions
  └── /services
      ├── simulation.service.ts
      └── mockData.service.ts

  Experience:

  1. Scenario Selection → Choose credential type
  2. Multi-Persona View → See both sides simultaneously
  3. Step-by-Step Actions → Click to advance each step
  4. Live State Updates → See real KERI operations
  5. Message Visualization → IPEX flow animation

  Pros: Educational, visual, realistic, no setup required
  Cons: Complex simulation engine, may not feel "real"

  ---
  🎯 Option 5: Production-Ready Workflow

  Real-world business process implementation

  Architecture:

  /wizard
  ├── /workflows
  │   ├── OrganizationalRole.workflow.ts    // vLEI OOR
  │   ├── LegalEntity.workflow.ts           // vLEI LE
  │   ├── QualifiedIssuer.workflow.ts       // vLEI QI
  │   └── Custom.workflow.ts                // User-defined
  ├── /components
  │   ├── WorkflowSelector.tsx
  │   ├── BusinessRoleAssignment.tsx
  │   ├── ComplianceChecks.tsx
  │   ├── LegalEntityVerification.tsx
  │   └── ProductionDeployment.tsx
  ├── /integrations
  │   ├── gleif.integration.ts              // GLEIF systems
  │   ├── witnesses.integration.ts          // Witness network
  │   └── backup.integration.ts             // Key backup
  └── /compliance
      ├── auditLog.service.ts
      └── riskAssessment.service.ts

  Features:

  - Pre-configured vLEI Types
  - Compliance Validation
  - Business Process Integration
  - Production Witness Networks
  - Audit Trail Generation

  Pros: Production-ready, compliance-focused, business value
  Cons: Complex requirements, assumes production deployment

  ---
  🚀 Recommended Implementation Strategy

  Phase 1: Start with Option 2 (Separate Role Wizards)

  - Issuer Wizard: Focus on credential creation flow
  - Holder Wizard: Focus on credential receipt flow
  - Clean separation allows parallel development

  Phase 2: Add Option 1 (Dual-Role)

  - Combine both wizards with role switching
  - Add educational cross-references between steps

  Phase 3: Consider Option 4 (Simulation)

  - Add demonstration mode for training/demos
  - Visual IPEX message flow

  Technical Foundation Needed:

  // Core services to implement first
  - ipex.service.ts          // IPEX protocol operations
  - registry.service.ts      // Credential registry management  
  - schema.service.ts        // Enhanced schema operations
  - wizard.state.service.ts  // Cross-step state management
  - oobi.service.ts          // Enhanced OOBI operations