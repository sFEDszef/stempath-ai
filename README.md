# STEMPath AI

**Think · Explore · Build · Grow**

A responsive educational research prototype for primary and secondary STEM learners. The first challenge is a wind-powered car that travels at least 3 metres.

## Run locally

Requires Node.js 20.9+ and pnpm 11.19.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. For a production static preview:

```sh
pnpm build
pnpm start
```

The production preview opens at http://127.0.0.1:3000/stempath-ai/. `pnpm start` serves only the exported files; it does not run a Next.js backend.

`pnpm typecheck` checks TypeScript independently.

## MVP interactions

- Seven selectable STEM stages, synchronized across the sidebar, coach, and journey.
- Explicit, reversible stage completion. Selecting a stage does not mark learning complete.
- Independent conversations per stage, bilingual initial conversation, suggested replies, and free text messages.
- Three user-selectable support levels: Socratic questions, directional hints, and stronger scaffolds.
- Local PNG/JPEG/WebP image previews (5 MB per file), removal, and a My Files view.
- Notebook saved in browser local storage; resources, help, home, and project overview dialogs.
- Responsive desktop, tablet, and phone layouts; keyboard controls and Chinese IME-aware Enter handling.

## Structure

```text
src/app/             Next.js App Router entry points and responsive design tokens
src/components/      Reusable UI components and workspace composition
src/data/            Challenge, stages, support labels, and mock conversation
src/lib/coach.ts     Async mock adapter implementing CoachService
src/types/           Shared stage, message, artifact, and coach contracts
```

`CoachService.respond(CoachRequest)` accepts the current stage, support level, and message history. It returns a `CoachResponse` with text and suggested replies. Replace `mockCoach` with a client adapter to a server route when adding a backend. Server-side code should handle provider credentials, validation, request limits, and research-approved coaching instructions. No OpenAI SDK, API calls, API keys, or external AI service are integrated in this MVP.

The mock intentionally asks learners to predict, explain, compare, and evaluate evidence. It does not supply a finished design or present the mock as a real model. Image uploads are previews only; the coach does not analyse images.

## Data lifecycle

Chats, completion, support level, and images are session-only and reset on page reload. Notes persist only in the current browser. Nothing is sent to a research database. Do not treat this MVP as a data collection instrument. A future study will need its own consent, storage, access, and retention design. Fonts use Google Fonts with local system fallbacks.

## GitHub Pages deployment

Repository: `sFEDszef/stempath-ai`  
Expected public URL: https://sfedszef.github.io/stempath-ai/

The production build uses `output: "export"`, `basePath: "/stempath-ai"`, matching `assetPrefix`, trailing slashes, and unoptimized images. `pnpm build` writes the deployable site to `out/`. Development remains at the domain root. There is no server-side AI or image optimizer.

`.github/workflows/deploy-pages.yml` installs the pinned dependencies, builds the export, uploads `out/`, and deploys on every push to `main`. It also supports manual runs. Only the deployment job has Pages and OIDC write permissions. No personal access token or API key is needed.

### One-time repository settings

1. Open **Settings → Pages → Build and deployment** and choose **GitHub Actions** as the source. Do not choose a branch or a `/docs` folder.
2. If Actions are disabled or restricted, enable them under **Settings → Actions → General**, allowing the official `actions/*` actions and `pnpm/action-setup` used in this workflow.
3. If environment protection is configured, allow `main` to deploy to the `github-pages` environment and approve any required deployment review.
4. This repository is private. GitHub Free requires a public repository for Pages. Either change its visibility to public under **Settings → General → Danger Zone**, or keep it private with a plan that supports private-repository Pages. Publishing the website does not by itself require publishing the source when your plan supports private repositories.
5. After enabling Pages, open **Actions → Deploy STEMPath AI to GitHub Pages → Run workflow**, selecting `main`. Future pushes deploy automatically. Leave the custom domain blank for the URL above; keep HTTPS enforcement enabled.

The current UI uses local blob URLs for uploaded images and a CSS challenge illustration, so neither needs a base-path rewrite. Generated JS and CSS use the configured project prefix. Future files added to `public/` must be referenced with `/stempath-ai/` in production. Future routes must also be compatible with static export.

Chats, notes, uploads, and stage behavior remain unchanged. Google Fonts uses HTTPS and has system fallbacks. Deploying changes the browser origin, so notes saved on localhost do not transfer to the public site.

References: [Next.js static export](https://nextjs.org/docs/app/guides/static-exports), [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
