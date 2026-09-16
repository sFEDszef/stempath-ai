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

Import the GitHub repository as a Next.js project, select a supported Node runtime matching CI, and use the existing build/start architecture without a Pages base path or static output directory. Verify `/api/chat` and demo behavior in a preview deployment. Add server-only `OPENAI_API_KEY` only when real AI is wanted; no key is required for the demo or validation. Configure a custom domain and DNS later. Authentication, database and billing require their own implementation and environment setup when introduced.
