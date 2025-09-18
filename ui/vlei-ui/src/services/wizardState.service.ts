export interface WizardStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed' | 'error';
  data?: any;
}

export interface IssuerWizardState {
  currentStep: number;
  selectedAid: string;
  registry: {
    name: string;
    regk: string;
  } | null;
  schema: {
    said: string;
    name: string;
    jsonSchema?: any;
  } | null;
  credential: {
    said: string;
    data: any;
  } | null;
  holderAid: string;
  grantSaid: string;
  nextStepsForHolder: string[];
}

export interface HolderWizardState {
  currentStep: number;
  selectedAid: string;
  issuerAid: string;
  issuerOOBI: string;
  receivedGrants: any[];
  selectedGrant: any | null;
  admittedCredential: any | null;
  nextStepsForIssuer: string[];
}

export interface CoordinationInfo {
  myRole: 'issuer' | 'holder';
  myAid: string;
  myOOBI: string;
  partnerRole: 'issuer' | 'holder';
  partnerAid: string;
  partnerOOBI: string;
  status: 'setup' | 'connected' | 'credential-issued' | 'credential-received' | 'completed';
}

export class WizardStateService {
  private readonly ISSUER_STATE_KEY = 'vlei-wizard-issuer-state';
  private readonly HOLDER_STATE_KEY = 'vlei-wizard-holder-state';
  private readonly COORDINATION_KEY = 'vlei-wizard-coordination';

  // Issuer State Management
  getIssuerState(): IssuerWizardState {
    const stored = localStorage.getItem(this.ISSUER_STATE_KEY);
    return stored ? JSON.parse(stored) : this.getDefaultIssuerState();
  }

  saveIssuerState(state: Partial<IssuerWizardState>): void {
    const currentState = this.getIssuerState();
    const newState = { ...currentState, ...state };
    localStorage.setItem(this.ISSUER_STATE_KEY, JSON.stringify(newState));
  }

  private getDefaultIssuerState(): IssuerWizardState {
    return {
      currentStep: 0,
      selectedAid: '',
      registry: null,
      schema: null,
      credential: null,
      holderAid: '',
      grantSaid: '',
      nextStepsForHolder: []
    };
  }

  // Holder State Management
  getHolderState(): HolderWizardState {
    const stored = localStorage.getItem(this.HOLDER_STATE_KEY);
    return stored ? JSON.parse(stored) : this.getDefaultHolderState();
  }

  saveHolderState(state: Partial<HolderWizardState>): void {
    const currentState = this.getHolderState();
    const newState = { ...currentState, ...state };
    localStorage.setItem(this.HOLDER_STATE_KEY, JSON.stringify(newState));
  }

  private getDefaultHolderState(): HolderWizardState {
    return {
      currentStep: 0,
      selectedAid: '',
      issuerAid: '',
      issuerOOBI: '',
      receivedGrants: [],
      selectedGrant: null,
      admittedCredential: null,
      nextStepsForIssuer: []
    };
  }

  // Coordination State Management
  getCoordinationInfo(): CoordinationInfo | null {
    const stored = localStorage.getItem(this.COORDINATION_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  saveCoordinationInfo(info: Partial<CoordinationInfo>): void {
    const currentInfo = this.getCoordinationInfo();
    const newInfo = currentInfo ? { ...currentInfo, ...info } : info as CoordinationInfo;
    localStorage.setItem(this.COORDINATION_KEY, JSON.stringify(newInfo));
  }

  // Step Navigation
  getIssuerSteps(): WizardStep[] {
    return [
      {
        id: 'select-aid',
        title: 'Select Issuer AID',
        description: 'Choose which of your AIDs will issue the credential',
        status: 'pending'
      },
      {
        id: 'setup-registry',
        title: 'Setup Registry',
        description: 'Create or select a credential registry',
        status: 'pending'
      },
      {
        id: 'choose-schema',
        title: 'Choose Schema',
        description: 'Select the credential type and schema',
        status: 'pending'
      },
      {
        id: 'create-credential',
        title: 'Create Credential',
        description: 'Fill in credential data and create ACDC',
        status: 'pending'
      },
      {
        id: 'send-grant',
        title: 'Send to Holder',
        description: 'Send credential offer via IPEX',
        status: 'pending'
      },
      {
        id: 'completion',
        title: 'Complete',
        description: 'Credential issued successfully',
        status: 'pending'
      }
    ];
  }

  getHolderSteps(): WizardStep[] {
    return [
      {
        id: 'select-aid',
        title: 'Select Holder AID',
        description: 'Choose which of your AIDs will receive the credential',
        status: 'pending'
      },
      {
        id: 'connect-issuer',
        title: 'Connect to Issuer',
        description: 'Resolve issuer OOBI and establish trust',
        status: 'pending'
      },
      {
        id: 'receive-grant',
        title: 'Receive Offers',
        description: 'Check for incoming credential offers',
        status: 'pending'
      },
      {
        id: 'review-credential',
        title: 'Review Credential',
        description: 'Examine the offered credential details',
        status: 'pending'
      },
      {
        id: 'admit-credential',
        title: 'Accept Credential',
        description: 'Admit credential to your wallet',
        status: 'pending'
      },
      {
        id: 'completion',
        title: 'Complete',
        description: 'Credential received successfully',
        status: 'pending'
      }
    ];
  }

  // Generate next steps instructions
  generateNextStepsForHolder(issuerState: IssuerWizardState): string[] {
    const steps: string[] = [];
    
    if (issuerState.currentStep === 0) {
      steps.push("Holder should create an AID if they don't have one");
      steps.push("Holder should share their AID with you");
    } else if (issuerState.currentStep === 1) {
      steps.push("Holder should wait while you set up the registry");
    } else if (issuerState.currentStep === 2) {
      steps.push("Holder should wait while you choose the credential schema");
    } else if (issuerState.currentStep === 3) {
      steps.push("Holder should wait while you create the credential");
    } else if (issuerState.currentStep === 4) {
      steps.push("Holder should check for incoming credential offers");
      steps.push("Holder should use the Holder Wizard to receive the credential");
    } else if (issuerState.currentStep === 5) {
      steps.push("Credential sent! Holder should check their messages");
      steps.push("Wait for holder to admit the credential");
    }

    return steps;
  }

  generateNextStepsForIssuer(holderState: HolderWizardState): string[] {
    const steps: string[] = [];
    
    if (holderState.currentStep === 0) {
      steps.push("Issuer should create an AID if they don't have one");
      steps.push("Share your AID with the issuer");
    } else if (holderState.currentStep === 1) {
      steps.push("Share your OOBI with the issuer");
      steps.push("Get the issuer's OOBI to establish connection");
    } else if (holderState.currentStep === 2) {
      steps.push("Issuer should create and send the credential");
      steps.push("Check the Issuer Wizard for credential creation steps");
    } else if (holderState.currentStep === 3) {
      steps.push("Review the credential offer carefully");
      steps.push("Issuer is waiting for your response");
    } else if (holderState.currentStep === 4) {
      steps.push("Accept the credential if it looks correct");
    } else if (holderState.currentStep === 5) {
      steps.push("Credential received! Process complete");
    }

    return steps;
  }

  // Clear wizard state (for testing/reset)
  clearWizardState(): void {
    localStorage.removeItem(this.ISSUER_STATE_KEY);
    localStorage.removeItem(this.HOLDER_STATE_KEY);
    localStorage.removeItem(this.COORDINATION_KEY);
    console.log('Wizard state cleared');
  }

  // Export state for sharing/debugging
  exportWizardState(): any {
    return {
      issuer: this.getIssuerState(),
      holder: this.getHolderState(),
      coordination: this.getCoordinationInfo(),
      timestamp: new Date().toISOString()
    };
  }

  // Import state from export
  importWizardState(state: any): void {
    if (state.issuer) {
      localStorage.setItem(this.ISSUER_STATE_KEY, JSON.stringify(state.issuer));
    }
    if (state.holder) {
      localStorage.setItem(this.HOLDER_STATE_KEY, JSON.stringify(state.holder));
    }
    if (state.coordination) {
      localStorage.setItem(this.COORDINATION_KEY, JSON.stringify(state.coordination));
    }
    console.log('Wizard state imported from:', state.timestamp);
  }
}

// Create singleton instance
export const wizardStateService = new WizardStateService();