# v0.5.2 DeepSeek pilot

The existing STEMPath engine owns stage, selected support level, condition, focus, language, uncertainty/productive-turn indicators and artifact progress. It runs before generation. The model only writes coaching language; it cannot accept an escalation, change a level, mark mastery or mutate research state.

## Server architecture

`/api/chat` validates a bounded task-local request and rejects NO_AI before selecting a provider. `src/lib/ai/index.ts` selects deterministic Demo or `deepseekProvider.ts`; `provider.ts` defines safe errors/release metadata. All provider implementations are server-only. Chat Completions uses native server fetch at the official DeepSeek HTTPS host, `thinking: disabled`, temperature 0.3, max_tokens 500, no streaming. The model defaults to `deepseek-flash`; metadata reports the actual model returned by DeepSeek.

The server sends pedagogical system instructions plus a user data envelope containing current task fields (not the task ID), bounded recent messages, learning artifacts, progress and the latest message. It does not send research/session/event/device IDs, browser storage, analytics or tracking IDs. Uploaded image previews are not sent. Task text/history/artifacts are untrusted, including additionalInstructions. Never enter sensitive or identifying text; the provider necessarily receives learning text, and its retention policies apply.

## Configuration and modes

Set server-only `DEEPSEEK_API_KEY`, `AI_PROVIDER=deepseek`, `AI_MODEL=deepseek-flash`, `DEEPSEEK_BASE_URL=https://api.deepseek.com`. `.env.example` contains placeholders only. Never use NEXT_PUBLIC for credentials. No key is required for local development, tests or build. Production-only Vercel secrets do not apply to Preview/local. Redeploy Production after changing variables.

- Auto: use DeepSeek when configured; safe failures become explicitly labeled Demo fallback.
- DeepSeek: real provider only; absent configuration, upstream or guard failures show a retryable error. Never silently substitutes Demo.
- Demo: deterministic, zero paid calls. AI_PROVIDER=demo also selects Demo in Auto.
- NO_AI: blocked before provider selection, zero paid calls.

Each actual response has its own provider label, preventing old Demo messages being mistaken for AI after changing mode. Errors leave the existing retry mechanism and student message intact.

## Pedagogy and safeguards

L1 asks exactly one short question, with no hints/examples/options. L2 supplies one hint plus one question. L3 supplies a partial structure or choices while keeping learner decisions open. Support changes acknowledge the choice in the active language. No level may deliver a complete design or final answer. Challenge intent instead generates a short unverified claim; evaluation asks for evidence without revealing correctness.

A conservative output guard rejects empty/truncated/malformed/overlong output and obvious L1 explanations, lists, multiple questions or procedures. Auto then uses safe Demo; forced DeepSeek returns a retryable error. This is not semantic proof of pedagogical quality or injection immunity. There is no paid regeneration and no automatic retry: one upstream call maximum per request, with a 24-second timeout. User retry is explicit. 401/402 are never automatically retried; 429/5xx/network/timeouts are sanitized. No upstream response bodies, keys or reasoning traces are returned or logged.

## Research and verification

AI_RESPONSE events retain safe coach metadata: provider, actual model, responseMode, STEMPathVersion 0.5.2, promptVersion deepseek-v1 and input/output/total tokens when supplied. JSON and CSV export these fields even when message storage is OFF. Demo fallback carries a safe reason code. Failed-call token usage is unavailable; exported usage is not a billing ledger. Research storage remains local and text capture opt-in. Automated tests mock fetch and do not spend API credit; CI has no provider secrets. Live production checks are manual and deliberately small.

## Pilot limitations

Model replies are nondeterministic despite fixed temperature. Prompt and format tests cannot demonstrate live semantic safety; supervised bilingual evaluation is required. The guard may reject a useful answer or miss an unsafe one. The public endpoint is not authenticated or protected by a distributed quota; origin validation is not access control. Before a broader pilot, add server-side usage limits/access controls, cost monitoring, consent/retention review and systematic age-appropriate pedagogy evaluation. No database, authentication, billing or Pages deployment is added in this release.
