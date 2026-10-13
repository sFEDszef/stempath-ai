#!/usr/bin/env bash
# Only GitHub-hosted CI builds/publishes here. No SSH, ECS, DNS or production DB access.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
: "${ACR_REGISTRY:?Set the console-verified public registry}"
: "${GITHUB_SHA:?Missing source commit}"
: "${GITHUB_RUN_ID:?Missing unique workflow run}"
: "${GITHUB_RUN_ATTEMPT:?Missing workflow attempt}"
[[ "$ACR_REGISTRY" == 'crpi-a7nh7r2ht0me9dto.cn-shenzhen.personal.cr.aliyuncs.com' ]]
[[ "$GITHUB_SHA" =~ ^[0-9a-f]{40}$ && "$GITHUB_RUN_ID" =~ ^[0-9]+$ && "$GITHUB_RUN_ATTEMPT" =~ ^[0-9]+$ ]]
node_image=$(python3 -c 'import json; x=json.load(open("deploy/image-sources.json"))["node"]; print(x["source"]+"@"+x["digest"])')
pg_image=$(python3 -c 'import json; x=json.load(open("deploy/image-sources.json"))["postgres"]; print(x["source"]+"@"+x["digest"])')
suffix="$GITHUB_SHA-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
app="$ACR_REGISTRY/stempathai/stempath-ai:app-$suffix"
migrate="$ACR_REGISTRY/stempathai/stempath-ai:migrate-$suffix"
pg="$ACR_REGISTRY/stempathai/stempath-postgres:17.11-bookworm-$suffix"
containers=()
cleanup() { for c in "${containers[@]}"; do docker rm -f -v "$c" >/dev/null 2>&1 || true; done; }
trap cleanup EXIT
if [[ "${1:-}" == build ]]; then
  # Resolve only immutable official platform manifests; verify config and actual versions.
  docker pull --platform linux/amd64 "$node_image"
  docker pull --platform linux/amd64 "$pg_image"
  for image in "$node_image" "$pg_image"; do
    [[ "$(docker image inspect "$image" --format '{{.Os}}/{{.Architecture}}')" == linux/amd64 ]]
  done
  [[ "$(docker run --rm "$node_image" node --version)" == v24.21.0 ]]
  [[ "$(docker run --rm "$pg_image" postgres --version)" == 'postgres (PostgreSQL) 17.11'* ]]
  for target in builder runner tooling; do
    docker buildx build --platform linux/amd64 --load --provenance=false \
      --build-arg "NODE_IMAGE=$node_image" --target "$target" \
      --label "org.opencontainers.image.source=https://github.com/sFEDszef/stempath-ai" \
      --label "org.opencontainers.image.revision=$GITHUB_SHA" \
      -t "stempath-$target:ci" .
  done
  docker run --rm -e AI_PROVIDER=demo -e PERSISTENCE_MODE=local -e AUTH_MODE=disabled \
    stempath-builder:ci sh -c 'pnpm lint && pnpm typecheck && pnpm test'
  # This database is disposable and local to the runner; never uses any database secret.
  db="stempath-ci-db-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
  containers+=("$db")
  docker run -d --name "$db" -e POSTGRES_DB=stempath_test -e POSTGRES_USER=stempath_test \
    -e POSTGRES_PASSWORD=isolated_ci_only "$pg_image"
  ready=false
  for i in {1..60}; do
    if docker exec "$db" pg_isready -U stempath_test -d stempath_test; then ready=true; break; fi
    sleep 2
  done
  [[ "$ready" == true ]]
  database_url='postgres://stempath_test:isolated_ci_only@127.0.0.1:5432/stempath_test'
  # Repeated migration smoke test, then actual PostgreSQL application tests.
  for i in 1 2; do
    docker run --rm --network "container:$db" -e "DATABASE_URL=$database_url" stempath-tooling:ci
  done
  docker run --rm --network "container:$db" -e "TEST_DATABASE_URL=$database_url" \
    -e AI_PROVIDER=demo -e PERSISTENCE_MODE=local -e AUTH_MODE=disabled stempath-builder:ci pnpm test
  web="stempath-ci-web-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
  containers+=("$web")
  docker run -d --name "$web" -p 127.0.0.1::3000 -e AI_PROVIDER=demo \
    -e PERSISTENCE_MODE=local -e AUTH_MODE=disabled stempath-runner:ci
  port=$(docker port "$web" 3000/tcp | sed 's/.*://')
  ready=false
  for i in {1..60}; do
    if curl --fail --silent "http://127.0.0.1:$port/" -o /tmp/stempath-home.html; then ready=true; break; fi
    sleep 2
  done
  [[ "$ready" == true ]]
  grep -q STEMPath /tmp/stempath-home.html
  [[ "$(docker image inspect stempath-runner:ci --format '{{.Config.User}}')" == nextjs ]]
  export STEMPATH_APP_IMAGE="$app@sha256:$(printf '0%.0s' {1..64})"
  export STEMPATH_MIGRATE_IMAGE="$migrate@sha256:$(printf '0%.0s' {1..64})"
  export STEMPATH_POSTGRES_IMAGE="$pg@sha256:$(printf '0%.0s' {1..64})"
  export POSTGRES_PASSWORD=isolated_ci_only DATABASE_URL="$database_url" SESSION_SECRET=isolated-ci-session-secret-never-production
  docker compose -f docker-compose.ecs.yml --profile ecs-pilot config --quiet
  docker tag stempath-runner:ci "$app"
  docker tag stempath-tooling:ci "$migrate"
  docker tag "$pg_image" "$pg"
  echo 'All images built and tested; no images published by the build step.' >> "$GITHUB_STEP_SUMMARY"
elif [[ "${1:-}" == publish ]]; then
  # Remote writes are not atomic across ACR repos. Only the manifest below denotes success.
  # Unique run/attempt tags avoid overwriting earlier releases; ECS must use digest references.
  export APP_TAG="$app" MIGRATE_TAG="$migrate" POSTGRES_TAG="$pg"
  for image in "$app" "$migrate" "$pg"; do
    [[ "$(docker image inspect "$image" --format '{{.Os}}/{{.Architecture}}')" == linux/amd64 ]]
  done
  for image in "$app" "$migrate" "$pg"; do
    docker push "$image"
    digest=$(docker buildx imagetools inspect "$image" | awk '/^Digest:/ {print $2; exit}')
    [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]
    docker pull --platform linux/amd64 "$image@$digest"
    [[ "$(docker image inspect "$image@$digest" --format '{{.Os}}/{{.Architecture}}')" == linux/amd64 ]]
    case "$image" in
      "$app") export APP_DIGEST="$digest" ;;
      "$migrate") export MIGRATE_DIGEST="$digest" ;;
      "$pg") export POSTGRES_DIGEST="$digest" ;;
    esac
  done
  python3 - <<'PY'
import json, os
from pathlib import Path
manifest={'status':'complete','commit':os.environ['GITHUB_SHA'],'run':os.environ['GITHUB_RUN_ID'],
          'platform':'linux/amd64','sources':json.loads(Path('deploy/image-sources.json').read_text()),'images':{}}
for key in ('APP','MIGRATE','POSTGRES'):
    tag=os.environ[key+'_TAG']; digest=os.environ[key+'_DIGEST']
    manifest['images'][key.lower()]={'tag':tag,'digest':digest,'reference':tag.split(':')[0]+'@'+digest}
Path('release-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as out:
    out.write('\nComplete ACR test image set (no ECS deployment):\n```json\n'+json.dumps(manifest,indent=2)+'\n```\n')
PY
else
  echo 'Expected build or publish' >&2; exit 1
fi
