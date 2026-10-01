# Deployment architecture and Pages retirement

STEMPath AI v0.3 is a Next.js server application. GitHub remains the source repository; no hosting provider is configured by this change.

## Why the old Action failed

Run 34948227020 used commit `c9fdc35`. Its step named "Build static export" ran `pnpm build`, which is `next build`. That revision's Next.js configuration had already removed `output: "export"` to support the POST `/api/chat` route. The successful build produced `.next/` (including server routes and static assets), not an `out/` export. The subsequent `test -f out/index.html` therefore failed on the fresh runner. A statically prerendered homepage does not mean the application is a static export.

Commit `a014477` already replaced the deployment jobs with validation. The workflow is now named `.github/workflows/ci.yml`; the obsolete `deploy-pages.yml` path is removed. CI runs lint, tests, TypeScript checking and a normal production build. It has no Pages upload, deployment job, Pages environment or write permissions. Historical failed runs remain visible; rerunning an old revision still uses that revision's workflow.

## Audit of Pages assumptions

| Item | Classification | Decision |
| --- | --- | --- |
| `output: "export"` | Incompatible with the current server API | Already absent; do not restore it. |
| `/stempath-ai` basePath and Pages assetPrefix | Obsolete deployment assumptions | Absent from active Next.js config; routes remain at the domain root. |
| `scripts/serve-export.mjs` | Obsolete for the current app | Retained as an unused historical v0.1 preview utility. It serves only `out/` under `/stempath-ai` and cannot run the API. No package script or CI job calls it. |
| Local ignored `out/` files | Obsolete generated artifacts | May remain from v0.1; their presence does not prove a current export. They are neither tracked nor deployed. |
| `out/` in `.gitignore` | Still needed as repository hygiene | Keep old generated files out of source control. |
| `.nojekyll` and Pages artifact/deploy configuration | Obsolete | No active workflow references remain. No tracked `.nojekyll` file exists. |
| `images.unoptimized` | Compatible, independent image setting | Retained to avoid unnecessary application behavior changes. It does not require static export. |
| `next dev`, `next build`, `next start` | Still needed | Preserve normal Next.js development and server production execution. |

GitHub Pages cannot host this full application because it does not execute the server-side chat route. Even credential-free demo chat uses that route. Do not remove server capabilities to recreate a Pages export. Any previously published v0.1 Pages site is separate from v0.3 and is not updated by CI.

## Future Vercel work (not configured yet)

Import the GitHub repository as a Next.js project, select a supported Node runtime matching CI, and use the existing build/start architecture without a Pages base path or static output directory. Verify `/api/chat` and demo behavior in a preview deployment. Add server-only `DEEPSEEK_API_KEY` only when real AI is wanted; no key is required for the demo or validation. Configure a custom domain and DNS later. Authentication, database and billing require their own implementation and environment setup when introduced.


## Custom domain

Official public URL: https://stempathai.com
Research entry: https://stempathai.com/?research=1

The existing `sfedszef/stempath-ai` Vercel project remains the host; GitHub main remains the deployment source. `www.stempathai.com` is configured in Vercel as a 308 permanent redirect to `stempathai.com`. DNS must validate before either custom hostname is usable. Keep https://stempath-ai.vercel.app available as a technical backup and for exporting old browser data; do not redirect preview deployment hosts.

Vercel DNS instructions observed on 2026-10-01:

| Type | Alibaba Cloud host | Target |
| --- | --- | --- |
| A | @ | 216.198.79.1 |
| CNAME | www | c1a4934dc2a10856.vercel-dns-017.com. |

Vercel did not specify a TTL or request TXT verification at this point. Use the DNS provider's default TTL (600 seconds is suitable if offered). Recheck the project Domains screen before future changes; these are observed project values, not universal Vercel defaults. Do not repeatedly change correct records while propagation is pending. Vercel provisions HTTPS after validation; no additional certificate purchase is needed.

### Configuration audit

- No hardcoded old production hostname existed in application routing. `/api/chat`, `/api/task-check` and `/api/coach-status` remain relative, same-origin requests.
- API origin checks compare the Origin host with the incoming Host (or request URL fallback), so custom domains, localhost and preview hosts work without an arbitrary-origin allowlist or wildcard CORS.
- `metadataBase`, canonical and Open Graph URL now use the official root domain. Existing creator, logo and favicon remain unchanged. All current application views share `/`; no invented page URLs are added.
- No robots/sitemap or structured-data routes existed; none were added solely for this migration.
- Historical Pages documentation is retained. No provider environment variables or credentials are changed.

### Browser-local data does not move between domains

The custom domain and old Vercel hostname are different browser origins. Projects, task library, language preference, research sessions and local settings do not transfer automatically. Keep the old address available while users back up data. Export the Task Library and v0.6 research-session bundle using their existing controls, then import them on the new domain. Do not claim that these exports transfer learner projects, notebooks or chat history: there is no full-project migration feature in this release. Retain the original browser/origin for that work. Do not clear old browser data until backups have been verified. No unsafe cross-origin storage access is attempted, and research schema remains 0.6.

### Mainland China access

The custom domain removes the public dependence on the `vercel.app` hostname and may improve accessibility, but it does not guarantee reliable access from mainland China. Hosting is still on Vercel; performance varies with region, ISP and international routing. A future China-region deployment may be needed for formal mainland student research, with ICP filing requirements assessed for the chosen infrastructure/location. This task does not migrate hosting.
