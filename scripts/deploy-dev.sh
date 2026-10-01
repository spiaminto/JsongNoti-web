#!/usr/bin/env bash
# 현재 브랜치의 HEAD 를 dev 서버에 배포합니다.
# 브랜치를 push 하고 deploy-dev 태그를 HEAD 로 옮겨 push 하면 GitHub Actions(Deploy dev)가 빌드와 배포를 합니다.
# 이 스크립트는 그 실행이 끝날 때까지 기다렸다가 결과를 알려 줍니다.
# 배포가 실패하면 ~/.ssh/config 의 jsongnoti-dev 별칭으로 서버에 접속해 앱 로그를 보여 줍니다.
set -euo pipefail

REPO=spiaminto/JsongNoti-web
TAG=deploy-dev
WORKFLOW=.github/workflows/deploy-dev.yml
SSH_ALIAS=jsongnoti-dev
POLL_SECONDS=15
TIMEOUT_SECONDS=900

print_server_log() {
  echo "---- 서버 앱 로그 (journalctl -u jsongnoti-dev, 마지막 40줄) ----"
  if ! ssh -o BatchMode=yes -o ConnectTimeout=10 "$SSH_ALIAS" 'journalctl -u jsongnoti-dev -n 40 --no-pager'; then
    echo "서버에 접속하지 못했습니다. ~/.ssh/config 에 다음과 같은 별칭이 있는지 확인하세요." >&2
    echo "  Host $SSH_ALIAS / HostName jsongnoti-dev.spiaminto.com / User ubuntu / IdentityFile <개인 키 경로>" >&2
  fi
}

cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "커밋하지 않은 변경이 있습니다. 커밋한 뒤 다시 실행하세요." >&2
  git status --short --untracked-files=no >&2
  exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = HEAD ]; then
  echo "브랜치가 아닌 커밋을 보고 있습니다. 배포할 브랜치로 체크아웃하세요." >&2
  exit 1
fi

if ! git cat-file -e "HEAD:$WORKFLOW" 2>/dev/null; then
  echo "HEAD 에 $WORKFLOW 가 없습니다. develop 을 이 브랜치에 합친 뒤 다시 실행하세요." >&2
  exit 1
fi

SHA=$(git rev-parse HEAD)
START=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "배포 대상: $BRANCH $(git log -1 --format='%h %s')"
git push -u origin "$BRANCH"
git tag -f "$TAG" "$SHA" >/dev/null
# 태그가 이미 이 커밋에 있으면 push 해도 바뀐 것이 없어 Actions 가 시작되지 않으므로, 원격 태그를 먼저 지웁니다.
if [ "$(git ls-remote origin "refs/tags/$TAG" | cut -f1)" = "$SHA" ]; then
  git push -q origin ":refs/tags/$TAG"
fi
git push -f origin "refs/tags/$TAG"

echo "Actions 실행을 기다립니다 (최대 $((TIMEOUT_SECONDS / 60))분)."
API="https://api.github.com/repos/$REPO/actions/runs?event=push&head_sha=$SHA&created=%3E%3D$START&per_page=1"
WAITED=0
while [ "$WAITED" -lt "$TIMEOUT_SECONDS" ]; do
  sleep "$POLL_SECONDS"
  WAITED=$((WAITED + POLL_SECONDS))
  BODY=$(curl -fsS -H 'Accept: application/vnd.github+json' "$API" || true)
  # workflow_runs[0] 의 필드 가운데 처음 나오는 status, conclusion, html_url 이 그 실행의 값입니다.
  STATUS=$(printf '%s' "$BODY" | grep -o '"status": *"[a-z_]*"' | head -1 | sed 's/.*"\([a-z_]*\)"$/\1/')
  [ -z "$STATUS" ] && { echo "  ${WAITED}초: 실행이 아직 보이지 않습니다"; continue; }
  RUN_URL=$(printf '%s' "$BODY" | grep -o '"html_url": *"[^"]*/actions/runs/[0-9]*"' | head -1 | sed 's/.*"\(http[^"]*\)"$/\1/')
  if [ "$STATUS" != completed ]; then
    echo "  ${WAITED}초: $STATUS"
    continue
  fi
  CONCLUSION=$(printf '%s' "$BODY" | grep -o '"conclusion": *"[a-z_]*"' | head -1 | sed 's/.*"\([a-z_]*\)"$/\1/')
  echo "결과: $CONCLUSION"
  echo "기록: $RUN_URL"
  [ "$CONCLUSION" = success ] && echo "https://jsongnoti-dev.spiaminto.com 에 $(git log -1 --format=%h) 가 올라갔습니다." && exit 0
  print_server_log
  exit 1
done

echo "${TIMEOUT_SECONDS}초 안에 끝나지 않았습니다. https://github.com/$REPO/actions 에서 확인하세요." >&2
exit 1
