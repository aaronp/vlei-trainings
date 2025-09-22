# Docker Service URLs

When running the VLEI UI with Docker Compose, use these URLs in the login form:

## From Host Machine (your browser):
- **KERIA Admin URL**: http://localhost:3901
- **KERIA Boot URL**: http://localhost:3903
- **VLEI UI**: http://localhost:3000

## Container-to-Container Communication:
When the UI needs to communicate with other services internally, it uses:
- **KERIA Admin**: http://keria:3901
- **KERIA Boot**: http://keria:3903
- **VLEI Server**: http://vlei-server:7723

## OOBI Endpoints:
- **Schema OOBIs**: http://localhost:3000/oobi/{schemaSaid}
- **VLEI Server Schema OOBI**: http://localhost:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao

## Notes:
- The UI login form should use localhost URLs (not container names) since the browser runs on your host machine
- The schema server is built into the UI and serves schemas on the same port (3000)