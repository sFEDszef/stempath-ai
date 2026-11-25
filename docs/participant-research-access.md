# Participant login and researcher data review

Account mode uses the existing PostgreSQL tables and server authorization. Enable it only in a prepared environment with `PERSISTENCE_MODE=postgres`, `AUTH_MODE=participant`, and `STUDENT_TASK_MODE=ASSIGNED`. The Vercel local/demo defaults remain available; changing source code alone does not activate accounts there.

## Operator workflow

1. Sign in at the home page with the researcher/admin code and PIN. The authenticated server role determines the destination; there is no self-selected researcher role.
2. Create one student or a batch in Researcher management. New accounts are always STUDENT. Distribute the one-time PINs securely and hide them afterwards. Credential distribution files are separate from research exports.
3. Assign a task and research condition. Research text capture is OFF by default. Enable it per task only under the study's approved capture policy. This affects newly created projects for that assignment; it does not silently change an existing project's snapshot or reconstruct historical text.
4. Students sign in, see assigned tasks and their own saved projects, and use the learning workspace. Management APIs remain restricted even if a student manually constructs their URLs.
5. In the student's account row, select **View learning data** to see saved research sessions, completed stages, support history, coach reply count, model API calls, token usage and estimated active time. Demo coach replies can be nonzero while model API calls and tokens are zero.
6. Expand the conversation section for opted-in research text. Capture-OFF sessions explain why text is unavailable. Download JSON for the existing policy-filtered export. PINs, hashes, session cookies and internal security records are not added to the export.

The data review is a view of saved research records, not a new unrestricted endpoint for raw learning conversations. Browser-only projects are not automatically imported into an account. Active time is an interaction estimate, not a measure of attention or attainment.

## Persistence and historical sessions

The browser API client preserves the server-signed coach completion receipt so authenticated replies can pass the existing save verification. Malformed receipts fail explicitly; server verification is not bypassed.

Deployed `young-learner-v6` archives remain readable with their original version and policy. Continuing a project with a different current prompt archives its prior research session with `PROMPT_VERSION_CHANGE` and starts a new session. Learning project history remains intact; responses from different prompt versions are not mixed into one research session. No database migration is introduced.

## Release gates for ECS

- Validate lint, TypeScript, tests and production build; build the app and tooling images with the existing manual ACR workflow. Retain the release manifest and verify immutable digests and amd64 architecture.
- Back up the database before updating the app. Preserve PostgreSQL volumes and account/session secrets. Verify login, Secure/HttpOnly cookies, student isolation, data restoration, researcher review and export on the actual ECS release.
- Keep app port 3000 bound to loopback and PostgreSQL private. Set TRUST_PROXY only after the trusted Nginx ingress overwrites forwarding headers and direct access is blocked.
- Keep Demo AI until separately approved for paid provider calls. Do not introduce real student data during deployment smoke tests.
- The existing manual DNS certificate is not automatically renewable by itself. A webroot HTTP-01 renewal configuration can avoid DNS API credentials after both official domain names resolve to ECS. Verify the challenge path, perform Certbot reconfiguration/dry-run, enable renewal monitoring and a successful-renewal Nginx reload hook before marking renewal complete.
- DNS cutover, public access activation and any service interruption need the operator's explicit release approval. Keep Vercel and the prior A/CNAME values available for rollback. Do not claim mainland reachability until it has been tested from a mainland network.
- Local encrypted backups do not provide off-host recovery. Confirm the off-host backup/retention plan and the ACR production distribution arrangement before a real student pilot.

Local browser QA uses an isolated PGlite adapter outside the repository and fictitious LAB accounts. That adapter and its credentials must never be deployed. CI separately tests the committed server code with PostgreSQL 17.
