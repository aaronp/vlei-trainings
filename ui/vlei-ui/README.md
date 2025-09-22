# VLEI Issuance UI

A modern React TypeScript application for issuing Verifiable Legal Entity Identifiers (VLEIs) using KERIA and Signify-TS.

## Features

- **KERIA Integration**: Connect to KERIA agents using Signify-TS
- **Bootstrap/Login Flow**: Create new agents or connect to existing ones with secure passcode management
- **AID Management**: Create and manage Autonomic Identifiers (AIDs)
- **VLEI Issuance**: Issue Legal Entity vLEI credentials following the GLEIF ecosystem standards
- **Credential Management**: View and manage issued credentials
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- Running KERIA instance (default ports: 3901 for admin, 3903 for boot)
- Access to a vLEI schema server (for schema resolution)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Configuration

### KERIA Connection

By default, the application connects to:
- Admin URL: `http://localhost:3901`
- Boot URL: `http://localhost:3903`

These can be changed in the login screen.

### Environment Variables

Create a `.env` file for custom configuration:

```env
VITE_KERIA_ADMIN_URL=http://localhost:3901
VITE_KERIA_BOOT_URL=http://localhost:3903
VITE_SCHEMA_SERVER_URL=http://localhost:7723
```

## Usage

### First Time Setup

1. **Generate a Passcode**: Click "Generate" to create a secure 21-character passcode
2. **Save the Passcode**: Store it securely - you'll need it to reconnect
3. **Check "Create new agent"**: For first-time setup
4. **Click "Bootstrap Agent"**: This creates your client and agent AIDs

### Returning User

1. **Enter your saved passcode**
2. **Uncheck "Create new agent"**  
3. **Click "Connect to Agent"**

### Creating AIDs

1. Navigate to the Dashboard
2. Click "Create AID"
3. Enter an alias (human-readable name)
4. The AID will be created with default witness configuration

### Issuing VLEIs

1. Click "Issue VLEI" from the Dashboard
2. Select an issuer AID (must have a credential registry)
3. Enter recipient information:
   - Recipient AID prefix
   - LEI (20 characters)
   - Legal Entity Name
   - Entity Type
   - Registration Date
   - Status
4. Click "Issue VLEI"

## Architecture

### Services

- **KeriaService**: Core service for KERIA/Signify-TS operations
- **CredentialService**: Handles credential and registry operations

### State Management

- **Zustand Store**: Manages application state with persistence for passcodes

### Components

- **Login**: Bootstrap/connection flow
- **Dashboard**: Main interface showing AIDs and credentials
- **IssueVLEI**: VLEI issuance workflow

## Security Considerations

- **Passcodes are sensitive**: Store them securely, they control your AIDs
- **Never share passcodes**: They provide full control of your identity
- **Use secure connections**: Always use HTTPS in production

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Docker Support

### Building and Running with Docker

```bash
# Build the Docker image
make package

# Run the container
make run

# Stop the container
make stop-ui
```

The containerized app will be available at `http://localhost:3000`.

### Docker Compose Integration

The UI is integrated into the main docker-compose.yml file. When running with Docker Compose:

```bash
# From the root directory (not ui/vlei-ui)
./deploy.sh
```

This will start all services including:
- VLEI UI on port 3000
- KERIA on ports 3901-3903
- VLEI Server on port 7723
- Witness services on ports 5642-5647
- And other supporting services

When using Docker Compose, the services communicate internally using container names. See `docker-urls.md` for the correct URLs to use.

## License

See the parent project's license.
