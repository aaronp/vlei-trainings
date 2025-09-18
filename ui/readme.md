# React UI for VLEIs

This project is a react UI for vleis using keria.


## How the UI talks to KERIA (at a glance)

KERIA exposes three logical HTTP interfaces you’ll care about:

Admin/API (often on 3901) — your UI talks here using Signify: create identifiers, manage ops, credentials, contacts, etc.

Protocol (often on 3902) — CESR-over-HTTP for inter-agent/KERI messages (KERIA handles this; your UI rarely calls it directly).

Boot/Agency (often on 3903) — one-time provisioning (“create my agent”). Lock this down to admins. 
GitHub
+1

Use the Signify TS client in your UI/backend for correct request signing & CESR encoding; KERIA expects Signify semantics.