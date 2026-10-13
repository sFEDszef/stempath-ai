# ACR image distribution preparation (test only)

Based on production main `0549b7916513afe299fac9112e459d3bf42b7ba9`. No teaching/UI/research schema change. Current production stays on Vercel; no DNS changes, ECS start, student provisioning, production migration or paid AI calls are part of this workflow.

## Console-verified endpoints

The operator supplied these from the Shenzhen ACR console on 2026-10-13:

- Public: `crpi-a7nh7r2ht0me9dto.cn-shenzhen.personal.cr.aliyuncs.com`
- Same-region VPC: `crpi-a7nh7r2ht0me9dto-vpc.cn-shenzhen.personal.cr.aliyuncs.com`
- Namespace: `stempathai`
- Private repositories: `stempath-ai`, `stempath-postgres` (operator-created).

“专有网络” means VPC. GitHub-hosted runners use the public endpoint. ECS can test the VPC endpoint only when its VPC/network connectivity permits it. Never infer an enterprise or legacy registry endpoint. The workflow rejects a registry different from the verified public endpoint.

## Audited build dependencies

`Dockerfile`: deps installs the frozen pnpm lockfile with pnpm 11.19.0; tooling inherits all dependencies (including tsx and Drizzle), copies scripts and SQL migrations, and defaults to `pnpm db:migrate`. Builder creates Next.js standalone output in local/auth-disabled mode. Runner contains standalone/static/public files, runs as nextjs (uid 1001), and starts `node server.js`. It does not need pnpm, compiler or registry credentials. Migration tools are retained separately, not pruned as production-only dependencies. PostgreSQL remains major 17 (`postgres:17-bookworm` in the unchanged development Compose).

Main lockfile resolves Next 16.3.4, React 19.2.8, pg 8.23.1, drizzle-orm 0.44.7, tsx 4.23.15. Package scripts, application source, lockfile and existing CI remain unchanged. `NODE_IMAGE` is an optional Docker build argument; development retains the original default, while ACR builds override both dependency and runtime bases with the pinned official digest.

`deploy/image-sources.json` records direct official Docker Registry reads: library/node 24.21.0 bookworm-slim and library/postgres 17.11 bookworm. Both selected manifests and configs were verified as linux/amd64 with SHA-256, plus the multi-platform index digest. These are Docker Official Images; no unofficial mirror is used for CI. Workflow pull/build checks architecture and actual executable versions. Refresh this file deliberately after reviewing new patch releases; do not silently resolve floating tags in publishing CI. Registry provenance and digest integrity are verified; this is not a claim of upstream cryptographic image signatures or a vulnerability-free image.

## User-entered GitHub settings

Open repository Settings → Secrets and variables → Actions:

| Kind | Name | Value/purpose |
|---|---|---|
| Repository variable | ACR_REGISTRY | Public hostname above, without https or repository path |
| Repository secret | ACR_USERNAME | ACR access-credential login username for an approved CI identity |
| Repository secret | ACR_PASSWORD | Its ACR registry password, NOT the Alibaba Cloud web-login password |

Only the operator enters credentials. Do not send them in chat, commit them, put them in workflow inputs, pass them as Docker build arguments, or put them into ECS image env. docker/login-action supplies them to Docker credential storage on the ephemeral runner and logs out at job completion. Workflow token permissions are contents:read only; no SSH, access keys, id-token, packages:write or deployment token is needed.

Prefer a dedicated RAM CI identity authorized only for push/pull and Docker authorization on the two existing Shenzhen repositories, with no repository deletion, cloud administration, billing, ECS or DNS rights. A separate ECS pull-only identity is preferred. Official Personal Edition authorization examples use repository resources `acs:cr:cn-shenzhen:<account-id>:repository/stempathai/stempath-ai` and the matching postgres repository, with `cr:PushRepository`, `cr:PullRepository`, `cr:GetAuthorizationToken`. Validate the exact resource/auth-token scope for this personal instance in RAM; do not grant `cr:*` or AdministratorAccess merely to fix a failed login. Do not grant broad Get/List unless the operator specifically needs console browsing.

**New Personal Edition limitation:** official docs say only one RAM user can set the repository login password. Confirm whether the current instance and existing credential owner support the proposed CI identity. Do not replace/reset the existing password, create a new instance or silently widen permissions. If this blocks scoped credentials, pause for the operator to decide an acceptable test credential or future production registry. STS is supported by ACR in general, but this workflow does not claim GitHub OIDC/STS is configured for this Personal Edition instance. It does not require Alibaba Cloud account-login credentials.

References: [Personal Edition login](https://help.aliyun.com/en/acr/user-guide/use-a-container-registry-personal-edition-instance-to-push-and-pull-images), [repository access control](https://help.aliyun.com/en/acr/user-guide/repository-access-control), [new Personal Edition limits](https://www.alibabacloud.com/help/en/acr/user-guide/individual-edition-instance-independent-domain-name-capacity-limit).

## Manual workflow and release contract

Workflow: **Build and distribute ACR test images**, `.github/workflows/acr-images.yml`.

1. Review/merge the PR when approved. GitHub dispatch UI requires this workflow on the default branch before it is discoverable; PR validation can run before merge. No automatic image publishing or ECS deploy occurs on merge.
2. Operator enters the settings above. Run with `operation=verify-access` first. This checks the exact public endpoint and Docker login from hosted Ubuntu; it does not prove push/pull rights without a real repository operation.
3. Run `build-and-push` only after successful authentication. Official Buildx builds linux/amd64 builder, runner and tooling. All builds, lint, TypeScript, PGlite tests, actual PG17 tests, two repeated migration runs against a disposable runner database, unprivileged app HTTP smoke test, and Compose validation must pass **before any push**. The runner database has no production data or production credentials. It creates no users and calls no paid AI provider.
4. Push runner, tooling and the verified official PG17 mirror into ACR. Pull each digest back and check architecture. Publish a complete release JSON in the job summary/artifact only after all three succeed.

Tag names contain full source commit + workflow run ID + attempt, avoiding collisions/retries overwriting previous versions:

- `stempath-ai:app-<40-char-sha>-<run>-<attempt>`
- `stempath-ai:migrate-<40-char-sha>-<run>-<attempt>`
- `stempath-postgres:17.11-bookworm-<40-char-sha>-<run>-<attempt>`

Treat tags as write-once by procedure (Personal Edition tag immutability is not assumed). Deploy only the verified `repository@sha256:...` references. No latest tags are created. Pinning protects content identity; secure registry retention/deletion remains necessary.

ACR cannot atomically publish three manifests across repositories. A network/auth failure during publishing can leave a subset uploaded. The run stops, produces **no complete release manifest**, and the subset is not a usable release. Do not deploy partial results or remove existing images automatically. Retrying uses distinct attempt tags. Step logs show the first failed command without shell tracing or credential echo. Do not enable debug tracing for credentials. Store the successful release manifest securely; it contains no secrets.

## ECS pull-only test (separate operator action)

`docker-compose.ecs.yml` is independent of the unchanged development file. Copy `deploy/ecs.acr.env.example` to `deploy/ecs.acr.env` (ignored) and restrict to mode 600. Fill image variables using the complete release digest set. For the VPC test replace ONLY the public hostname with the verified VPC hostname; preserve repository and digest. Confirm the app and migration commit/run agree and PostgreSQL digest matches the approved source. Fill local database/session secrets privately; this file is never a build input.

Login on ECS interactively with the approved pull-only ACR identity. Do not supply the password on the command line or in a shared terminal recording. Docker's credential store needs restricted access; no password is in this repository. Then:

```sh
# Validate without printing interpolated secrets:
docker compose --env-file deploy/ecs.acr.env -f docker-compose.ecs.yml --profile ecs-pilot config --quiet
# Download ONLY; does not start services, create a DB volume, migrate or bootstrap:
docker compose --env-file deploy/ecs.acr.env -f docker-compose.ecs.yml --profile ecs-pilot pull
```

Check pulled image architecture and RepoDigests against the release manifest. Same-region VPC failure must be diagnosed (network/endpoint/permission) before considering the public hostname; do not change DNS or open database/Node ports. No Docker Hub Node pull/build occurs on ECS.

All services have the explicit ecs-pilot profile so default `up` does not start them. **Do not run up/run/start or bootstrap until separately approved.** The future profile is configured for PostgreSQL+participant mode with assigned tasks and Demo AI only. Its database volume is isolated as `stempath_acr_pilot_postgres_data`; never point at an existing production volume. PostgreSQL health gates migrations, migration success gates the app, which binds only 127.0.0.1:3000. Database has no host port. SSH22/3389/3000/5432 firewall rules and Vercel are not changed by these files.

Before actual learner access: production-grade registry/distribution decision, HTTPS/trusted ingress, backups/restoration test, research access/consent review, secure account bootstrap and separately approved migrations. This change does not enable real student registration/PIN use/data capture/DeepSeek billing.

## Costs and status

No additional cloud service is purchased. Personal Edition is for development/testing, with shared-resource/rate limits; do not assume production SLA. GitHub-hosted build minutes/artifact storage and public registry transfer may have account-dependent quotas/charges; verify the current account billing. Existing ECS/storage/public outgoing traffic continue their existing billing. VPC/private pull does not make all associated products cost-free. Production registry upgrades require separate approval.

Local lint/typecheck/tests/build results belong in the PR. Linux Docker build, ACR login/push verification and ECS pull test remain unverified until the operator adds secrets and the workflow/pull steps actually succeed. A successful local Next build alone is not evidence of image publication.
